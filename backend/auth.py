"""Authentification : utilisateurs (SQLite), hachage bcrypt, jetons JWT.

Stockage volontairement minimal (sqlite3 stdlib, pas d'ORM) : la base vit dans
le volume persistant /data, comme logs.json. Pensé pour ~quelques dizaines
d'utilisateurs avec du turnover (alternants/stagiaires).
"""
from __future__ import annotations

import os
import secrets
import sqlite3
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# ── Configuration ────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("BACKEND_DATA_DIR", str(BASE_DIR))).resolve()
DB_PATH = DATA_DIR / "app.db"

JWT_ALGORITHM = "HS256"
TOKEN_TTL = timedelta(hours=8)  # une journée de travail

# Secret de signature des jetons. En prod il DOIT être fourni (sinon les jetons
# ne survivent pas à un redémarrage et n'importe qui pourrait en forger).
_SECRET = os.environ.get("AUTH_SECRET", "").strip()
if not _SECRET:
    _SECRET = secrets.token_urlsafe(48)
    print(
        "⚠️  AUTH_SECRET non défini : un secret éphémère a été généré. "
        "Les sessions seront invalidées à chaque redémarrage. "
        "Définir AUTH_SECRET en production.",
        flush=True,
    )

_db_lock = threading.Lock()


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Crée la table users si absente, puis amorce l'admin initial via l'env."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with _db_lock, _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
                full_name     TEXT NOT NULL DEFAULT '',
                password_hash TEXT NOT NULL,
                role          TEXT NOT NULL DEFAULT 'user',
                active        INTEGER NOT NULL DEFAULT 1,
                created_at    TEXT NOT NULL
            )
            """
        )
    _seed_initial_admin()


def _seed_initial_admin() -> None:
    """Crée un admin depuis ADMIN_EMAIL/ADMIN_PASSWORD si la base est vide."""
    email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD", "")
    if not email or not password:
        return
    with _db_lock, _connect() as conn:
        count = conn.execute("SELECT COUNT(*) AS n FROM users").fetchone()["n"]
        if count > 0:
            return
        conn.execute(
            "INSERT INTO users (email, full_name, password_hash, role, active, created_at) "
            "VALUES (?, ?, ?, 'admin', 1, ?)",
            (email, "Administrateur", hash_password(password),
             datetime.now(timezone.utc).isoformat(timespec="seconds")),
        )
    print(f"✅ Admin initial créé : {email}", flush=True)


# ── Mots de passe ─────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# ── CRUD utilisateurs ─────────────────────────────────────────────────────────
def _row_to_user(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None
    return {
        "id": row["id"],
        "email": row["email"],
        "full_name": row["full_name"],
        "role": row["role"],
        "active": bool(row["active"]),
        "created_at": row["created_at"],
    }


def get_user_by_email(email: str) -> dict | None:
    """Retourne l'utilisateur (avec password_hash) ou None."""
    with _db_lock, _connect() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE email = ? COLLATE NOCASE", (email.strip(),)
        ).fetchone()
    if row is None:
        return None
    user = _row_to_user(row)
    assert user is not None
    user["password_hash"] = row["password_hash"]
    return user


def get_user_by_id(user_id: int) -> dict | None:
    with _db_lock, _connect() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return _row_to_user(row)


def list_users() -> list[dict]:
    with _db_lock, _connect() as conn:
        rows = conn.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
    return [_row_to_user(r) for r in rows]  # type: ignore[misc]


def create_user(email: str, password: str, full_name: str = "", role: str = "user") -> dict:
    email = email.strip().lower()
    if "@" not in email or len(email) < 3:
        raise ValueError("Adresse e-mail invalide.")
    if len(password) < 8:
        raise ValueError("Le mot de passe doit contenir au moins 8 caractères.")
    if role not in {"user", "admin"}:
        raise ValueError("Rôle invalide.")
    with _db_lock, _connect() as conn:
        exists = conn.execute(
            "SELECT 1 FROM users WHERE email = ? COLLATE NOCASE", (email,)
        ).fetchone()
        if exists:
            raise ValueError("Un utilisateur avec cet e-mail existe déjà.")
        cur = conn.execute(
            "INSERT INTO users (email, full_name, password_hash, role, active, created_at) "
            "VALUES (?, ?, ?, ?, 1, ?)",
            (email, full_name.strip(), hash_password(password), role,
             datetime.now(timezone.utc).isoformat(timespec="seconds")),
        )
        user_id = cur.lastrowid
    user = get_user_by_id(int(user_id))
    assert user is not None
    return user


def update_user(user_id: int, *, active: bool | None = None,
                role: str | None = None, password: str | None = None) -> dict:
    fields, params = [], []
    if active is not None:
        fields.append("active = ?")
        params.append(1 if active else 0)
    if role is not None:
        if role not in {"user", "admin"}:
            raise ValueError("Rôle invalide.")
        fields.append("role = ?")
        params.append(role)
    if password is not None:
        if len(password) < 8:
            raise ValueError("Le mot de passe doit contenir au moins 8 caractères.")
        fields.append("password_hash = ?")
        params.append(hash_password(password))
    if not fields:
        raise ValueError("Aucune modification fournie.")
    params.append(user_id)
    with _db_lock, _connect() as conn:
        cur = conn.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = ?", params)
        if cur.rowcount == 0:
            raise ValueError("Utilisateur introuvable.")
    user = get_user_by_id(user_id)
    assert user is not None
    return user


def delete_user(user_id: int) -> None:
    with _db_lock, _connect() as conn:
        cur = conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        if cur.rowcount == 0:
            raise ValueError("Utilisateur introuvable.")


def count_active_admins(exclude_id: int | None = None) -> int:
    with _db_lock, _connect() as conn:
        if exclude_id is None:
            row = conn.execute(
                "SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1"
            ).fetchone()
        else:
            row = conn.execute(
                "SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1 AND id != ?",
                (exclude_id,),
            ).fetchone()
    return int(row["n"])


# ── Jetons JWT ────────────────────────────────────────────────────────────────
def create_access_token(user: dict) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user["id"]),
        "email": user["email"],
        "role": user["role"],
        "iat": now,
        "exp": now + TOKEN_TTL,
    }
    return jwt.encode(payload, _SECRET, algorithm=JWT_ALGORITHM)


def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, _SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expirée, reconnectez-vous.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton invalide.",
        )


# ── Dépendances FastAPI ───────────────────────────────────────────────────────
_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = _decode_token(credentials.credentials)
    user = get_user_by_id(int(payload.get("sub", 0)))
    if user is None or not user["active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Compte introuvable ou désactivé.",
        )
    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs.",
        )
    return user

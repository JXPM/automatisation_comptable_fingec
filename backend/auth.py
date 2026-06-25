"""Authentification : utilisateurs (SQLite), hachage bcrypt, jetons JWT.

Stockage volontairement minimal (sqlite3 stdlib, pas d'ORM) : la base vit dans
le volume persistant /data, comme logs.json. Pensé pour ~quelques dizaines
d'utilisateurs avec du turnover (alternants/stagiaires).
"""
from __future__ import annotations

import hashlib
import os
import secrets
import sqlite3
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

import password_policy

# Nom du cookie httpOnly qui porte le jeton de session côté navigateur.
COOKIE_NAME = "fingec_token"

# ── Configuration ────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("BACKEND_DATA_DIR", str(BASE_DIR))).resolve()
DB_PATH = DATA_DIR / "app.db"

JWT_ALGORITHM = "HS256"
TOKEN_TTL = timedelta(hours=8)  # une journée de travail

# Durée de validité des liens de mot de passe envoyés par e-mail.
# - "setup"  : première définition du mot de passe (création de compte) → long.
# - "reset"  : mot de passe oublié → court (limite la fenêtre d'abus).
RESET_TOKEN_TTL = {
    "setup": timedelta(hours=72),
    "reset": timedelta(hours=2),
}

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
        # Attribution client -> comptable. Les clients vivent dans Google Sheets ;
        # on les référence par leur Email (clé unique). Un client a au plus un
        # propriétaire, un utilisateur peut en avoir plusieurs (1-N).
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS client_assignments (
                client_email TEXT PRIMARY KEY COLLATE NOCASE,
                user_id      INTEGER NOT NULL,
                assigned_at  TEXT NOT NULL
            )
            """
        )
        # Jetons de mot de passe envoyés par e-mail (création de compte / oubli).
        # On ne stocke QUE le hash SHA-256 du jeton : même si la base fuite, les
        # liens en circulation restent inexploitables. Chaque jeton est à usage
        # unique (used_at) et expire (expires_at).
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS password_tokens (
                token_hash TEXT PRIMARY KEY,
                user_id    INTEGER NOT NULL,
                purpose    TEXT NOT NULL DEFAULT 'reset',
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                used_at    TEXT
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
    password_policy.validate_strength(password, email=email)
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
        password_policy.validate_strength(password)
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
        # Les clients de cet utilisateur redeviennent non attribués.
        conn.execute("DELETE FROM client_assignments WHERE user_id = ?", (user_id,))


# ── Attribution des clients ───────────────────────────────────────────────────
def get_assignments() -> dict[str, int]:
    """Retourne le mapping {email_client (minuscule): user_id}."""
    with _db_lock, _connect() as conn:
        rows = conn.execute("SELECT client_email, user_id FROM client_assignments").fetchall()
    return {row["client_email"].strip().lower(): row["user_id"] for row in rows}


def assigned_emails_for(user_id: int) -> set[str]:
    """Emails (minuscule) des clients attribués à cet utilisateur."""
    with _db_lock, _connect() as conn:
        rows = conn.execute(
            "SELECT client_email FROM client_assignments WHERE user_id = ?", (user_id,)
        ).fetchall()
    return {row["client_email"].strip().lower() for row in rows}


def set_assignment(client_email: str, user_id: int | None) -> None:
    """Attribue un client à un utilisateur, ou retire l'attribution si user_id est None."""
    email = client_email.strip().lower()
    if not email:
        raise ValueError("Email client manquant.")
    with _db_lock, _connect() as conn:
        if user_id is None:
            conn.execute(
                "DELETE FROM client_assignments WHERE client_email = ? COLLATE NOCASE", (email,)
            )
            return
        if conn.execute("SELECT 1 FROM users WHERE id = ?", (user_id,)).fetchone() is None:
            raise ValueError("Utilisateur introuvable.")
        conn.execute(
            "INSERT INTO client_assignments (client_email, user_id, assigned_at) "
            "VALUES (?, ?, ?) "
            "ON CONFLICT(client_email) DO UPDATE SET "
            "  user_id = excluded.user_id, assigned_at = excluded.assigned_at",
            (email, user_id, datetime.now(timezone.utc).isoformat(timespec="seconds")),
        )


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


# ── Jetons de mot de passe (liens e-mail) ─────────────────────────────────────
def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def create_password_token(user_id: int, purpose: str = "reset") -> str:
    """Génère un jeton à usage unique pour (re)définir un mot de passe.

    Renvoie le jeton EN CLAIR (à mettre dans le lien e-mail). Seul son hash est
    stocké. Les éventuels jetons précédents non utilisés du même utilisateur sont
    invalidés : un seul lien reste valable à la fois.
    """
    if purpose not in RESET_TOKEN_TTL:
        raise ValueError("Type de jeton invalide.")
    raw = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    expires = now + RESET_TOKEN_TTL[purpose]
    with _db_lock, _connect() as conn:
        if conn.execute("SELECT 1 FROM users WHERE id = ?", (user_id,)).fetchone() is None:
            raise ValueError("Utilisateur introuvable.")
        conn.execute(
            "DELETE FROM password_tokens WHERE user_id = ? AND used_at IS NULL", (user_id,)
        )
        conn.execute(
            "INSERT INTO password_tokens (token_hash, user_id, purpose, created_at, expires_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (_hash_token(raw), user_id, purpose,
             now.isoformat(timespec="seconds"), expires.isoformat(timespec="seconds")),
        )
    return raw


def verify_password_token(raw: str) -> dict | None:
    """Retourne {user_id, purpose} si le jeton est valide (non utilisé, non expiré)."""
    if not raw:
        return None
    with _db_lock, _connect() as conn:
        row = conn.execute(
            "SELECT user_id, purpose, expires_at, used_at FROM password_tokens WHERE token_hash = ?",
            (_hash_token(raw),),
        ).fetchone()
    if row is None or row["used_at"] is not None:
        return None
    if datetime.fromisoformat(row["expires_at"]) < datetime.now(timezone.utc):
        return None
    return {"user_id": row["user_id"], "purpose": row["purpose"]}


def consume_password_token(raw: str, new_password: str) -> dict:
    """Valide le jeton, change le mot de passe et marque le jeton comme utilisé.

    Atomique : tout se fait sous le même verrou/transaction pour éviter qu'un
    jeton soit rejoué en parallèle.
    """
    token_hash = _hash_token(raw or "")
    now = datetime.now(timezone.utc)
    with _db_lock, _connect() as conn:
        row = conn.execute(
            "SELECT user_id, expires_at, used_at FROM password_tokens WHERE token_hash = ?",
            (token_hash,),
        ).fetchone()
        if row is None or row["used_at"] is not None:
            raise ValueError("Lien invalide ou déjà utilisé.")
        if datetime.fromisoformat(row["expires_at"]) < now:
            raise ValueError("Lien expiré. Demandez-en un nouveau.")
        # Politique appliquée une fois le lien validé (l'e-mail du compte sert au
        # contrôle « le mot de passe ne contient pas l'adresse »).
        urow = conn.execute("SELECT email FROM users WHERE id = ?", (row["user_id"],)).fetchone()
        password_policy.validate_strength(new_password, email=urow["email"] if urow else None)
        conn.execute(
            "UPDATE users SET password_hash = ?, active = 1 WHERE id = ?",
            (hash_password(new_password), row["user_id"]),
        )
        conn.execute(
            "UPDATE password_tokens SET used_at = ? WHERE token_hash = ?",
            (now.isoformat(timespec="seconds"), token_hash),
        )
        user_id = row["user_id"]
    user = get_user_by_id(int(user_id))
    assert user is not None
    return user


def purge_expired_tokens() -> int:
    """Supprime les jetons de mot de passe expirés ou déjà utilisés.

    Hygiène RGPD (minimisation) : ces lignes ne servent plus à rien une fois le
    jeton consommé ou périmé. Renvoie le nombre de lignes supprimées.
    """
    now_iso = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with _db_lock, _connect() as conn:
        cur = conn.execute(
            "DELETE FROM password_tokens WHERE used_at IS NOT NULL OR expires_at < ?",
            (now_iso,),
        )
        return cur.rowcount


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
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict:
    # Précédence à l'en-tête Authorization (clients hors navigateur : CLI, tests),
    # puis repli sur le cookie httpOnly posé au login (navigateur).
    token = credentials.credentials if credentials is not None else None
    if not token:
        token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = _decode_token(token)
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

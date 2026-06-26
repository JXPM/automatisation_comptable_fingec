from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, EmailStr
from pathlib import Path
from datetime import datetime, timedelta
import asyncio
import os
import re
import json
import secrets
import uuid

import httpx

from processor import load_file, clean_data, compute_vat, build_output, detect_anomalies, validate
from journal import build_journal, write_journal_xlsx, journal_totals
import auth
import emailer
import observability
import password_policy
import ratelimit
from auth import get_current_user, require_admin
from ai.api import router as ai_router
from ai import store as ai_store

# Initialise Sentry au plus tôt (avant la création de l'app) si SENTRY_DSN est
# défini ; no-op sinon. Capture les exceptions non gérées des endpoints.
observability.init_sentry()

BASE_DIR = Path(__file__).resolve().parent.parent
# DATA_DIR: répertoire racine pour uploads/outputs/logs.
# Sur Render, pointer vers le mount d'un disque persistant (ex: /var/data).
DATA_DIR = Path(os.environ.get("BACKEND_DATA_DIR", str(BASE_DIR))).resolve()

# Origines autorisées (CORS). Comma-separated en prod, ex:
# FRONTEND_ORIGINS=http://localhost:5173,https://fingec.vercel.app
_DEFAULT_ORIGINS = "http://localhost:5173"
ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("FRONTEND_ORIGINS", _DEFAULT_ORIGINS).split(",") if o.strip()
]

MAX_UPLOAD_BYTES = 50 * 1024 * 1024  # 50 MiB
_SAFE_NAME_RE = re.compile(r"[^A-Za-z0-9._-]+")

# ── Conservation des données (RGPD : minimisation) ───────────────────────────
# Au-delà de ces durées, les fichiers de sortie et les entrées de journal sont
# purgés automatiquement. Configurable par variable d'environnement.
# 0 = désactiver la purge (conservation illimitée).
OUTPUT_RETENTION_DAYS = int(os.environ.get("OUTPUT_RETENTION_DAYS", "90"))
LOGS_RETENTION_DAYS   = int(os.environ.get("LOGS_RETENTION_DAYS", "365"))
PURGE_INTERVAL_SECONDS = 24 * 60 * 60  # passage quotidien

# URL interne du service n8n (résolu par le DNS Docker sur le réseau partagé).
# Le frontend appelle /n8n/... → on relaie ici APRÈS vérification du JWT, pour que
# n8n ne soit jamais joignable sans authentification.
N8N_BASE_URL = os.environ.get("N8N_BASE_URL", "http://localhost:5678").rstrip("/")


def _safe_filename(name: str | None) -> str:
    """Strip directory components and reduce to a conservative whitelist."""
    if not name:
        raise HTTPException(status_code=400, detail="Nom de fichier manquant.")
    base = Path(name).name  # drops any path components
    cleaned = _SAFE_NAME_RE.sub("_", base).strip("._-")
    if not cleaned or cleaned in {".", ".."}:
        raise HTTPException(status_code=400, detail="Nom de fichier invalide.")
    return cleaned


def _resolve_within(directory: Path, filename: str) -> Path:
    """Resolve `directory / filename` and refuse paths that escape `directory`."""
    base = directory.resolve()
    candidate = (base / filename).resolve()
    if base != candidate and base not in candidate.parents:
        raise HTTPException(status_code=400, detail="Chemin invalide.")
    return candidate

app = FastAPI(
    title="Automatisation Comptable",
    description="API pour importer des fichiers Shopify/TikTok et générer un export Quadra.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,  # le cookie de session httpOnly doit traverser CORS
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routeur de la brique IA (catégorisation comptable) sous /api/ai.
app.include_router(ai_router)


# ── Cookie de session & limites anti-bruteforce ──────────────────────────────
# Le jeton de session est posé dans un cookie httpOnly + Secure : inaccessible au
# JavaScript (anti-XSS), SameSite=Lax (anti-CSRF sur les requêtes cross-site).
AUTH_COOKIE_SAMESITE = os.environ.get("AUTH_COOKIE_SAMESITE", "lax")
TOKEN_TTL_SECONDS = int(auth.TOKEN_TTL.total_seconds())

# Connexion : 5 échecs / 15 min par (IP + e-mail) → blocage temporaire.
LOGIN_LIMIT, LOGIN_WINDOW = 5, 15 * 60
# Mot de passe oublié : 5 demandes / heure par IP (limite l'envoi d'e-mails).
FORGOT_LIMIT, FORGOT_WINDOW = 5, 60 * 60


def _cookie_secure() -> bool:
    # Désactivable en dev HTTP via AUTH_COOKIE_SECURE=0 (le navigateur refuse un
    # cookie Secure sur une origine non sécurisée).
    return os.environ.get("AUTH_COOKIE_SECURE", "1").strip().lower() not in {"0", "false", "no", ""}


def _set_auth_cookie(response: Response, token: str, remember: bool) -> None:
    response.set_cookie(
        key=auth.COOKIE_NAME,
        value=token,
        # « Se souvenir » → cookie persistant (durée = TTL du jeton) ; sinon cookie
        # de session, effacé à la fermeture du navigateur.
        max_age=TOKEN_TTL_SECONDS if remember else None,
        httponly=True,
        secure=_cookie_secure(),
        samesite=AUTH_COOKIE_SAMESITE,
        path="/",
    )


def _client_ip(request: Request) -> str:
    """IP réelle du client. Derrière Caddy, X-Forwarded-For se termine par l'IP
    que le proxy a constatée (un éventuel en-tête falsifié par le client est
    poussé à gauche) : on prend donc le DERNIER maillon."""
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def _too_many(retry_after: int) -> HTTPException:
    minutes = retry_after // 60 + 1
    return HTTPException(
        status_code=429,
        detail=f"Trop de tentatives. Réessayez dans environ {minutes} minute(s).",
        headers={"Retry-After": str(retry_after)},
    )


async def _reject_if_pwned(password: str) -> None:
    """Refuse un mot de passe présent dans une fuite connue (HIBP). Best-effort."""
    if await asyncio.to_thread(password_policy.is_pwned, password):
        raise HTTPException(
            status_code=400,
            detail="Ce mot de passe figure dans une fuite de données connue. Choisissez-en un autre.",
        )


@app.on_event("startup")
async def _startup() -> None:
    auth.init_db()
    ai_store.init_db()  # tables IA (journal des prédictions + feedback)
    # Lance la purge de conservation en tâche de fond (1er passage immédiat).
    asyncio.create_task(_purge_loop())

UPLOAD_DIR = DATA_DIR / "tmp_upload"
OUTPUT_DIR = DATA_DIR / "output"
LOGS_FILE  = DATA_DIR / "logs.json"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def _read_logs() -> list:
    if not LOGS_FILE.exists():
        return []
    try:
        return json.loads(LOGS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def _append_log(entry: dict) -> None:
    logs = _read_logs()
    logs.insert(0, entry)          # plus récent en premier
    logs = logs[:500]              # garder max 500 entrées
    LOGS_FILE.write_text(json.dumps(logs, ensure_ascii=False, indent=2), encoding="utf-8")


# ── Purge de conservation (RGPD) ─────────────────────────────────────────────
def _purge_outputs() -> int:
    """Supprime les fichiers de sortie plus vieux que OUTPUT_RETENTION_DAYS.

    Les exports `.xlsx` n'ont pas vocation à être conservés indéfiniment : ils
    sont régénérables depuis les fichiers sources du cabinet. Renvoie le nombre
    de fichiers supprimés. 0 jour = purge désactivée.
    """
    if OUTPUT_RETENTION_DAYS <= 0:
        return 0
    cutoff = datetime.now().timestamp() - OUTPUT_RETENTION_DAYS * 86400
    removed = 0
    for f in OUTPUT_DIR.glob("*.xlsx"):
        try:
            if f.stat().st_mtime < cutoff:
                f.unlink(missing_ok=True)
                removed += 1
        except OSError:
            continue
    return removed


def _purge_logs() -> int:
    """Élague les entrées de journal plus vieilles que LOGS_RETENTION_DAYS.

    Complète le plafond de 500 entrées par une borne temporelle. Renvoie le
    nombre d'entrées supprimées. 0 jour = purge désactivée.
    """
    if LOGS_RETENTION_DAYS <= 0:
        return 0
    cutoff = datetime.now() - timedelta(days=LOGS_RETENTION_DAYS)
    logs = _read_logs()
    kept = []
    for entry in logs:
        try:
            if datetime.fromisoformat(entry.get("timestamp", "")) >= cutoff:
                kept.append(entry)
        except (ValueError, TypeError):
            kept.append(entry)  # entrée sans timestamp lisible : on la garde
    removed = len(logs) - len(kept)
    if removed:
        LOGS_FILE.write_text(json.dumps(kept, ensure_ascii=False, indent=2), encoding="utf-8")
    return removed


def _run_purge() -> None:
    """Un passage de purge complet : sorties, journaux, jetons expirés."""
    out = _purge_outputs()
    logs = _purge_logs()
    tokens = auth.purge_expired_tokens()
    if out or logs or tokens:
        print(
            f"🧹 Purge conservation : {out} export(s), {logs} journal(aux), "
            f"{tokens} jeton(s) supprimé(s).",
            flush=True,
        )


async def _purge_loop() -> None:
    """Tâche de fond : purge au démarrage puis tous les jours."""
    while True:
        try:
            await asyncio.to_thread(_run_purge)
        except Exception as e:  # une purge ratée ne doit jamais tuer l'app
            print(f"⚠️  Purge de conservation échouée : {e}", flush=True)
        await asyncio.sleep(PURGE_INTERVAL_SECONDS)


# ── Santé (public, utilisé par le healthcheck Docker) ────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}


# ── Authentification ─────────────────────────────────────────────────────────
class LoginPayload(BaseModel):
    email: EmailStr
    password: str
    remember: bool = True


class CreateUserPayload(BaseModel):
    email: EmailStr
    # Mot de passe optionnel : si absent, l'utilisateur reçoit un e-mail avec un
    # lien pour définir lui-même son mot de passe (flux par défaut souhaité).
    password: str | None = None
    full_name: str = ""
    role: str = "user"


class UpdateUserPayload(BaseModel):
    active: bool | None = None
    role: str | None = None
    password: str | None = None


class UpdateProfilePayload(BaseModel):
    # L'utilisateur peut modifier son nom et sa photo, jamais son e-mail.
    full_name: str | None = None
    avatar_url: str | None = None  # data URL (image redimensionnée côté client) ou "" pour retirer
    onboarded: bool | None = None  # marque le guide de prise en main comme vu


class ChangePasswordPayload(BaseModel):
    current_password: str
    new_password: str


class ForgotPasswordPayload(BaseModel):
    email: EmailStr


class ResetPasswordPayload(BaseModel):
    token: str
    new_password: str


def _public_user(user: dict) -> dict:
    return {k: user.get(k) for k in
            ("id", "email", "full_name", "role", "active", "avatar_url", "onboarded", "created_at")}


# Limite la taille du data URL d'avatar (~1,5 Mo de base64). L'image est déjà
# redimensionnée côté navigateur ; ce garde-fou empêche de gonfler la base.
_AVATAR_MAX_CHARS = 1_500_000


@app.post("/auth/login")
async def login(payload: LoginPayload, request: Request, response: Response):
    # Anti-bruteforce : blocage temporaire après trop d'échecs (par IP + e-mail).
    key = f"login:{_client_ip(request)}:{payload.email.lower()}"
    allowed, retry = ratelimit.check(key, limit=LOGIN_LIMIT, window=LOGIN_WINDOW)
    if not allowed:
        observability.security_event(
            "login_blocked", alert=True, ip=_client_ip(request), email=payload.email
        )
        raise _too_many(retry)
    user = auth.get_user_by_email(payload.email)
    if user is None or not auth.verify_password(payload.password, user["password_hash"]):
        ratelimit.record(key, window=LOGIN_WINDOW)  # ne compte que les échecs
        observability.security_event("login_failed", ip=_client_ip(request), email=payload.email)
        raise HTTPException(status_code=401, detail="E-mail ou mot de passe incorrect.")
    if not user["active"]:
        raise HTTPException(status_code=403, detail="Compte désactivé.")
    ratelimit.clear(key)  # succès → on remet le compteur à zéro
    token = auth.create_access_token(user)
    _set_auth_cookie(response, token, payload.remember)
    return {"access_token": token, "token_type": "bearer", "user": _public_user(user)}


@app.post("/auth/logout")
async def logout(response: Response):
    """Efface le cookie de session côté navigateur."""
    response.delete_cookie(auth.COOKIE_NAME, path="/")
    return {"message": "Déconnecté."}


@app.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return _public_user(user)


@app.patch("/auth/me")
async def update_me(payload: UpdateProfilePayload, user: dict = Depends(get_current_user)):
    """Mise à jour par l'utilisateur de son propre profil (nom + photo, pas l'e-mail)."""
    updates: dict = {}
    if payload.full_name is not None:
        name = payload.full_name.strip()
        if not name:
            raise HTTPException(status_code=422, detail="Le nom ne peut pas être vide.")
        if len(name) > 120:
            raise HTTPException(status_code=422, detail="Nom trop long (120 caractères max).")
        updates["full_name"] = name
    if payload.avatar_url is not None:
        avatar = payload.avatar_url.strip()
        if avatar and not avatar.startswith("data:image/"):
            raise HTTPException(status_code=422, detail="Format d'image invalide.")
        if len(avatar) > _AVATAR_MAX_CHARS:
            raise HTTPException(status_code=422, detail="Image trop volumineuse.")
        updates["avatar_url"] = avatar
    if payload.onboarded is not None:
        updates["onboarded"] = payload.onboarded
    if not updates:
        raise HTTPException(status_code=400, detail="Aucune modification fournie.")
    updated = auth.update_user(user["id"], **updates)
    return _public_user(updated)


@app.get("/auth/users")
async def get_users(_: dict = Depends(require_admin)):
    return [_public_user(u) for u in auth.list_users()]


@app.post("/auth/users", status_code=201)
async def add_user(payload: CreateUserPayload, _: dict = Depends(require_admin)):
    # Sans mot de passe fourni : on crée le compte avec un secret aléatoire
    # inutilisable, puis on envoie un lien de définition par e-mail. L'utilisateur
    # ne peut pas se connecter tant qu'il n'a pas défini son mot de passe.
    send_setup = not (payload.password and payload.password.strip())
    # Sans mot de passe : secret aléatoire inutilisable (l'utilisateur le définira
    # via le lien). Le suffixe garantit le respect de la politique de robustesse.
    initial_password = payload.password if not send_setup else (secrets.token_urlsafe(24) + "Aa1#")
    if not send_setup:
        await _reject_if_pwned(initial_password)
    try:
        user = auth.create_user(
            email=payload.email,
            password=initial_password,
            full_name=payload.full_name,
            role=payload.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    email_sent = False
    if send_setup:
        token = auth.create_password_token(user["id"], purpose="setup")
        email_sent = emailer.send_account_email(
            user["email"], "setup", full_name=user["full_name"], token=token
        )
    return {**_public_user(user), "setup_email_sent": email_sent if send_setup else None}


@app.patch("/auth/users/{user_id}")
async def patch_user(user_id: int, payload: UpdateUserPayload, admin: dict = Depends(require_admin)):
    target = auth.get_user_by_id(user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    # Empêche de se retirer à soi-même le dernier accès admin (verrouillage).
    losing_admin = (target["role"] == "admin" and target["active"]) and (
        payload.active is False or (payload.role is not None and payload.role != "admin")
    )
    if losing_admin and auth.count_active_admins(exclude_id=user_id) == 0:
        raise HTTPException(status_code=400, detail="Impossible : c'est le dernier administrateur actif.")
    if payload.password is not None:
        await _reject_if_pwned(payload.password)
    try:
        user = auth.update_user(
            user_id, active=payload.active, role=payload.role, password=payload.password
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _public_user(user)


@app.delete("/auth/users/{user_id}")
async def remove_user(user_id: int, admin: dict = Depends(require_admin)):
    target = auth.get_user_by_id(user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte.")
    if target["role"] == "admin" and target["active"] and auth.count_active_admins(exclude_id=user_id) == 0:
        raise HTTPException(status_code=400, detail="Impossible : c'est le dernier administrateur actif.")
    try:
        auth.delete_user(user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Utilisateur supprimé."}


# ── Mot de passe : changement & réinitialisation ─────────────────────────────
@app.post("/auth/change-password")
async def change_password(payload: ChangePasswordPayload, user: dict = Depends(get_current_user)):
    """Changement par l'utilisateur connecté : exige le mot de passe actuel."""
    full = auth.get_user_by_email(user["email"])
    if full is None or not auth.verify_password(payload.current_password, full["password_hash"]):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect.")
    await _reject_if_pwned(payload.new_password)
    try:
        auth.update_user(user["id"], password=payload.new_password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    emailer.send_account_email(user["email"], "changed", full_name=user["full_name"])
    return {"message": "Mot de passe mis à jour."}


@app.post("/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordPayload, request: Request):
    """Demande publique de réinitialisation.

    Réponse TOUJOURS identique (200) que l'e-mail existe ou non : on ne révèle pas
    quels comptes existent (anti-énumération). Limité par IP (anti-abus d'envoi).
    """
    key = f"forgot:{_client_ip(request)}"
    allowed, retry = ratelimit.check(key, limit=FORGOT_LIMIT, window=FORGOT_WINDOW)
    if not allowed:
        observability.security_event("forgot_password_blocked", alert=True, ip=_client_ip(request))
        raise _too_many(retry)
    ratelimit.record(key, window=FORGOT_WINDOW)
    user = auth.get_user_by_email(payload.email)
    if user is not None and user["active"]:
        token = auth.create_password_token(user["id"], purpose="reset")
        emailer.send_account_email(user["email"], "reset", full_name=user["full_name"], token=token)
    return {"message": "Si un compte existe pour cette adresse, un e-mail vient d'être envoyé."}


@app.get("/auth/reset-password/{token}")
async def check_reset_token(token: str):
    """Vérifie un lien avant d'afficher le formulaire (pré-remplit l'e-mail)."""
    info = auth.verify_password_token(token)
    if info is None:
        raise HTTPException(status_code=400, detail="Lien invalide ou expiré.")
    target = auth.get_user_by_id(info["user_id"])
    if target is None:
        raise HTTPException(status_code=400, detail="Lien invalide ou expiré.")
    return {"email": target["email"], "purpose": info["purpose"]}


@app.post("/auth/reset-password")
async def reset_password(payload: ResetPasswordPayload):
    """Définit le nouveau mot de passe depuis un lien e-mail (oubli ou création)."""
    await _reject_if_pwned(payload.new_password)
    try:
        user = auth.consume_password_token(payload.token, payload.new_password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    emailer.send_account_email(user["email"], "changed", full_name=user["full_name"])
    return {"message": "Mot de passe défini. Vous pouvez vous connecter."}


@app.post("/process")
async def process_file(
    file: UploadFile = File(...),
    country: str = Form("France"),
    entreprise: str = Form(""),
    user: dict = Depends(get_current_user),
):
    safe_name = _safe_filename(file.filename)
    if not safe_name.lower().endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Format non supporté. Utilisez CSV, XLSX ou XLS.")

    destination = _resolve_within(UPLOAD_DIR, safe_name)
    written = 0
    with destination.open("wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            written += len(chunk)
            if written > MAX_UPLOAD_BYTES:
                buffer.close()
                destination.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail=f"Fichier trop volumineux (limite : {MAX_UPLOAD_BYTES // (1024 * 1024)} Mo).")
            buffer.write(chunk)

    try:
        df_raw   = load_file(str(destination))
        df_clean = clean_data(df_raw)
        df_vat   = compute_vat(df_clean, country)
        out      = build_output(df_vat)
        anomalies = detect_anomalies(df_clean, out, country)
        report   = validate(out, anomalies)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur de traitement : {str(e)}")
    finally:
        destination.unlink(missing_ok=True)

    output_filename = f"output_{Path(safe_name).stem}.xlsx"
    output_path = _resolve_within(OUTPUT_DIR, output_filename)
    out.to_excel(output_path, index=False)

    # ── Journal d'écritures (format Quadra) ──────────────────────
    # Détection de plateforme : CSV = Shopify, Excel = TikTok (cf. CLAUDE.md).
    # Le modèle d'écritures Shopify n'est pas encore défini : on ne génère le
    # journal que pour TikTok pour l'instant.
    platform = "shopify" if safe_name.lower().endswith(".csv") else "tiktok"
    journal_filename: str | None = None
    journal_preview: list[dict] = []
    journal_notes: list[str] = []
    journal_balance: dict | None = None
    if platform == "tiktok":
        try:
            journal_lines, journal_notes = build_journal(df_clean, country, platform="tiktok")
            journal_filename = f"journal_{Path(safe_name).stem}.xlsx"
            journal_path = _resolve_within(OUTPUT_DIR, journal_filename)
            entreprise_label = entreprise.strip() or "Journal des ventes"
            write_journal_xlsx(
                journal_lines, journal_path,
                entreprise=entreprise_label, platform="TIKTOK", country=country,
            )
            journal_balance = journal_totals(journal_lines)
            journal_preview = journal_lines
        except Exception as e:
            journal_notes = [f"Journal non généré : {e}"]
    else:
        journal_notes = [
            "Le modèle d'écritures Shopify n'est pas encore défini : journal non généré."
        ]

    preview = out.copy()
    preview["date"] = preview["date"].astype(str)
    preview_data = preview.to_dict(orient="records")

    # ── Journalisation ───────────────────────────────────────
    _append_log({
        "id":                str(uuid.uuid4()),
        "timestamp":         datetime.now().isoformat(timespec="seconds"),
        "filename":          safe_name,
        "country":           country,
        "rows":              report["rows"],
        "reliability_score": report["reliability_score"],
        "errors":            report["errors"],
        "warnings":          report["warnings"],
        "anomaly_count":     report["anomaly_count"],
        "output_file":       output_filename,
        "journal_file":      journal_filename,
    })

    return {
        "message":  "Fichier traité avec succès",
        "output":   output_filename,
        "report":   report,
        "anomalies": anomalies,
        "preview":  preview_data,
        "journal":  journal_filename,
        "journal_preview": journal_preview,
        "journal_balance": journal_balance,
        "journal_notes": journal_notes,
    }


@app.get("/download/{filename}")
async def download(filename: str, user: dict = Depends(get_current_user)):
    safe_name = _safe_filename(filename)
    file_path = _resolve_within(OUTPUT_DIR, safe_name)
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Fichier introuvable")
    return FileResponse(
        file_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=safe_name,
    )


@app.get("/logs")
async def get_logs(limit: int = 100, user: dict = Depends(get_current_user)):
    limit = max(1, min(limit, 500))
    logs = _read_logs()
    return logs[:limit]


@app.delete("/logs")
async def clear_logs(_: dict = Depends(require_admin)):
    LOGS_FILE.write_text("[]", encoding="utf-8")
    return {"message": "Logs effacés"}


# ── Clients & attribution (filtrés par utilisateur) ──────────────────────────
# Les clients vivent dans Google Sheets, exposés via les webhooks n8n. On les
# récupère ici côté serveur pour pouvoir les FILTRER selon l'utilisateur : un
# comptable ne voit que les clients que l'admin lui a attribués ; l'admin voit
# tout (avec l'info d'attribution).
async def _n8n_fetch_json(path: str) -> list:
    target = f"{N8N_BASE_URL}/{path}"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            upstream = await client.get(target)
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Service n8n injoignable : {e}")
    if upstream.status_code != 200:
        raise HTTPException(status_code=502, detail="Réponse inattendue du service n8n.")
    # Corps vide = aucune donnée. n8n (responseNode) ne renvoie rien quand le nœud
    # Respond ne reçoit aucun item (ex. feuille Historique encore vide) : on traite
    # ça comme une liste vide plutôt que d'échouer au parsing JSON.
    if not upstream.text.strip():
        return []
    try:
        data = upstream.json()
    except ValueError:
        raise HTTPException(status_code=502, detail="Réponse n8n illisible.")
    return data if isinstance(data, list) else []


def _email_of(row: dict) -> str:
    return str(row.get("Email", "")).strip().lower()


class AssignmentPayload(BaseModel):
    client_email: str
    user_id: int | None = None


@app.get("/api/clients")
async def api_clients(user: dict = Depends(get_current_user)):
    clients = await _n8n_fetch_json("webhook/get-clients")
    assignments = auth.get_assignments()  # email -> user_id
    users_by_id = {u["id"]: u for u in auth.list_users()}

    def annotate(c: dict) -> dict:
        uid = assignments.get(_email_of(c))
        owner = users_by_id.get(uid) if uid else None
        return {
            **c,
            "assigned_to": uid,
            "assigned_to_name": (owner["full_name"] or owner["email"]) if owner else None,
        }

    annotated = [annotate(c) for c in clients]
    if user["role"] == "admin":
        return annotated
    mine = auth.assigned_emails_for(user["id"])
    return [c for c in annotated if _email_of(c) in mine]


@app.get("/api/historique")
async def api_historique(user: dict = Depends(get_current_user)):
    rows = await _n8n_fetch_json("webhook/get-historique")
    if user["role"] == "admin":
        return rows
    mine = auth.assigned_emails_for(user["id"])
    return [r for r in rows if _email_of(r) in mine]


@app.put("/api/assignments")
async def put_assignment(payload: AssignmentPayload, _: dict = Depends(require_admin)):
    try:
        auth.set_assignment(payload.client_email, payload.user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Attribution mise à jour."}


# ── Proxy n8n (authentifié) ──────────────────────────────────────────────────
# Relaie /n8n/<path> vers le service n8n interne après vérification du JWT.
_HOP_BY_HOP = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailers", "transfer-encoding", "upgrade", "content-encoding",
    "content-length", "host",
}

# Webhooks d'ACTION sur un client (POST {email: ...}). Un comptable ne peut les
# déclencher que sur un client qui lui est attribué ; l'admin n'est pas restreint.
_CLIENT_ACTION_PATHS = {
    "webhook/relance-client",
    "webhook/marquer-recu",
    "webhook/envoi-initial",
    "webhook/relance-historique",
}

# Webhooks accessibles à tout utilisateur authentifié sans condition d'attribution.
_SHARED_PROXY_PATHS = {"webhook/send-mail"}

# Liste blanche pour les NON-admins. Toute autre route n8n (get-clients,
# get-historique, send-account-email…) leur est interdite via le proxy : ces
# données passent par les endpoints serveur /api/* qui les FILTRENT par
# utilisateur. Sans ce garde-fou, un comptable pourrait appeler get-clients en
# direct et contourner le filtrage d'attribution.
_USER_ALLOWED_PROXY_PATHS = _CLIENT_ACTION_PATHS | _SHARED_PROXY_PATHS


@app.api_route(
    "/n8n/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
)
async def n8n_proxy(path: str, request: Request, user: dict = Depends(get_current_user)):
    target = f"{N8N_BASE_URL}/{path}"
    body = await request.body()
    # Liste blanche : un non-admin ne peut relayer que les webhooks autorisés.
    if user["role"] != "admin" and path not in _USER_ALLOWED_PROXY_PATHS:
        observability.security_event(
            "proxy_path_denied", ip=_client_ip(request), email=user["email"], path=path
        )
        raise HTTPException(status_code=403, detail="Ce point d'accès n'est pas autorisé.")
    # Enforcement : un comptable ne peut agir que sur SES clients attribués.
    if user["role"] != "admin" and path in _CLIENT_ACTION_PATHS:
        try:
            payload = json.loads(body or b"{}")
            target_email = str(payload.get("email", "")).strip().lower()
        except (ValueError, AttributeError):
            target_email = ""
        if not target_email or target_email not in auth.assigned_emails_for(user["id"]):
            observability.security_event(
                "proxy_client_denied", ip=_client_ip(request),
                email=user["email"], path=path, target=target_email,
            )
            raise HTTPException(status_code=403, detail="Ce client ne vous est pas attribué.")
    # On retire aussi l'en-tête Authorization (jeton du dashboard, pas pour n8n) et
    # les en-têtes conditionnels : sinon n8n peut répondre 304 (corps vide), que le
    # front interprète comme une erreur.
    # On retire enfin Accept-Encoding du navigateur : il annonce br/zstd que httpx ne
    # sait pas décoder (codecs non installés). httpx renverrait alors un corps encore
    # compressé tandis qu'on supprime l'en-tête content-encoding -> JSON illisible côté
    # front. En le retirant, httpx négocie lui-même (gzip/deflate) et décompresse, donc
    # upstream.content est toujours en clair.
    _DROP = _HOP_BY_HOP | {
        "authorization", "if-none-match", "if-modified-since", "accept-encoding",
    }
    fwd_headers = {
        k: v for k, v in request.headers.items() if k.lower() not in _DROP
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            upstream = await client.request(
                request.method,
                target,
                params=request.query_params,
                content=body,
                headers=fwd_headers,
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Service n8n injoignable : {e}")

    resp_headers = {
        k: v for k, v in upstream.headers.items() if k.lower() not in _HOP_BY_HOP
    }
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=resp_headers,
        media_type=upstream.headers.get("content-type"),
    )

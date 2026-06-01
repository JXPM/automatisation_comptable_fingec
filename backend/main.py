from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
from datetime import datetime
import hmac
import os
import re
import json
import uuid

from processor import load_file, clean_data, compute_vat, build_output, detect_anomalies, validate

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
# Jeton d'admin requis pour les actions destructrices (ex: vider les logs).
# Derrière un reverse-proxy, on ne peut pas se fier à l'IP source : on exige donc
# un secret partagé. Si non défini, la route est désactivée (fail-safe).
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "").strip()
_SAFE_NAME_RE = re.compile(r"[^A-Za-z0-9._-]+")


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
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.post("/process")
async def process_file(
    file: UploadFile = File(...),
    country: str = Form("France"),
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
    })

    return {
        "message":  "Fichier traité avec succès",
        "output":   output_filename,
        "report":   report,
        "anomalies": anomalies,
        "preview":  preview_data,
    }


@app.get("/download/{filename}")
async def download(filename: str):
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
async def get_logs(limit: int = 100):
    limit = max(1, min(limit, 500))
    logs = _read_logs()
    return logs[:limit]


@app.delete("/logs")
async def clear_logs(x_admin_token: str | None = Header(default=None)):
    if not ADMIN_TOKEN:
        raise HTTPException(
            status_code=503,
            detail="Action désactivée : aucun ADMIN_TOKEN configuré côté serveur.",
        )
    # Comparaison à temps constant pour éviter les attaques temporelles.
    if not x_admin_token or not hmac.compare_digest(x_admin_token, ADMIN_TOKEN):
        raise HTTPException(status_code=403, detail="Jeton d'administration invalide.")
    LOGS_FILE.write_text("[]", encoding="utf-8")
    return {"message": "Logs effacés"}

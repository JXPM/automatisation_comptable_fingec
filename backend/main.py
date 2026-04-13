from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
import shutil

from processor import load_file, clean_data, compute_vat, build_output, detect_anomalies, validate

BASE_DIR = Path(__file__).resolve().parent.parent

app = FastAPI(
    title="Automatisation Comptable",
    description="API pour importer des fichiers Shopify/TikTok et générer un export Quadra.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = BASE_DIR / "tmp_upload"
OUTPUT_DIR = BASE_DIR / "output"
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)


@app.post("/process")
async def process_file(
    file: UploadFile = File(...),
    country: str = Form("France"),
):
    if not file.filename.lower().endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Format non supporté. Utilisez CSV, XLSX ou XLS.")

    destination = UPLOAD_DIR / file.filename
    with destination.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        df_raw = load_file(str(destination))
        df_clean = clean_data(df_raw)
        df_vat = compute_vat(df_clean, country)
        out = build_output(df_vat)
        anomalies = detect_anomalies(df_clean, out, country)
        report = validate(out, anomalies)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur de traitement : {str(e)}")

    stem = Path(file.filename).stem
    output_filename = f"output_{stem}.xlsx"
    output_path = OUTPUT_DIR / output_filename
    out.to_excel(output_path, index=False)

    preview = out.copy()
    preview["date"] = preview["date"].astype(str)
    preview_data = preview.to_dict(orient="records")

    return {
        "message": "Fichier traité avec succès",
        "output": output_filename,
        "report": report,
        "anomalies": anomalies,
        "preview": preview_data,
    }


@app.get("/download/{filename}")
async def download(filename: str):
    file_path = OUTPUT_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier introuvable")
    return FileResponse(
        file_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=filename,
    )

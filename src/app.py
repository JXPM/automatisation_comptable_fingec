from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import pandas as pd
from src.processor import load_file, clean_data, compute_vat, build_output, validate

BASE_DIR = Path(__file__).resolve().parent.parent

app = FastAPI(
    title="Automatisation Comptable",
    description="API pour importer des fichiers Shopify/TikTok et générer un export Quadra.",
)

app.mount("/static", StaticFiles(directory=BASE_DIR / "ui"), name="static")


@app.get("/")
async def index():
    return RedirectResponse(url="/static/index.html")


@app.post("/process")
async def process_file(
    file: UploadFile = File(...),
    country: str = Form("France"),
):
    if file.filename.lower().endswith((".csv", ".xlsx", ".xls")) is False:
        raise HTTPException(status_code=400, detail="Format de fichier non supporté")

    upload_path = BASE_DIR / "tmp_upload"
    upload_path.mkdir(exist_ok=True)
    destination = upload_path / file.filename

    with destination.open("wb") as buffer:
        buffer.write(await file.read())

    df = load_file(str(destination))
    df = clean_data(df)
    df = compute_vat(df, country)
    out = build_output(df)
    report = validate(out)

    output_file = BASE_DIR / f"output_{file.filename.rsplit('.', 1)[0]}.xlsx"
    out.to_excel(output_file, index=False)

    return {
        "message": "Fichier traité avec succès",
        "output": str(output_file.name),
        "report": report,
    }


@app.get("/download/{filename}")
async def download(filename: str):
    file_path = BASE_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier introuvable")
    return FileResponse(file_path, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename=filename)

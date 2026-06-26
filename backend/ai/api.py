"""
API REST du modèle de catégorisation comptable (architecture REST, doc OpenAPI).

Exposée sous le préfixe `/api/ai`, derrière l'authentification du tableau de
bord. Sécurisation alignée sur l'OWASP API Security Top 10 :
  - API1 (Broken Auth)      : toute route exige un utilisateur authentifié ;
  - API4 (Resource Consum.) : taille des libellés et des lots bornée ;
  - API8/API5               : 503 explicite si le modèle n'est pas disponible.

Ce routeur est volontairement découplé de `main.py` : il se teste isolément et
documente proprement le contrat (modèles Pydantic en entrée/sortie).
"""

from __future__ import annotations

import anyio
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from auth import get_current_user, require_admin

from . import model as ai_model
from . import store
from .categories import CATEGORY_KEYS, account_for_category, category as _category
from .model import ModelUnavailable

MAX_LABEL_LEN = 200
MAX_BATCH = 500

router = APIRouter(prefix="/api/ai", tags=["IA — Catégorisation comptable"])


def _model_version() -> str:
    try:
        return ai_model.model_info().get("model_version", "")
    except ModelUnavailable:
        return ""


# ── Schémas (contrat d'API) ──────────────────────────────────────────────────
class Alternative(BaseModel):
    category: str
    label: str
    account: str
    confidence: float


class Prediction(BaseModel):
    input: str
    category: str
    label: str
    account: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    review: bool = Field(..., description="True si la confiance est sous le seuil de revue.")
    alternatives: list[Alternative]


class CategorizeRequest(BaseModel):
    label: str = Field(..., min_length=1, max_length=MAX_LABEL_LEN,
                       description="Libellé d'une composante de transaction.")


class BatchRequest(BaseModel):
    labels: list[str] = Field(..., min_length=1, max_length=MAX_BATCH)


class BatchResponse(BaseModel):
    count: int
    review_count: int
    predictions: list[Prediction]


class FeedbackRequest(BaseModel):
    label: str = Field(..., min_length=1, max_length=MAX_LABEL_LEN)
    predicted_category: str = Field("", max_length=40)
    predicted_confidence: float = Field(0.0, ge=0.0, le=1.0)
    corrected_category: str = Field(..., min_length=1, max_length=40)


# ── Routes ───────────────────────────────────────────────────────────────────
def _require_model():
    """Convertit l'absence de modèle en 503 (et non en 500)."""
    try:
        return ai_model.model_info()
    except ModelUnavailable as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/info", summary="Métadonnées du modèle en service")
async def info(_: dict = Depends(get_current_user)) -> dict:
    """Version, date d'entraînement, métriques et seuil de revue du modèle."""
    return _require_model()


@router.post("/categorize", response_model=Prediction,
             summary="Catégoriser un libellé")
async def categorize(payload: CategorizeRequest,
                     user: dict = Depends(get_current_user)) -> Prediction:
    """Prédit le compte Quadra d'un libellé, avec score de confiance.

    Chaque prédiction est journalisée (matière du monitorage)."""
    try:
        raw = ai_model.categorize(payload.label)
    except ModelUnavailable as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    await anyio.to_thread.run_sync(
        lambda: store.log_prediction(
            user_email=user["email"], input=raw["input"], category=raw["category"],
            account=raw["account"], confidence=raw["confidence"], review=raw["review"],
            model_version=_model_version(),
        )
    )
    return Prediction(**raw)


@router.post("/categorize-batch", response_model=BatchResponse,
             summary="Catégoriser un lot de libellés")
async def categorize_batch(payload: BatchRequest,
                           user: dict = Depends(get_current_user)) -> BatchResponse:
    """Catégorise plusieurs libellés (ex. toutes les composantes d'un relevé)."""
    raws: list[dict] = []
    try:
        for raw in payload.labels:
            label = (raw or "").strip()
            if not label or len(label) > MAX_LABEL_LEN:
                raise HTTPException(
                    status_code=400,
                    detail=f"Libellé invalide (1 à {MAX_LABEL_LEN} caractères).",
                )
            raws.append(ai_model.categorize(label))
    except ModelUnavailable as e:
        raise HTTPException(status_code=503, detail=str(e))
    await anyio.to_thread.run_sync(
        lambda: store.log_predictions_bulk(user["email"], raws, _model_version())
    )
    preds = [Prediction(**r) for r in raws]
    review_count = sum(1 for p in preds if p.review)
    return BatchResponse(count=len(preds), review_count=review_count, predictions=preds)


@router.post("/feedback", summary="Corriger une prédiction (boucle de feedback)")
async def feedback(payload: FeedbackRequest,
                   user: dict = Depends(get_current_user)) -> dict:
    """Enregistre la correction du comptable. Ces exemples nourrissent le
    réentraînement du modèle (apprentissage continu)."""
    if payload.corrected_category not in CATEGORY_KEYS:
        raise HTTPException(status_code=400, detail="Catégorie de correction inconnue.")
    fid = await anyio.to_thread.run_sync(
        lambda: store.log_feedback(
            user_email=user["email"], input=payload.label,
            predicted_category=payload.predicted_category,
            predicted_confidence=payload.predicted_confidence,
            corrected_category=payload.corrected_category,
        )
    )
    cat = _category(payload.corrected_category)
    return {"id": fid, "message": "Correction enregistrée.",
            "corrected_account": account_for_category(payload.corrected_category),
            "corrected_label": cat.label}


@router.get("/categories", summary="Référentiel des catégories")
async def categories(_: dict = Depends(get_current_user)) -> list[dict]:
    """Liste des catégories cibles (pour les menus de correction)."""
    return [
        {"key": _category(k).key, "label": _category(k).label,
         "account": account_for_category(k), "description": _category(k).description}
        for k in CATEGORY_KEYS
    ]


@router.get("/monitoring", summary="Métriques de surveillance du modèle")
async def monitoring(_: dict = Depends(require_admin)) -> dict:
    """Volume, confiance moyenne, taux de revue, dérive et feedback. Réservé admin."""
    summary = await anyio.to_thread.run_sync(store.monitoring_summary)
    try:
        summary["model"] = ai_model.model_info()
    except ModelUnavailable:
        summary["model"] = None
    return summary


@router.post("/retrain", summary="Réentraîner le modèle sur le feedback")
async def retrain(_: dict = Depends(require_admin)) -> dict:
    """Réentraîne le modèle en incorporant les corrections du comptable,
    recharge l'artefact servi, et renvoie les nouvelles métriques. Réservé admin."""
    from . import train as ai_train

    def _do() -> dict:
        examples = store.feedback_examples()
        metrics = ai_train.train(extra_examples=examples)
        store.mark_feedback_trained()
        ai_model.reload_model()
        return metrics

    metrics = await anyio.to_thread.run_sync(_do)
    return {
        "message": "Modèle réentraîné.",
        "model_version": metrics["model_version"],
        "n_feedback_used": metrics.get("n_feedback", 0),
        "accuracy": metrics["accuracy"],
        "f1_macro": metrics["f1_macro"],
        "holdout_accuracy": metrics["holdout_accuracy"],
    }

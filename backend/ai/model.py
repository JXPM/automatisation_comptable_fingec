"""
Inférence du modèle de catégorisation comptable.

Charge l'artefact entraîné (lazy + cache) et expose `categorize()`, qui renvoie
le compte Quadra prédit, un **score de confiance** et un drapeau `review` quand
la confiance est sous le seuil — déclenchant la revue manuelle du comptable.
"""

from __future__ import annotations

import functools
import os
from pathlib import Path

import joblib

from .categories import account_for_category, category as _category

# Seuil sous lequel une prédiction part en revue manuelle (surchargeable).
REVIEW_THRESHOLD = float(os.environ.get("AI_REVIEW_THRESHOLD", "0.55"))
_DEFAULT_MODEL = Path(__file__).with_name("artifacts") / "model.joblib"


class ModelUnavailable(RuntimeError):
    """Levée quand aucun artefact entraîné n'est disponible."""


@functools.lru_cache(maxsize=1)
def _load(path: str | None = None) -> dict:
    p = Path(path or os.environ.get("AI_MODEL_PATH", str(_DEFAULT_MODEL)))
    if not p.exists():
        raise ModelUnavailable(
            f"Modèle introuvable ({p}). Lancer : python -m backend.ai.train"
        )
    return joblib.load(p)


def reload_model() -> None:
    """Vide le cache (à appeler après un réentraînement)."""
    _load.cache_clear()


def model_info() -> dict:
    bundle = _load()
    return {
        "model_version": bundle.get("model_version"),
        "trained_at": bundle.get("trained_at"),
        "metrics": bundle.get("metrics", {}),
        "categories": bundle.get("categories", []),
        "review_threshold": REVIEW_THRESHOLD,
    }


def categorize(text: str, *, top_k: int = 3) -> dict:
    """Prédit le compte comptable d'un libellé de transaction.

    Renvoie : `category`, `account`, `label`, `confidence`, `review` (bool) et
    `alternatives` (les `top_k` catégories les plus probables).
    """
    if not text or not str(text).strip():
        raise ValueError("Libellé vide.")
    bundle = _load()
    pipe = bundle["pipeline"]

    proba = pipe.predict_proba([str(text)])[0]
    classes = list(pipe.classes_)
    ranked = sorted(zip(classes, proba), key=lambda kv: kv[1], reverse=True)

    best_key, best_p = ranked[0]
    cat = _category(best_key)
    return {
        "input": str(text),
        "category": best_key,
        "label": cat.label,
        "account": account_for_category(best_key),
        "confidence": round(float(best_p), 4),
        "review": bool(best_p < REVIEW_THRESHOLD),
        "alternatives": [
            {
                "category": k,
                "label": _category(k).label,
                "account": account_for_category(k),
                "confidence": round(float(p), 4),
            }
            for k, p in ranked[:top_k]
        ],
    }


if __name__ == "__main__":  # démonstration rapide
    for t in ["creator ads bonus", "last mile courier fee", "vat on order", "weird unknown line"]:
        r = categorize(t)
        flag = "  ⚠ revue" if r["review"] else ""
        print(f"{t:28} → {r['label']:24} {r['account']:9} ({r['confidence']:.2f}){flag}")

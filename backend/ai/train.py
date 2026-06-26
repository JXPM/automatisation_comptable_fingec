"""
Entraînement, évaluation et sérialisation du modèle de catégorisation.

Pipeline scikit-learn : vectorisation **TF-IDF** (n-grammes de mots + de
caractères, robuste aux fautes et aux libellés courts) → **régression
logistique** multinomiale calibrée. Le choix est volontairement léger : corpus
modeste, inférence rapide en API, modèle interprétable — cohérent avec le
benchmark (C7) qui écarte un LLM surdimensionné pour ce besoin.

Sorties (dans `ARTIFACTS_DIR`) :
  - `model.joblib`  : pipeline + métadonnées (catégories, version, métriques) ;
  - `metrics.json`  : rapport d'évaluation lisible (versionné dans Git).

Usage :  python -m backend.ai.train
"""

from __future__ import annotations

import json
import os
import platform
from datetime import datetime, timezone
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import FeatureUnion, Pipeline

import pandas as pd

from .categories import CATEGORIES, account_for_category
from .dataset import build_dataset
from .eval_holdout import HOLDOUT

MODEL_VERSION = "1.0.0"
ARTIFACTS_DIR = Path(os.environ.get("AI_ARTIFACTS_DIR", str(Path(__file__).with_name("artifacts"))))
MODEL_PATH = ARTIFACTS_DIR / "model.joblib"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"


def build_pipeline() -> Pipeline:
    """TF-IDF mots + caractères → régression logistique multinomiale."""
    word_vec = TfidfVectorizer(
        analyzer="word", ngram_range=(1, 2), min_df=1, sublinear_tf=True,
    )
    char_vec = TfidfVectorizer(
        analyzer="char_wb", ngram_range=(3, 5), min_df=1, sublinear_tf=True,
    )
    features = FeatureUnion([("word", word_vec), ("char", char_vec)])
    clf = LogisticRegression(max_iter=1000, C=8.0, class_weight="balanced")
    return Pipeline([("features", features), ("clf", clf)])


def train(*, seed: int = 42, test_size: float = 0.2,
          extra_examples: list[tuple[str, str]] | None = None) -> dict:
    df = build_dataset(seed=seed)

    # Corrections du comptable (boucle de feedback) : ajoutées comme exemples
    # réels, chacun dans son propre groupe pour ne pas fausser l'évaluation.
    n_feedback = 0
    if extra_examples:
        valid = {c.key for c in CATEGORIES}
        next_group = int(df["group"].max()) + 1
        rows = []
        for text, cat in extra_examples:
            if cat not in valid or not str(text).strip():
                continue
            rows.append({"text": str(text).strip(), "category": cat,
                         "account": account_for_category(cat), "group": next_group})
            next_group += 1
        if rows:
            df = pd.concat([df, pd.DataFrame(rows)], ignore_index=True)
            n_feedback = len(rows)

    X, y, groups = df["text"].tolist(), df["category"].tolist(), df["group"].tolist()

    # Split PAR GROUPE : toutes les variantes d'une même phrase-graine restent du
    # même côté → le test ne contient que des libellés dont aucune variante n'a
    # été vue à l'entraînement. Mesure honnête de la généralisation.
    splitter = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=seed)
    tr_idx, te_idx = next(splitter.split(X, y, groups))
    X_tr = [X[i] for i in tr_idx]; y_tr = [y[i] for i in tr_idx]
    X_te = [X[i] for i in te_idx]; y_te = [y[i] for i in te_idx]

    pipe = build_pipeline()
    pipe.fit(X_tr, y_tr)

    y_pred = pipe.predict(X_te)
    labels = [c.key for c in CATEGORIES]

    # Évaluation sur libellés RÉELLEMENT inédits (rédigés à la main).
    holdout_X = [t for t, _ in HOLDOUT]
    holdout_y = [c for _, c in HOLDOUT]
    holdout_pred = pipe.predict(holdout_X)
    holdout_acc = round(accuracy_score(holdout_y, holdout_pred), 4)

    metrics = {
        "model_version": MODEL_VERSION,
        "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "seed": seed,
        "n_samples": len(df),
        "n_feedback": n_feedback,
        "n_train": len(X_tr),
        "n_test": len(X_te),
        "categories": labels,
        "accuracy": round(accuracy_score(y_te, y_pred), 4),
        "f1_macro": round(f1_score(y_te, y_pred, average="macro"), 4),
        "holdout_accuracy": holdout_acc,
        "holdout_errors": [
            {"text": t, "expected": exp, "predicted": pred}
            for t, exp, pred in zip(holdout_X, holdout_y, holdout_pred)
            if exp != pred
        ],
        "per_class": classification_report(
            y_te, y_pred, labels=labels, output_dict=True, zero_division=0
        ),
        "confusion_matrix": {
            "labels": labels,
            "matrix": confusion_matrix(y_te, y_pred, labels=labels).tolist(),
        },
        "python": platform.python_version(),
    }

    # Réentraînement sur la TOTALITÉ des données avant de servir en production
    # (le split n'a servi qu'à mesurer la performance honnêtement).
    pipe.fit(X, y)

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "pipeline": pipe,
            "categories": labels,
            "model_version": MODEL_VERSION,
            "trained_at": metrics["trained_at"],
            "metrics": {k: metrics[k] for k in ("accuracy", "f1_macro")},
        },
        MODEL_PATH,
    )
    METRICS_PATH.write_text(json.dumps(metrics, indent=2, ensure_ascii=False), encoding="utf-8")
    return metrics


if __name__ == "__main__":
    m = train()
    print(f"Modèle v{m['model_version']} entraîné — "
          f"accuracy={m['accuracy']:.3f}  f1_macro={m['f1_macro']:.3f}  "
          f"holdout(inédits)={m['holdout_accuracy']:.3f}")
    print(f"  artefact : {MODEL_PATH}")
    print(f"  métriques: {METRICS_PATH}")

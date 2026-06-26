"""Tests de la brique IA : dataset, entraînement, inférence et persistance.

Le modèle est entraîné une fois par la fixture de session `_trained_ai_model`
(cf. conftest). On vérifie ici la *reproductibilité*, la *performance plancher*
sur libellés inédits, le contrat d'inférence et la boucle de monitorage.
"""
from __future__ import annotations

from pathlib import Path

import pytest


# ── Jeu de données (weak supervision) ────────────────────────────────────────
def test_dataset_is_deterministic():
    from ai.dataset import build_dataset
    a = build_dataset(seed=42)
    b = build_dataset(seed=42)
    assert a.equals(b)  # même graine → même corpus (pipeline reproductible)


def test_dataset_covers_all_categories():
    from ai.categories import CATEGORY_KEYS
    from ai.dataset import build_dataset
    df = build_dataset(seed=1)
    assert set(df["category"].unique()) == set(CATEGORY_KEYS)
    assert (df["category"].value_counts() >= 10).all()  # classes non dégénérées


# ── Entraînement & évaluation ────────────────────────────────────────────────
def test_training_reaches_minimum_generalisation():
    """L'exactitude sur libellés RÉELLEMENT inédits doit dépasser un plancher.

    On ne vise pas la perfection (signe de fuite), mais une généralisation
    nette : > 0,75 sur le jeu de holdout écrit à la main.
    """
    from ai.train import train
    m = train()
    assert 0.0 < m["accuracy"] <= 1.0
    assert m["holdout_accuracy"] > 0.75
    assert "confusion_matrix" in m


def test_feedback_examples_are_incorporated():
    from ai.train import train
    base = train()
    boosted = train(extra_examples=[("courier last mile delivery fee", "port")])
    assert boosted["n_feedback"] == 1
    assert boosted["n_samples"] == base["n_samples"] + 1


# ── Inférence ────────────────────────────────────────────────────────────────
def test_categorize_contract():
    from ai.model import categorize, reload_model
    reload_model()
    r = categorize("tiktok shop commission fee")
    assert r["category"] == "commission"
    assert r["account"] == "62220000"
    assert 0.0 <= r["confidence"] <= 1.0
    assert isinstance(r["review"], bool)
    assert len(r["alternatives"]) >= 1
    # Les alternatives sont triées par confiance décroissante.
    confs = [a["confidence"] for a in r["alternatives"]]
    assert confs == sorted(confs, reverse=True)


def test_categorize_low_confidence_triggers_review():
    from ai.model import categorize
    r = categorize("zzz qwxv totally unknown gibberish")
    assert r["review"] is True  # l'inconnu part en revue, pas en auto


def test_categorize_rejects_empty():
    from ai.model import categorize
    with pytest.raises(ValueError):
        categorize("   ")


def test_model_info_exposes_version_and_threshold():
    from ai.model import model_info
    info = model_info()
    assert info["model_version"]
    assert 0.0 < info["review_threshold"] < 1.0
    assert len(info["categories"]) == 8


# ── Persistance / monitoring ─────────────────────────────────────────────────
def test_store_logs_and_summarises(tmp_path: Path, monkeypatch):
    import ai.store as store
    monkeypatch.setattr(store, "DATA_DIR", tmp_path)
    monkeypatch.setattr(store, "DB_PATH", tmp_path / "app.db")
    store.init_db()

    store.log_predictions_bulk("u@x.fr", [
        {"input": "commission fee", "category": "commission", "account": "62220000", "confidence": 0.95, "review": False},
        {"input": "weird line", "category": "ajustement", "account": "471000", "confidence": 0.20, "review": True},
    ], model_version="1.0.0")

    summary = store.monitoring_summary()
    assert summary["total_predictions"] == 2
    assert summary["review_count"] == 1
    assert summary["review_rate"] == 0.5

    # Feedback → réentraînement disponible.
    store.log_feedback(user_email="u@x.fr", input="weird line",
                       predicted_category="ajustement", predicted_confidence=0.2,
                       corrected_category="commission")
    assert store.feedback_examples() == [("weird line", "commission")]
    summary2 = store.monitoring_summary()
    assert summary2["feedback_count"] == 1
    assert summary2["correction_count"] == 1

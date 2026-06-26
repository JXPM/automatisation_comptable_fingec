"""Tests d'intégration de l'API IA (/api/ai) via FastAPI TestClient.

Couvre l'authentification (OWASP API1), la validation des entrées (API4), la
boucle de feedback, la journalisation pour le monitorage et le cloisonnement
admin (monitoring/retrain réservés à l'admin).
"""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path: Path, monkeypatch):
    import auth
    import ai.store as store
    import ai.model as model
    import main

    # Bases isolées (auth + IA partagent app.db).
    monkeypatch.setattr(auth, "DATA_DIR", tmp_path)
    monkeypatch.setattr(auth, "DB_PATH", tmp_path / "app.db")
    monkeypatch.setattr(store, "DATA_DIR", tmp_path)
    monkeypatch.setattr(store, "DB_PATH", tmp_path / "app.db")
    model.reload_model()

    monkeypatch.setenv("ADMIN_EMAIL", "admin@fingec.fr")
    monkeypatch.setenv("ADMIN_PASSWORD", "admin-password-1")
    monkeypatch.setenv("RATELIMIT_ENABLED", "0")
    monkeypatch.setenv("PWNED_CHECK_ENABLED", "0")
    monkeypatch.setenv("AUTH_COOKIE_SECURE", "0")

    with TestClient(main.app) as c:
        yield c


def _admin(client) -> dict:
    tok = client.post("/auth/login", json={"email": "admin@fingec.fr", "password": "admin-password-1"}).json()["access_token"]
    return {"Authorization": f"Bearer {tok}"}


def _make_user(client, admin_h) -> dict:
    client.post("/auth/users", headers=admin_h,
                json={"email": "compta@fingec.fr", "password": "Zk7-river-Maple-92"})
    tok = client.post("/auth/login", json={"email": "compta@fingec.fr", "password": "Zk7-river-Maple-92"}).json()["access_token"]
    return {"Authorization": f"Bearer {tok}"}


# ── Authentification ─────────────────────────────────────────────────────────
def test_categorize_requires_auth(client):
    assert client.post("/api/ai/categorize", json={"label": "commission"}).status_code == 401
    assert client.get("/api/ai/info").status_code == 401


def test_info_and_categorize(client):
    h = _admin(client)
    info = client.get("/api/ai/info", headers=h)
    assert info.status_code == 200
    assert info.json()["model_version"]

    r = client.post("/api/ai/categorize", json={"label": "tiktok shop commission fee"}, headers=h)
    assert r.status_code == 200
    body = r.json()
    assert body["category"] == "commission"
    assert 0.0 <= body["confidence"] <= 1.0


def test_categorize_validates_input(client):
    h = _admin(client)
    assert client.post("/api/ai/categorize", json={"label": ""}, headers=h).status_code == 422
    assert client.post("/api/ai/categorize", json={"label": "x" * 300}, headers=h).status_code == 422


def test_batch_and_logging_feeds_monitoring(client):
    h = _admin(client)
    r = client.post("/api/ai/categorize-batch",
                    json={"labels": ["commission fee", "shipping label", "tax and duty"]}, headers=h)
    assert r.status_code == 200
    assert r.json()["count"] == 3

    mon = client.get("/api/ai/monitoring", headers=h).json()
    assert mon["total_predictions"] == 3
    assert mon["avg_confidence"] is not None


def test_empty_batch_rejected(client):
    h = _admin(client)
    assert client.post("/api/ai/categorize-batch", json={"labels": []}, headers=h).status_code == 422


# ── Feedback ─────────────────────────────────────────────────────────────────
def test_feedback_records_correction(client):
    h = _admin(client)
    r = client.post("/api/ai/feedback", headers=h, json={
        "label": "last mile courier fee", "predicted_category": "services",
        "predicted_confidence": 0.5, "corrected_category": "port",
    })
    assert r.status_code == 200
    assert r.json()["corrected_account"] == "70800000"

    mon = client.get("/api/ai/monitoring", headers=h).json()
    assert mon["feedback_count"] == 1
    assert mon["correction_count"] == 1


def test_feedback_rejects_unknown_category(client):
    h = _admin(client)
    r = client.post("/api/ai/feedback", headers=h,
                    json={"label": "x", "corrected_category": "inexistante"})
    assert r.status_code == 400


def test_categories_endpoint(client):
    h = _admin(client)
    cats = client.get("/api/ai/categories", headers=h).json()
    assert len(cats) == 8
    assert all({"key", "label", "account", "description"} <= set(c) for c in cats)


# ── Cloisonnement admin ──────────────────────────────────────────────────────
def test_monitoring_and_retrain_are_admin_only(client):
    admin_h = _admin(client)
    user_h = _make_user(client, admin_h)

    # Un comptable peut catégoriser et corriger…
    assert client.post("/api/ai/categorize", json={"label": "commission"}, headers=user_h).status_code == 200
    assert client.post("/api/ai/feedback", headers=user_h,
                       json={"label": "commission", "corrected_category": "commission"}).status_code == 200
    # …mais pas accéder au monitorage ni réentraîner.
    assert client.get("/api/ai/monitoring", headers=user_h).status_code == 403
    assert client.post("/api/ai/retrain", headers=user_h).status_code == 403


def test_retrain_incorporates_feedback(client):
    h = _admin(client)
    client.post("/api/ai/feedback", headers=h, json={
        "label": "courier last mile delivery", "predicted_category": "services",
        "predicted_confidence": 0.4, "corrected_category": "port",
    })
    r = client.post("/api/ai/retrain", headers=h)
    assert r.status_code == 200
    assert r.json()["n_feedback_used"] == 1
    assert 0.0 < r.json()["holdout_accuracy"] <= 1.0

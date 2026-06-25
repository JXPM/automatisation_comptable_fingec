"""Tests des jetons de mot de passe et du hachage (auth.py)."""
from __future__ import annotations

from datetime import timedelta
from pathlib import Path

import pytest

import auth


@pytest.fixture
def db(tmp_path: Path, monkeypatch):
    """Base SQLite isolée par test."""
    monkeypatch.setattr(auth, "DATA_DIR", tmp_path)
    monkeypatch.setattr(auth, "DB_PATH", tmp_path / "app.db")
    auth.init_db()
    return tmp_path


def test_hash_and_verify_password():
    h = auth.hash_password("super-secret")
    assert h != "super-secret"
    assert auth.verify_password("super-secret", h)
    assert not auth.verify_password("mauvais", h)


def test_token_roundtrip_changes_password(db):
    u = auth.create_user("a@fingec.fr", "Valid-Pass-123")
    token = auth.create_password_token(u["id"], purpose="reset")

    # Le jeton en clair n'est jamais stocké tel quel.
    assert token not in str(db / "app.db")

    info = auth.verify_password_token(token)
    assert info == {"user_id": u["id"], "purpose": "reset"}

    auth.consume_password_token(token, "nouveau-mdp-123")

    refreshed = auth.get_user_by_email("a@fingec.fr")
    assert auth.verify_password("nouveau-mdp-123", refreshed["password_hash"])


def test_token_is_single_use(db):
    u = auth.create_user("a@fingec.fr", "Valid-Pass-123")
    token = auth.create_password_token(u["id"])
    auth.consume_password_token(token, "premier-mdp-123")

    assert auth.verify_password_token(token) is None
    with pytest.raises(ValueError, match="déjà utilisé|invalide"):
        auth.consume_password_token(token, "deuxieme-mdp-123")


def test_expired_token_rejected(db, monkeypatch):
    u = auth.create_user("a@fingec.fr", "Valid-Pass-123")
    # TTL négatif → jeton déjà expiré à la création.
    monkeypatch.setitem(auth.RESET_TOKEN_TTL, "reset", timedelta(hours=-1))
    token = auth.create_password_token(u["id"], purpose="reset")

    assert auth.verify_password_token(token) is None
    with pytest.raises(ValueError, match="expiré"):
        auth.consume_password_token(token, "nouveau-mdp-123")


def test_new_token_invalidates_previous(db):
    u = auth.create_user("a@fingec.fr", "Valid-Pass-123")
    first = auth.create_password_token(u["id"])
    second = auth.create_password_token(u["id"])

    assert auth.verify_password_token(first) is None     # invalidé
    assert auth.verify_password_token(second) is not None


def test_consume_rejects_short_password(db):
    u = auth.create_user("a@fingec.fr", "Valid-Pass-123")
    token = auth.create_password_token(u["id"])
    with pytest.raises(ValueError, match="12 caractères"):
        auth.consume_password_token(token, "court")
    # Le jeton reste valable puisqu'on n'a rien changé.
    assert auth.verify_password_token(token) is not None


def test_unknown_token_rejected(db):
    assert auth.verify_password_token("inexistant") is None
    with pytest.raises(ValueError):
        auth.consume_password_token("inexistant", "nouveau-mdp-123")

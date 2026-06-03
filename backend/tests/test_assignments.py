"""Tests de l'attribution client -> utilisateur (auth.py)."""
from __future__ import annotations

from pathlib import Path

import pytest

import auth


@pytest.fixture
def db(tmp_path: Path, monkeypatch):
    """Base SQLite isolée pour chaque test."""
    monkeypatch.setattr(auth, "DATA_DIR", tmp_path)
    monkeypatch.setattr(auth, "DB_PATH", tmp_path / "app.db")
    auth.init_db()
    return tmp_path


def test_set_and_query_assignment(db):
    u = auth.create_user("compta@fingec.fr", "password123", "Compta Un")

    auth.set_assignment("Client@Example.com", u["id"])

    # Insensible à la casse + normalisé en minuscule.
    assert auth.get_assignments() == {"client@example.com": u["id"]}
    assert auth.assigned_emails_for(u["id"]) == {"client@example.com"}


def test_reassign_overwrites(db):
    u1 = auth.create_user("a@fingec.fr", "password123")
    u2 = auth.create_user("b@fingec.fr", "password123")

    auth.set_assignment("client@x.com", u1["id"])
    auth.set_assignment("client@x.com", u2["id"])  # un seul propriétaire

    assert auth.get_assignments() == {"client@x.com": u2["id"]}
    assert auth.assigned_emails_for(u1["id"]) == set()
    assert auth.assigned_emails_for(u2["id"]) == {"client@x.com"}


def test_unassign_with_none(db):
    u = auth.create_user("a@fingec.fr", "password123")
    auth.set_assignment("client@x.com", u["id"])

    auth.set_assignment("client@x.com", None)

    assert auth.get_assignments() == {}
    assert auth.assigned_emails_for(u["id"]) == set()


def test_assign_unknown_user_raises(db):
    with pytest.raises(ValueError):
        auth.set_assignment("client@x.com", 9999)


def test_deleting_user_clears_assignments(db):
    u = auth.create_user("a@fingec.fr", "password123")
    auth.set_assignment("client@x.com", u["id"])

    auth.delete_user(u["id"])

    assert auth.get_assignments() == {}

"""Tests de la purge de conservation (RGPD) : exports, journaux, jetons."""
from __future__ import annotations

import json
import os
import time
from datetime import datetime, timedelta
from pathlib import Path

import pytest

import auth
import main


@pytest.fixture
def isolated(tmp_path: Path, monkeypatch):
    """Isole base SQLite + dossiers/fichiers manipulés par la purge."""
    monkeypatch.setattr(auth, "DATA_DIR", tmp_path)
    monkeypatch.setattr(auth, "DB_PATH", tmp_path / "app.db")
    auth.init_db()

    output_dir = tmp_path / "output"
    output_dir.mkdir()
    monkeypatch.setattr(main, "OUTPUT_DIR", output_dir)
    monkeypatch.setattr(main, "LOGS_FILE", tmp_path / "logs.json")
    return tmp_path


def _make_old(path: Path, days: int) -> None:
    old = time.time() - days * 86400
    os.utime(path, (old, old))


def test_purge_outputs_removes_old_keeps_recent(isolated, monkeypatch):
    monkeypatch.setattr(main, "OUTPUT_RETENTION_DAYS", 90)
    old = main.OUTPUT_DIR / "old.xlsx"
    recent = main.OUTPUT_DIR / "recent.xlsx"
    old.write_text("x")
    recent.write_text("x")
    _make_old(old, 120)

    assert main._purge_outputs() == 1
    assert not old.exists()
    assert recent.exists()


def test_purge_outputs_disabled_when_zero(isolated, monkeypatch):
    monkeypatch.setattr(main, "OUTPUT_RETENTION_DAYS", 0)
    old = main.OUTPUT_DIR / "old.xlsx"
    old.write_text("x")
    _make_old(old, 999)

    assert main._purge_outputs() == 0
    assert old.exists()


def test_purge_logs_drops_old_entries(isolated, monkeypatch):
    monkeypatch.setattr(main, "LOGS_RETENTION_DAYS", 365)
    now = datetime.now()
    logs = [
        {"timestamp": now.isoformat(timespec="seconds"), "filename": "recent"},
        {"timestamp": (now - timedelta(days=400)).isoformat(timespec="seconds"), "filename": "vieux"},
        {"filename": "sans_timestamp"},  # gardé par sécurité
    ]
    main.LOGS_FILE.write_text(json.dumps(logs), encoding="utf-8")

    assert main._purge_logs() == 1
    remaining = json.loads(main.LOGS_FILE.read_text(encoding="utf-8"))
    names = {e["filename"] for e in remaining}
    assert names == {"recent", "sans_timestamp"}


def test_purge_expired_tokens(isolated, monkeypatch):
    # Deux utilisateurs distincts : créer un jeton n'invalide que ceux du même user.
    a = auth.create_user("a@fingec.fr", "Valid-Pass-123")
    b = auth.create_user("b@fingec.fr", "Valid-Pass-123")
    valid = auth.create_password_token(a["id"], purpose="setup")
    # Jeton expiré pour B : supprimé par la purge.
    monkeypatch.setitem(auth.RESET_TOKEN_TTL, "reset", timedelta(hours=-1))
    auth.create_password_token(b["id"], purpose="reset")

    assert auth.purge_expired_tokens() == 1
    # Le jeton encore valide de A reste exploitable.
    assert auth.verify_password_token(valid) is not None

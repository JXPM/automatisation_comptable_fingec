"""Tests unitaires de la politique de mot de passe (password_policy.py)."""
from __future__ import annotations

import hashlib

import httpx
import pytest

import password_policy as pp


# ── Robustesse locale ────────────────────────────────────────────────────────
def test_too_short_rejected():
    with pytest.raises(ValueError, match="12 caractères"):
        pp.validate_strength("Aa1!aaa")  # 7 caractères


def test_valid_password_accepted():
    pp.validate_strength("Abcdef-12345")  # 12 car., minuscules+majuscule+chiffre+symbole


def test_requires_class_diversity():
    with pytest.raises(ValueError, match="types de caractères"):
        pp.validate_strength("abcdefghijklmnop")  # 16 car. mais une seule famille


def test_rejects_password_containing_email_local():
    with pytest.raises(ValueError, match="adresse e-mail"):
        pp.validate_strength("Johan-Secret-1", email="johan@fingec.fr")


def test_too_long_rejected():
    with pytest.raises(ValueError, match="trop long"):
        pp.validate_strength("Aa1!" + "x" * 300)


# ── Vérification anti-fuite (HIBP) — réseau mocké ────────────────────────────
class _Resp:
    def __init__(self, status: int, text: str):
        self.status_code = status
        self.text = text


def test_is_pwned_true(monkeypatch):
    monkeypatch.setenv("PWNED_CHECK_ENABLED", "1")
    pwd = "Sup3r-Leaked-Pw!"
    suffix = hashlib.sha1(pwd.encode()).hexdigest().upper()[5:]
    monkeypatch.setattr(pp.httpx, "get", lambda *a, **k: _Resp(200, f"{suffix}:42\r\nAAAA0:1"))
    assert pp.is_pwned(pwd) is True


def test_is_pwned_false(monkeypatch):
    monkeypatch.setenv("PWNED_CHECK_ENABLED", "1")
    monkeypatch.setattr(pp.httpx, "get", lambda *a, **k: _Resp(200, "0000000000000000000000000000000000:1"))
    assert pp.is_pwned("Whatever-Pass-12") is False


def test_is_pwned_fail_open_on_network_error(monkeypatch):
    monkeypatch.setenv("PWNED_CHECK_ENABLED", "1")

    def boom(*a, **k):
        raise httpx.ConnectError("réseau indisponible")

    monkeypatch.setattr(pp.httpx, "get", boom)
    assert pp.is_pwned("Whatever-Pass-12") is False  # ne bloque pas sur panne


def test_is_pwned_disabled_makes_no_call(monkeypatch):
    monkeypatch.setenv("PWNED_CHECK_ENABLED", "0")

    def boom(*a, **k):
        raise AssertionError("aucun appel réseau ne doit avoir lieu")

    monkeypatch.setattr(pp.httpx, "get", boom)
    assert pp.is_pwned("password") is False

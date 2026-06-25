"""Tests d'intégration des durcissements sécurité.

Couvre : cookie de session httpOnly, rate limiting (connexion + mot de passe
oublié), refus des mots de passe faibles/compromis, contrôles admin côté serveur
et liste blanche du proxy n8n.
"""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ADMIN = ("admin@fingec.fr", "admin-password-1")
STRONG = "User-Pass-12345"  # conforme à la politique


@pytest.fixture
def client(tmp_path: Path, monkeypatch):
    import auth
    import emailer
    import main
    import ratelimit

    monkeypatch.setattr(auth, "DATA_DIR", tmp_path)
    monkeypatch.setattr(auth, "DB_PATH", tmp_path / "app.db")

    sent: list[dict] = []

    def fake_send(to, kind, *, full_name="", token=None):
        sent.append({"to": to, "kind": kind, "token": token})
        return True

    monkeypatch.setattr(emailer, "send_account_email", fake_send)
    monkeypatch.setattr(main.emailer, "send_account_email", fake_send)

    monkeypatch.setenv("ADMIN_EMAIL", ADMIN[0])
    monkeypatch.setenv("ADMIN_PASSWORD", ADMIN[1])
    # HIBP et cookie Secure neutralisés par défaut ; le rate limiting reste ACTIF
    # (réinitialisé entre tests) car certains tests le ciblent explicitement.
    monkeypatch.setenv("PWNED_CHECK_ENABLED", "0")
    monkeypatch.setenv("AUTH_COOKIE_SECURE", "0")
    ratelimit.reset()

    with TestClient(main.app) as c:
        c.sent = sent  # type: ignore[attr-defined]
        yield c

    ratelimit.reset()


def _login(client, email, password, **extra):
    return client.post("/auth/login", json={"email": email, "password": password, **extra})


def _make_user(client, email, password=STRONG):
    """Crée un compte (en tant qu'admin) puis se connecte avec — le cookie du
    TestClient pointe ensuite sur ce compte."""
    r = _login(client, *ADMIN)
    assert r.status_code == 200, r.text
    r = client.post("/auth/users", json={"email": email, "password": password})
    assert r.status_code == 201, r.text
    r = _login(client, email, password)
    assert r.status_code == 200, r.text


# ── Cookie de session httpOnly ───────────────────────────────────────────────
def test_login_sets_httponly_cookie(client):
    res = _login(client, *ADMIN)
    assert res.status_code == 200
    set_cookie = res.headers.get("set-cookie", "")
    assert "fingec_token=" in set_cookie
    assert "HttpOnly" in set_cookie
    # Le corps ne doit PAS exposer le jeton au JS sous une autre forme.
    assert "access_token" in res.json()  # encore renvoyé pour les clients hors navigateur


def test_cookie_authorizes_without_bearer(client):
    _login(client, *ADMIN)
    # TestClient renvoie automatiquement le cookie ; aucun header Authorization.
    res = client.get("/auth/me")
    assert res.status_code == 200
    assert res.json()["email"] == ADMIN[0]


def test_logout_clears_cookie(client):
    _login(client, *ADMIN)
    assert client.post("/auth/logout").status_code == 200
    assert client.get("/auth/me").status_code == 401


# ── Rate limiting ────────────────────────────────────────────────────────────
def test_login_rate_limited_after_failures(client):
    for _ in range(5):
        assert _login(client, ADMIN[0], "mauvais-mot-de-passe").status_code == 401
    blocked = _login(client, ADMIN[0], "mauvais-mot-de-passe")
    assert blocked.status_code == 429
    assert "retry-after" in {k.lower() for k in blocked.headers}
    # Même un bon mot de passe est bloqué tant que la fenêtre n'est pas écoulée.
    assert _login(client, *ADMIN).status_code == 429


def test_successful_login_resets_counter(client):
    for _ in range(3):
        assert _login(client, ADMIN[0], "mauvais").status_code == 401
    assert _login(client, *ADMIN).status_code == 200  # succès → compteur remis à zéro
    for _ in range(5):
        assert _login(client, ADMIN[0], "mauvais").status_code == 401  # 5 nouveaux échecs OK


def test_forgot_password_rate_limited(client):
    for _ in range(5):
        assert client.post("/auth/forgot-password", json={"email": "x@fingec.fr"}).status_code == 200
    assert client.post("/auth/forgot-password", json={"email": "x@fingec.fr"}).status_code == 429


# ── Politique de mot de passe (faible / compromis) ───────────────────────────
def test_weak_password_rejected_on_create(client):
    _login(client, *ADMIN)
    short = client.post("/auth/users", json={"email": "w@fingec.fr", "password": "court"})
    assert short.status_code == 400
    one_class = client.post("/auth/users", json={"email": "w2@fingec.fr", "password": "abcdefghijklmnop"})
    assert one_class.status_code == 400


def test_pwned_password_rejected_on_reset(client, monkeypatch):
    import password_policy

    monkeypatch.setattr(password_policy, "is_pwned", lambda pwd: True)
    _login(client, *ADMIN)
    client.post("/auth/users", json={"email": "p@fingec.fr"})  # envoie un lien setup
    token = [m for m in client.sent if m["kind"] == "setup"][-1]["token"]
    res = client.post("/auth/reset-password", json={"token": token, "new_password": "Strong-Pass-9999"})
    assert res.status_code == 400
    assert "fuite" in res.json()["detail"].lower()


# ── Contrôles admin côté serveur ─────────────────────────────────────────────
def test_admin_endpoints_enforced_server_side(client):
    _make_user(client, "reg@fingec.fr")  # cookie = utilisateur simple
    assert client.get("/auth/users").status_code == 403
    assert client.delete("/logs").status_code == 403
    assert client.put("/api/assignments",
                      json={"client_email": "c@x.fr", "user_id": 1}).status_code == 403


# ── Liste blanche du proxy n8n ───────────────────────────────────────────────
def test_n8n_proxy_blocks_disallowed_paths_for_user(client):
    _make_user(client, "u@fingec.fr")  # cookie = utilisateur simple
    # Webhooks sensibles non exposés aux non-admins (bloqué AVANT tout appel réseau).
    assert client.get("/n8n/webhook/get-clients").status_code == 403
    assert client.post("/n8n/webhook/send-account-email", json={}).status_code == 403
    # Un webhook d'action client sans attribution est également refusé.
    assert client.post("/n8n/webhook/relance-client",
                      json={"email": "pasamoi@x.fr"}).status_code == 403

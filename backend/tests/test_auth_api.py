"""Tests d'intégration des endpoints d'auth (FastAPI TestClient).

L'e-mailer est mocké : aucun appel réseau, et on capture ce qui aurait été
envoyé pour récupérer les jetons dans les assertions.
"""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path: Path, monkeypatch):
    import auth
    import emailer
    import main

    # Base isolée.
    monkeypatch.setattr(auth, "DATA_DIR", tmp_path)
    monkeypatch.setattr(auth, "DB_PATH", tmp_path / "app.db")

    # Capture des e-mails au lieu de les envoyer.
    sent: list[dict] = []

    def fake_send(to, kind, *, full_name="", token=None):
        sent.append({"to": to, "kind": kind, "full_name": full_name, "token": token})
        return True

    monkeypatch.setattr(emailer, "send_account_email", fake_send)
    monkeypatch.setattr(main.emailer, "send_account_email", fake_send)

    # Admin initial déterministe.
    monkeypatch.setenv("ADMIN_EMAIL", "admin@fingec.fr")
    monkeypatch.setenv("ADMIN_PASSWORD", "admin-password-1")

    # Neutralise les protections à effets de bord pour ces tests fonctionnels :
    # rate limiting (état partagé entre tests), HIBP (réseau), cookie Secure (HTTP).
    monkeypatch.setenv("RATELIMIT_ENABLED", "0")
    monkeypatch.setenv("PWNED_CHECK_ENABLED", "0")
    monkeypatch.setenv("AUTH_COOKIE_SECURE", "0")

    with TestClient(main.app) as c:
        c.sent = sent  # type: ignore[attr-defined]
        yield c


def _login(client, email, password):
    res = client.post("/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


# ── Création de compte avec e-mail de définition ─────────────────────────────
def test_create_user_without_password_sends_setup_email(client):
    admin = _login(client, "admin@fingec.fr", "admin-password-1")

    res = client.post(
        "/auth/users",
        headers=_auth(admin),
        json={"email": "new@fingec.fr", "full_name": "Nouveau"},
    )
    assert res.status_code == 201, res.text
    assert res.json()["setup_email_sent"] is True

    setup = [m for m in client.sent if m["kind"] == "setup"]
    assert len(setup) == 1
    assert setup[0]["to"] == "new@fingec.fr"
    token = setup[0]["token"]
    assert token

    # Le compte ne peut pas encore se connecter (mot de passe aléatoire inconnu)…
    bad = client.post("/auth/login", json={"email": "new@fingec.fr", "password": "?"})
    assert bad.status_code == 401

    # …mais le lien permet de définir le mot de passe.
    res = client.post("/auth/reset-password", json={"token": token, "new_password": "mon-mdp-1234"})
    assert res.status_code == 200, res.text
    _login(client, "new@fingec.fr", "mon-mdp-1234")  # ne lève pas


def test_create_user_with_explicit_password_skips_email(client):
    admin = _login(client, "admin@fingec.fr", "admin-password-1")
    res = client.post(
        "/auth/users",
        headers=_auth(admin),
        json={"email": "direct@fingec.fr", "password": "explicit-12345"},
    )
    assert res.status_code == 201
    assert res.json()["setup_email_sent"] is None
    assert not any(m["kind"] == "setup" for m in client.sent)
    _login(client, "direct@fingec.fr", "explicit-12345")


# ── Mot de passe oublié ──────────────────────────────────────────────────────
def test_forgot_password_unknown_email_is_silent_200(client):
    res = client.post("/auth/forgot-password", json={"email": "inconnu@nowhere.fr"})
    assert res.status_code == 200
    assert not any(m["kind"] == "reset" for m in client.sent)


def test_forgot_then_reset_flow(client):
    admin = _login(client, "admin@fingec.fr", "admin-password-1")
    client.post("/auth/users", headers=_auth(admin),
                json={"email": "u@fingec.fr", "password": "ancien-mdp-123"})

    res = client.post("/auth/forgot-password", json={"email": "u@fingec.fr"})
    assert res.status_code == 200
    reset = [m for m in client.sent if m["kind"] == "reset"]
    assert len(reset) == 1
    token = reset[0]["token"]

    # Vérification du lien (pré-remplit l'e-mail).
    check = client.get(f"/auth/reset-password/{token}")
    assert check.status_code == 200
    assert check.json()["email"] == "u@fingec.fr"

    res = client.post("/auth/reset-password", json={"token": token, "new_password": "tout-neuf-99"})
    assert res.status_code == 200
    _login(client, "u@fingec.fr", "tout-neuf-99")

    # Ancien mot de passe révoqué.
    bad = client.post("/auth/login", json={"email": "u@fingec.fr", "password": "ancien-mdp-123"})
    assert bad.status_code == 401


def test_reset_with_invalid_token_rejected(client):
    res = client.post("/auth/reset-password", json={"token": "bidon", "new_password": "peu-importe-1"})
    assert res.status_code == 400


# ── Changement de mot de passe (connecté) ────────────────────────────────────
def test_change_password_requires_correct_current(client):
    admin = _login(client, "admin@fingec.fr", "admin-password-1")
    client.post("/auth/users", headers=_auth(admin),
                json={"email": "c@fingec.fr", "password": "actuel-mdp-123"})
    token = _login(client, "c@fingec.fr", "actuel-mdp-123")

    # Mauvais mot de passe actuel → refus.
    bad = client.post("/auth/change-password", headers=_auth(token),
                      json={"current_password": "faux", "new_password": "nouveau-mdp-12"})
    assert bad.status_code == 400

    ok = client.post("/auth/change-password", headers=_auth(token),
                     json={"current_password": "actuel-mdp-123", "new_password": "nouveau-mdp-12"})
    assert ok.status_code == 200
    _login(client, "c@fingec.fr", "nouveau-mdp-12")


def test_change_password_requires_auth(client):
    res = client.post("/auth/change-password",
                      json={"current_password": "x", "new_password": "yyyyyyyy"})
    assert res.status_code == 401


# ── Profil (nom + photo) ─────────────────────────────────────────────────────
def test_update_profile_name_and_avatar(client):
    admin = _login(client, "admin@fingec.fr", "admin-password-1")
    client.post("/auth/users", headers=_auth(admin),
                json={"email": "p@fingec.fr", "full_name": "Ancien", "password": "profil-mdp-123"})
    token = _login(client, "p@fingec.fr", "profil-mdp-123")

    avatar = "data:image/jpeg;base64,/9j/abc"
    res = client.patch("/auth/me", headers=_auth(token),
                       json={"full_name": "Nouveau Nom", "avatar_url": avatar})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["full_name"] == "Nouveau Nom"
    assert body["avatar_url"] == avatar
    assert body["email"] == "p@fingec.fr"  # l'e-mail n'est jamais touché

    # Persisté : /auth/me renvoie la nouvelle valeur.
    me = client.get("/auth/me", headers=_auth(token))
    assert me.json()["full_name"] == "Nouveau Nom"

    # Retrait de la photo (chaîne vide).
    res = client.patch("/auth/me", headers=_auth(token), json={"avatar_url": ""})
    assert res.status_code == 200
    assert res.json()["avatar_url"] == ""


def test_update_profile_rejects_empty_name_and_bad_image(client):
    admin = _login(client, "admin@fingec.fr", "admin-password-1")
    client.post("/auth/users", headers=_auth(admin),
                json={"email": "q@fingec.fr", "password": "profil-mdp-123"})
    token = _login(client, "q@fingec.fr", "profil-mdp-123")

    assert client.patch("/auth/me", headers=_auth(token),
                        json={"full_name": "   "}).status_code == 422
    assert client.patch("/auth/me", headers=_auth(token),
                        json={"avatar_url": "http://evil/x.png"}).status_code == 422
    assert client.patch("/auth/me", headers=_auth(token), json={}).status_code == 400


def test_update_profile_requires_auth(client):
    assert client.patch("/auth/me", json={"full_name": "X"}).status_code == 401


def test_onboarded_flag_lifecycle(client):
    admin = _login(client, "admin@fingec.fr", "admin-password-1")
    client.post("/auth/users", headers=_auth(admin),
                json={"email": "o@fingec.fr", "password": "profil-mdp-123"})
    token = _login(client, "o@fingec.fr", "profil-mdp-123")

    # Nouveau compte : pas encore passé par le guide.
    assert client.get("/auth/me", headers=_auth(token)).json()["onboarded"] is False

    # Marqué comme vu, puis persistant.
    res = client.patch("/auth/me", headers=_auth(token), json={"onboarded": True})
    assert res.status_code == 200
    assert res.json()["onboarded"] is True
    assert client.get("/auth/me", headers=_auth(token)).json()["onboarded"] is True

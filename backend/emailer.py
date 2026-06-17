"""Envoi des e-mails « compte » (création / mot de passe).

Ces e-mails sont DISTINCTS des relances clients de l'automatisation : ils partent
vers les comptables/admins de Fingec, pas vers les clients. On les route donc par
un webhook n8n dédié (`ACCOUNT_EMAIL_WEBHOOK_PATH`), à brancher sur le même compte
Gmail mais avec son propre modèle (sujet/contenu).

Repli : si le webhook n'est pas configuré (dev/local) ou échoue, on NE casse pas
l'API — on journalise le lien dans stdout. Ainsi un admin peut toujours le
récupérer dans les logs, et les tests tournent sans dépendance réseau.
"""
from __future__ import annotations

import os

import httpx

# Base publique de l'app, pour construire les liens cliquables des e-mails.
APP_BASE_URL = os.environ.get("APP_BASE_URL", "http://localhost:5173").rstrip("/")

# Webhook n8n dédié aux e-mails de compte. Vide = repli sur log uniquement.
N8N_BASE_URL = os.environ.get("N8N_BASE_URL", "http://localhost:5678").rstrip("/")
ACCOUNT_EMAIL_WEBHOOK_PATH = os.environ.get(
    "ACCOUNT_EMAIL_WEBHOOK_PATH", "webhook/send-account-email"
).strip().strip("/")


def reset_link(token: str) -> str:
    """URL cliquable du formulaire de définition de mot de passe."""
    return f"{APP_BASE_URL}/reset-password?token={token}"


# Modèles : (sujet, accroche). Le rendu HTML final est fait côté n8n à partir des
# champs envoyés, ce qui laisse le modèle modifiable sans redéploiement du backend.
_TEMPLATES = {
    "setup": (
        "Bienvenue chez Fingec 🎉 — définissez votre mot de passe",
        "Un compte vient d'être créé pour vous sur l'espace comptabilité Fingec. "
        "Cliquez sur le lien ci-dessous pour définir votre mot de passe.",
    ),
    "reset": (
        "Réinitialisation de votre mot de passe Fingec",
        "Vous avez demandé à réinitialiser votre mot de passe. "
        "Cliquez sur le lien ci-dessous pour en choisir un nouveau. "
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
    ),
    "changed": (
        "Votre mot de passe Fingec a été modifié",
        "Votre mot de passe vient d'être modifié. Si vous n'êtes pas à l'origine "
        "de ce changement, contactez immédiatement votre administrateur.",
    ),
}


def _post_webhook(payload: dict) -> bool:
    if not ACCOUNT_EMAIL_WEBHOOK_PATH:
        return False
    target = f"{N8N_BASE_URL}/{ACCOUNT_EMAIL_WEBHOOK_PATH}"
    try:
        resp = httpx.post(target, json=payload, timeout=15.0)
        resp.raise_for_status()
        return True
    except httpx.HTTPError as exc:
        print(f"⚠️  Envoi e-mail compte échoué ({target}) : {exc}", flush=True)
        return False


def send_account_email(to: str, kind: str, *, full_name: str = "", token: str | None = None) -> bool:
    """Envoie un e-mail de compte. `kind` ∈ {setup, reset, changed}.

    Best-effort : renvoie True si le webhook a accepté, False sinon (repli log).
    Ne lève jamais — l'appelant ne doit pas révéler au client si l'envoi a réussi.
    """
    subject, intro = _TEMPLATES.get(kind, _TEMPLATES["reset"])
    link = reset_link(token) if token else None
    payload = {
        "to": to,
        "kind": kind,
        "subject": subject,
        "intro": intro,
        "full_name": full_name,
        "link": link,
    }
    sent = _post_webhook(payload)
    if not sent:
        # Repli : trace exploitable par un admin si l'e-mail n'est pas parti.
        detail = f" lien={link}" if link else ""
        print(f"📧 [repli e-mail] {kind} → {to}{detail}", flush=True)
    return sent

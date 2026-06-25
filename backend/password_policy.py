"""Politique de mots de passe : robustesse locale + anti-fuite (Have I Been Pwned).

Centralise TOUTES les règles de mot de passe pour qu'elles s'appliquent à
l'identique partout (création de compte, réinitialisation par lien, changement
par l'utilisateur connecté, CLI `manage.py`).

- `validate_strength` : règles locales (longueur, diversité), sans réseau.
- `is_pwned` : interroge l'API « Have I Been Pwned » en k-anonymity (on n'envoie
  QUE les 5 premiers caractères du SHA-1, jamais le mot de passe ni son hash
  complet). Échoue « ouvert » si l'API est injoignable (pas de blocage sur panne).
"""
from __future__ import annotations

import hashlib
import os

import httpx

# Longueur minimale. NIST 800-63B privilégie la longueur sur la complexité.
MIN_LENGTH = int(os.environ.get("PASSWORD_MIN_LENGTH", "12"))
MAX_LENGTH = 200  # borne haute (bcrypt tronque au-delà de 72 octets ; on cadre l'entrée)
# Familles de caractères : minuscule, majuscule, chiffre, symbole.
MIN_CHARACTER_CLASSES = int(os.environ.get("PASSWORD_MIN_CLASSES", "3"))

# Mots de passe structurellement faibles malgré une longueur suffisante.
_COMMON = {
    "password", "passwordpassword", "motdepasse", "azertyuiop", "qwertyuiop",
    "123456789012", "administrateur", "fingecfingec", "changemechangeme",
}


def validate_strength(password: str, *, email: str | None = None) -> None:
    """Lève ``ValueError`` si le mot de passe est trop faible. Aucune E/S réseau."""
    if not password or len(password) < MIN_LENGTH:
        raise ValueError(f"Le mot de passe doit contenir au moins {MIN_LENGTH} caractères.")
    if len(password) > MAX_LENGTH:
        raise ValueError(f"Le mot de passe est trop long ({MAX_LENGTH} caractères maximum).")
    classes = sum((
        any(c.islower() for c in password),
        any(c.isupper() for c in password),
        any(c.isdigit() for c in password),
        any(not c.isalnum() for c in password),
    ))
    if classes < MIN_CHARACTER_CLASSES:
        raise ValueError(
            f"Le mot de passe doit mélanger au moins {MIN_CHARACTER_CLASSES} types de "
            "caractères parmi : minuscules, majuscules, chiffres et symboles."
        )
    low = password.lower()
    if low in _COMMON:
        raise ValueError("Ce mot de passe est trop courant. Choisissez-en un autre.")
    if email:
        local = email.split("@", 1)[0].lower()
        if len(local) >= 3 and local in low:
            raise ValueError("Le mot de passe ne doit pas contenir votre adresse e-mail.")


def _pwned_check_enabled() -> bool:
    return os.environ.get("PWNED_CHECK_ENABLED", "1").strip().lower() not in {"0", "false", "no", ""}


def is_pwned(password: str) -> bool:
    """``True`` si le mot de passe figure dans une fuite connue (HIBP).

    k-anonymity : on envoie seulement le préfixe (5 caractères) du SHA-1 et on
    compare localement les suffixes renvoyés. En cas d'indisponibilité de l'API,
    on retourne ``False`` (fail-open) pour ne pas bloquer sur une panne externe.
    """
    if not _pwned_check_enabled() or not password:
        return False
    digest = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
    prefix, suffix = digest[:5], digest[5:]
    try:
        resp = httpx.get(
            f"https://api.pwnedpasswords.com/range/{prefix}",
            headers={"Add-Padding": "true"},  # bruite la réponse (anti-corrélation)
            timeout=4.0,
        )
    except httpx.HTTPError:
        return False
    if resp.status_code != 200:
        return False
    for line in resp.text.splitlines():
        hash_suffix, _, _count = line.partition(":")
        if hash_suffix.strip().upper() == suffix:
            return True
    return False

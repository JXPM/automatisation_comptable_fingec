"""Limitation de débit en mémoire (fenêtre glissante) — anti-bruteforce.

Suffisant pour le déploiement actuel : une seule instance, un seul worker
uvicorn (cf. Dockerfile.backend). L'état est volatil (réinitialisé au
redémarrage), ce qui est acceptable pour de l'anti-bruteforce sur la connexion.

Désactivable via ``RATELIMIT_ENABLED=0`` (utilisé par les tests).
"""
from __future__ import annotations

import os
import threading
import time

_lock = threading.Lock()
_hits: dict[str, list[float]] = {}


def enabled() -> bool:
    return os.environ.get("RATELIMIT_ENABLED", "1").strip().lower() not in {"0", "false", "no", ""}


def reset() -> None:
    """Vide tout l'état (tests)."""
    with _lock:
        _hits.clear()


def check(key: str, *, limit: int, window: int) -> tuple[bool, int]:
    """Indique si une nouvelle action est permise pour ``key``.

    Renvoie ``(allowed, retry_after_seconds)``. N'enregistre PAS l'action :
    appeler ``record`` pour la comptabiliser. Ce découpage permet de ne compter
    que les échecs (ex. connexion) tout en lisant l'état avant de tenter.
    """
    if not enabled():
        return True, 0
    now = time.time()
    cutoff = now - window
    with _lock:
        times = [t for t in _hits.get(key, []) if t > cutoff]
        _hits[key] = times
        if len(times) >= limit:
            retry = int(times[0] + window - now) + 1
            return False, max(retry, 1)
    return True, 0


def record(key: str, *, window: int) -> None:
    """Comptabilise une action pour ``key`` (purge au passage les entrées périmées)."""
    if not enabled():
        return
    now = time.time()
    cutoff = now - window
    with _lock:
        times = [t for t in _hits.get(key, []) if t > cutoff]
        times.append(now)
        _hits[key] = times


def clear(key: str) -> None:
    """Efface le compteur d'une clé (ex. après une connexion réussie)."""
    with _lock:
        _hits.pop(key, None)

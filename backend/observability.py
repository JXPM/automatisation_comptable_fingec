"""Observabilité : Sentry (optionnel) + journal des événements de sécurité.

- **Sentry** n'est activé que si ``SENTRY_DSN`` est défini (sinon no-op total) :
  rien à configurer tant qu'on ne fournit pas le DSN, et aucune dépendance dure
  (l'absence du SDK est tolérée).
- ``security_event`` écrit une ligne de log structurée (récupérée par Docker →
  Dozzle/Netdata) et, si ``alert=True``, remonte l'événement à Sentry pour
  déclencher une alerte e-mail (ex. pic de bruteforce).
"""
from __future__ import annotations

import logging
import os

_log = logging.getLogger("fingec.security")

try:  # le SDK peut être absent (dev minimal) : tout devient no-op
    import sentry_sdk
except ImportError:  # pragma: no cover
    sentry_sdk = None  # type: ignore[assignment]

_sentry_on = False


def init_sentry() -> None:
    """Initialise Sentry si ``SENTRY_DSN`` est présent. Idempotent en pratique."""
    global _sentry_on
    dsn = os.environ.get("SENTRY_DSN", "").strip()
    if not dsn or sentry_sdk is None:
        return
    sentry_sdk.init(
        dsn=dsn,
        environment=os.environ.get("SENTRY_ENV", "production"),
        traces_sample_rate=float(os.environ.get("SENTRY_TRACES_SAMPLE_RATE", "0") or 0),
        # RGPD : ne pas capturer corps/headers de requête (contiennent le cookie
        # de session et des e-mails clients).
        send_default_pii=False,
    )
    _sentry_on = True


def security_event(name: str, *, level: str = "warning", alert: bool = False, **fields) -> None:
    """Journalise un événement de sécurité.

    ``name`` : identifiant court (ex. ``login_failed``). ``fields`` : contexte
    (ip, email, path…). ``alert=True`` remonte l'événement à Sentry.
    """
    detail = " ".join(f"{k}={v}" for k, v in fields.items())
    getattr(_log, level, _log.warning)("security:%s %s", name, detail)
    if alert and _sentry_on and sentry_sdk is not None:
        with sentry_sdk.push_scope() as scope:
            scope.set_tag("security_event", name)
            for key, value in fields.items():
                scope.set_extra(key, value)
            sentry_sdk.capture_message(f"security:{name}", level="warning")

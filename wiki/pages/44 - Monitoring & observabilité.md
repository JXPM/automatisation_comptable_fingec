---
type: system
tags: [fingec, automatisation-comptable, infra, monitoring, observabilite]
updated: 2026-06-25
status: draft
---

# 44 — Monitoring & observabilité

> [!info] Session du 2026-06-25
> Stack de monitoring décidée avec Johan (4 axes) puis instrumentée. **Code en place et inerte sans secrets** ; reste des actions manuelles (création projets Sentry, lancement de l'overlay). Voir le guide **`deploy/MONITORING.md`** et la mémoire `monitoring-stack`. Lié à [[15 - Durcissement sécurité (cookie, mdp, anti-bruteforce)]], [[40 - Déploiement (CI-CD & VPS)]].

## Choix actés
- **Erreurs** : **Sentry SaaS gratuit**, région **UE** (RGPD). Pas de self-host (GlitchTip trop lourd pour le VPS partagé).
- **Alertes** : par **e-mail**.
- **Dashboards auto-hébergés** : **non exposés publiquement** (ports sur `127.0.0.1`, accès par **tunnel SSH**) → **aucune modif du Caddy partagé** ([[41 - Caddy & routage]]).

## Les 4 axes
| Axe | Outil | Alerte e-mail |
|---|---|---|
| Disponibilité (uptime) + expiration TLS | **Uptime Kuma** | ✅ SMTP (config dans Kuma) |
| Erreurs back + front | **Sentry** | ✅ (e-mail Sentry) |
| Tentatives d'intrusion | **Sentry** via `security_event` | ✅ (e-mail Sentry) |
| Métriques serveur (CPU/RAM/disque/conteneurs) | **Netdata** | dashboard (option Netdata Cloud) |
| Logs conteneurs en direct | **Dozzle** | dashboard |

## Instrumentation code (déjà en place)
- **`backend/observability.py`** :
  - `init_sentry()` — activée seulement si `SENTRY_DSN` défini (no-op sinon) ; `send_default_pii=False` (RGPD : pas de corps/headers, donc pas de cookie ni e-mails clients capturés). Appelée au tout début de `main.py`.
  - `security_event(name, alert=…, **fields)` — log structuré (logger **`fingec.security`**, visible dans Dozzle) + remontée Sentry si `alert=True`.
- **Front** : `main.tsx` initialise `@sentry/react` si `VITE_SENTRY_DSN` (injecté au **build**).
- Deps : `sentry-sdk[fastapi]` (backend requirements), `@sentry/react` (package.json).

### Événements de sécurité émis
| Événement | Quand | → Sentry (alerte) |
|---|---|---|
| `login_failed` | mauvais e-mail/mdp | non (bruit) |
| `login_blocked` | rate-limit connexion (5/15 min) | ✅ |
| `forgot_password_blocked` | rate-limit oubli (5/h) | ✅ |
| `proxy_path_denied` | non-admin → webhook n8n interdit | non |
| `proxy_client_denied` | action sur client non attribué | non |

## Infra (overlay optionnel)
- **`docker-compose.monitoring.yml`** (séparé du compose principal) : **Uptime Kuma** (`127.0.0.1:3001`), **Netdata** (`127.0.0.1:19999`), **Dozzle** (`127.0.0.1:8888`). Kuma rejoint le réseau `pharmaclick_web` pour sonder `http://fingec-backend:8000/health` par nom interne.
- Lancement : `docker compose -f docker-compose.monitoring.yml up -d`.
- Accès : `ssh -L 3001:127.0.0.1:3001 -L 19999:127.0.0.1:19999 -L 8888:127.0.0.1:8888 <user>@srv1713887`.

## Reste à faire (actions Johan, secrets) — cf. `deploy/MONITORING.md`
1. Créer 2 projets Sentry (FastAPI + React, UE) → `SENTRY_DSN` + `VITE_SENTRY_DSN` dans `.env` → rebuild backend+frontend.
2. Lancer l'overlay monitoring sur le VPS.
3. Uptime Kuma : compte admin + notification SMTP + moniteur `/health` + alerte TLS.

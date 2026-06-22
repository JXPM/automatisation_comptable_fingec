---
type: system
tags: [fingec, automatisation-comptable, infra, docker]
updated: 2026-06-22
status: stable
---

# 42 — Conteneurs, images & exécution (Docker)

Comment l'app tourne réellement en prod : **3 conteneurs** orchestrés par `docker-compose.yml`, derrière le Caddy mutualisé de pharmaclick. Procédure : [[40 - Déploiement (CI-CD & VPS)]] ; routage : [[41 - Caddy & routage]].

## Services (`docker-compose.yml`)
| Service | Image / build | Expose | Rôle |
|---|---|---|---|
| **fingec-backend** | `Dockerfile.backend` (python:3.12-slim, uvicorn) | `8000` (interne) | API FastAPI ([[10 - Backend FastAPI]]). Volume `fingec-data:/data`. **1 worker** (`logs.json` non concurrent-safe). HEALTHCHECK `/health`. |
| **fingec-frontend** | `frontend/Dockerfile` (build node:20 → **nginx:1.27**) | `80` (interne) | SPA statique. `nginx.conf` : cache long sur `/assets/`, fallback SPA, en-têtes sécurité (`nosniff`, `X-Frame-Options DENY`, `Referrer-Policy`). |
| **fingec-n8n** | `docker.n8n.io/n8nio/n8n:latest` | `5678` (interne) | Automatisation ([[30 - Workflow n8n « fingec automatisation »]]). Volume `fingec-n8n-data`. |

- **Aucun port publié** : seul Caddy (réseau **externe `pharmaclick_web`**) expose 80/443 et gère le HTTPS. Les conteneurs se joignent par leur **nom** (DNS Docker).

## Variables d'environnement clés (backend, via `.env`)
| Var | Rôle | Défaut |
|---|---|---|
| `BACKEND_DATA_DIR` | racine uploads/outputs/logs | `/data` (compose) |
| `AUTH_SECRET` | **signature JWT** — obligatoire en prod (sinon secret éphémère → 401 après redémarrage) | — |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | amorçage du 1er admin (base vide) | — |
| `FRONTEND_ORIGINS` | CORS (séparés par virgule) | `http://localhost:5173` |
| `APP_BASE_URL` | base des liens des e-mails de compte | `https://app.fingec.fr` |
| `N8N_BASE_URL` | service n8n interne | `http://fingec-n8n:5678` |
| `OUTPUT_RETENTION_DAYS` / `LOGS_RETENTION_DAYS` | purge RGPD | 90 / 365 ([[Conformité RGPD & pack légal]]) |

## n8n (conteneur)
- `N8N_HOST=n8n.fingec.fr`, `WEBHOOK_URL=https://app.fingec.fr/n8n/` (webhooks de prod via le dashboard authentifié), `N8N_PROXY_HOPS=1`, TZ `Europe/Paris`.
- ⚠️ **`N8N_ENCRYPTION_KEY` doit rester stable** : la changer rend illisibles les credentials enregistrés ([[31 - Credentials Google OAuth (Sheets & Gmail)]]).

## Dépendances Python (`backend/requirements.txt`)
`pandas, openpyxl, fastapi, uvicorn[standard], python-multipart, pyjwt, bcrypt, httpx, pydantic[email]`. `pytest` est installé séparément par la CI ([[51 - Tests automatisés]]).

> [!note] Dév local
> Backend : `uvicorn main:app --port 8001` (le proxy Vite pointe sur `:8001`). Frontend : `npm run dev` (`:5173`). Base SQLite locale via `BACKEND_DATA_DIR`.

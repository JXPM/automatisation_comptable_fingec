---
type: system
tags: [fingec, automatisation-comptable, backend]
updated: 2026-06-17
---

# 10 — Backend FastAPI

App FastAPI (`backend/main.py`). Point d'entrée unique de l'API : auth, traitement comptable, clients/attribution, proxy n8n.

## Modules
- `main.py` — endpoints HTTP, CORS, upload, proxy n8n.
- `auth.py` — utilisateurs SQLite, bcrypt, JWT, jetons mot de passe, attribution clients. [[11 - Authentification & comptes]].
- `emailer.py` — e-mails de compte via webhook n8n. [[12 - E-mails de compte (emailer + n8n)]].
- `processor.py` — moteur pandas (nettoyage/TVA/anomalies). [[13 - Traitement comptable (Quadra)]].
- `cli.py` — traitement en ligne de commande (alternatif à l'API).
- `manage.py` — utilitaire d'admin.

## Configuration (env)
| Variable | Rôle | Défaut |
|---|---|---|
| `BACKEND_DATA_DIR` | racine uploads/outputs/logs/`app.db` (mount persistant en prod) | dépôt |
| `FRONTEND_ORIGINS` | origines CORS autorisées (comma-separated) | `http://localhost:5173` |
| `N8N_BASE_URL` | URL interne du service n8n | `http://localhost:5678` |
| `AUTH_SECRET` | secret de signature JWT (**obligatoire en prod**) | éphémère ⚠️ |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | amorce l'admin initial si base vide | — |
| `APP_BASE_URL` | base publique pour les liens e-mail | `http://localhost:5173` |
| `ACCOUNT_EMAIL_WEBHOOK_PATH` | webhook n8n e-mails de compte | `webhook/send-account-email` |

## Endpoints (résumé)
Catalogue complet : [[50 - Glossaire, endpoints & webhooks]].
- **Public** : `GET /health` (healthcheck Docker), `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`.
- **Authentifié** (`get_current_user`) : `GET /auth/me`, `POST /auth/change-password`, `POST /process`, `GET /download/{f}`, `GET /logs`, `GET /api/clients`, `GET /api/historique`, `ANY /n8n/{path}`.
- **Admin** (`require_admin`) : `GET/POST /auth/users`, `PATCH/DELETE /auth/users/{id}`, `DELETE /logs`, `PUT /api/assignments`.

## Sécurité upload (`/process`)
- `_safe_filename` (whitelist) + `_resolve_within` (anti path-traversal). Limite **50 Mio** (`MAX_UPLOAD_BYTES`), extensions `.csv/.xlsx/.xls`. Le fichier source est supprimé après traitement (`finally`).

## Proxy n8n authentifié (`backend/main.py:469`)
- `ANY /n8n/{path}` relaie vers `N8N_BASE_URL` **après vérification JWT**.
- Retire les en-têtes `Authorization`, `If-None-Match`, `If-Modified-Since` (évite les **304 corps vide** mal interprétés par le front) et **`Accept-Encoding`** du navigateur (sinon br/zstd non décodés par httpx → JSON illisible). Cf. commits « 304 » et « Accept-Encoding ».
- **Enforcement** : pour les webhooks d'action (`_CLIENT_ACTION_PATHS` = relance-client, marquer-recu, envoi-initial, relance-historique), un `user` non-admin ne peut agir que sur un **client qui lui est attribué** (sinon 403). [[11 - Authentification & comptes]].

## Journalisation
- Chaque traitement comptable est journalisé dans `logs.json` (max 500 entrées, plus récent en premier) : fichier, pays, lignes, score de fiabilité, erreurs/warnings, anomalies. Exposé par `GET /logs` ([[20 - Frontend - structure & pages]] page Logs).

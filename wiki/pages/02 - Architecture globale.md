---
type: system
tags: [fingec, automatisation-comptable, architecture]
updated: 2026-06-17
---

# 02 — Architecture globale

## Schéma des flux
```
Navigateur (app.fingec.fr)
        │  HTTPS
        ▼
   Caddy (reverse proxy partagé, VPS Hostinger)         [[41 - Caddy & routage]]
        ├── /              → SPA React (build statique)  [[20 - Frontend - structure & pages]]
        ├── /auth, /api, /process, /download, /logs, /n8n → backend FastAPI
        ▼
   Backend FastAPI (conteneur fingec-backend)            [[10 - Backend FastAPI]]
        ├── SQLite app.db (users + attribution clients)  [[11 - Authentification & comptes]]
        ├── moteur pandas (traitement comptable)         [[13 - Traitement comptable (Quadra)]]
        └── proxy authentifié /n8n/* ───────────┐
                                                 ▼
   n8n (conteneur fingec-n8n, n8n.fingec.fr)     [[30 - Workflow n8n « fingec automatisation »]]
        ├── webhooks (get-clients, relance-client, send-account-email, …)
        ├── Google Sheets (clients, historique)   [[31 - Credentials Google OAuth (Sheets & Gmail)]]
        └── Gmail (envoi des e-mails)
```

## Responsabilités par couche
| Couche | Rôle | Détail |
|---|---|---|
| **Frontend** | SPA React/Vite/TS, appelle le backend via `authFetch` (JWT Bearer) | [[20 - Frontend - structure & pages]] |
| **Backend** | API FastAPI : auth, traitement comptable, **proxy authentifié vers n8n**, filtrage clients par utilisateur | [[10 - Backend FastAPI]] |
| **n8n** | Automatisation : lecture/écriture Google Sheets, envoi des e-mails (relances + comptes) | [[30 - Workflow n8n « fingec automatisation »]] |
| **Google Sheets** | Source de vérité des **clients** et de l'**historique** des envois | — |
| **SQLite** | Utilisateurs, jetons mot de passe, attribution `client_email → user_id` | [[11 - Authentification & comptes]] |

## Dév vs prod
- **Dév** : backend `uvicorn main:app --reload --port 8000`, frontend `npm run dev` (port 5173). Le proxy Vite forwarde `/auth`, `/n8n`, `/process`, etc. vers `localhost:8000`. `N8N_BASE_URL` par défaut `http://localhost:5678`.
- **Prod** : conteneurs Docker (`docker-compose.yml`, `Dockerfile.backend`) sur **VPS Hostinger**, derrière le **Caddy partagé** de pharmaclick. `N8N_BASE_URL` résolu par le DNS Docker (`http://fingec-n8n:5678`). Voir [[40 - Déploiement (CI-CD & VPS)]].

## Points d'architecture notables
- **n8n derrière auth** : le frontend appelle `/n8n/<path>` ; le backend (`backend/main.py:469` `n8n_proxy`) **vérifie le JWT** puis relaie. n8n n'est jamais exposé sans authentification.
- **Filtrage par utilisateur** : `/api/clients` et `/api/historique` récupèrent les données via n8n puis **filtrent selon l'attribution** (un comptable ne voit que ses clients). Les webhooks d'**action** sont aussi contrôlés (`_CLIENT_ACTION_PATHS`). [[11 - Authentification & comptes]].
- **Données clients hors SQL** : volontaire — le cabinet gère ses clients dans Google Sheets, n8n fait le pont.

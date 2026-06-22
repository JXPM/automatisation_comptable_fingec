---
type: reference
tags: [fingec, automatisation-comptable, infra, dette-technique]
updated: 2026-06-22
status: stable
---

# 43 — Vestiges Render/Vercel & fichiers brouillons

> [!success] Nettoyé le 2026-06-22
> Tous les fichiers listés ci-dessous ont été **supprimés** du dépôt (`render.yaml`, `frontend/vercel.json`, `Journal.sh`, `settings.json`, `.mcp.json`). Build frontend + import backend revérifiés OK. Page conservée comme **trace historique** de la migration Render/Vercel → VPS Docker.

Fichiers qui **ne correspondaient plus** à l'architecture de prod (VPS Docker, [[42 - Conteneurs, images & exécution]]) — désormais retirés.

> [!warning] Contradiction d'hébergement
> Le projet a d'abord visé un déploiement **Render (backend) + Vercel (frontend)**, puis a migré vers un **VPS Hostinger en Docker** derrière le Caddy de pharmaclick. Plusieurs artefacts de la 1ʳᵉ approche subsistent. Source de vérité actuelle : [[40 - Déploiement (CI-CD & VPS)]], [[02 - Architecture globale]], [[Écosystème Fingec]].

## Artefacts Render/Vercel
- **`render.yaml`** — Blueprint Render (web service Python free tier, `healthCheckPath /health`, `BACKEND_DATA_DIR` sur le disque Render, `AUTH_SECRET` généré). Free tier = pas de disque persistant → `logs.json`/`output/` perdus au redémarrage.
- **`frontend/vercel.json`** — config Vercel (build Vite, rewrites SPA `/(.*) → /index.html`).
- Conséquence : la prod réelle **n'utilise ni Render ni Vercel**. `frontend/nginx.conf` remplit le rôle SPA-fallback que jouait `vercel.json`.

## Fichiers brouillons / divers
- **`Journal.sh`** (racine) — **pas un vrai script** : commandes git de premier commit + **copier-coller de sortie terminal** (notes de mise en place Render). Sans valeur d'exécution → à supprimer.
- **`logs.json`** (racine) — données runtime (journaux de traitements). Exclu du rsync de déploiement ([[40 - Déploiement (CI-CD & VPS)]]).
- **`settings.json`** (racine) — paraît être un **template générique non utilisé** (`permissions` sur `src/**`/`ui/**`, `model: raptor-mini`) : ne correspond pas à l'arborescence réelle (`backend/`, `frontend/`). À vérifier / supprimer.
- **`.mcp.json`** — config d'intégration minimale (`github: true`) ; voir [[60 - Outillage du dépôt]].

> [!done] Action réalisée (2026-06-22)
> `render.yaml`, `frontend/vercel.json`, `Journal.sh`, `settings.json` et `.mcp.json` **supprimés**. Le scaffolding générique (`agents/`, `commands/`, `rules/`, `skills/deploy/`, `hooks/`) a également été retiré — voir [[60 - Outillage du dépôt (assistant, règles, skills)]].

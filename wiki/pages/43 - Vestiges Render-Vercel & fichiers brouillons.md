---
type: reference
tags: [fingec, automatisation-comptable, infra, dette-technique]
updated: 2026-06-22
status: a-verifier
---

# 43 — Vestiges Render/Vercel & fichiers brouillons

Fichiers présents dans le dépôt qui **ne correspondent plus** à l'architecture de prod (VPS Docker, [[42 - Conteneurs, images & exécution]]). Conservés ici pour mémoire — candidats au nettoyage.

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

> [!tip] Action proposée
> Si Render/Vercel sont définitivement abandonnés : supprimer `render.yaml`, `frontend/vercel.json`, `Journal.sh`, et clarifier/retirer `settings.json`. À confirmer avec Johan avant suppression.

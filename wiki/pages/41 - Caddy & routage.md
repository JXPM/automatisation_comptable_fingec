---
type: system
tags: [fingec, automatisation-comptable, infra, caddy]
updated: 2026-06-17
---

# 41 — Caddy & routage

L'app est servie derrière le **Caddy partagé** du VPS (conteneur `pharmaclick-caddy`), mutualisé avec les autres services [[Écosystème Fingec|Fingec]].

## Routage `app.fingec.fr`
- `/` → **SPA React** (build statique).
- Préfixes API → **backend FastAPI** : `/auth`, `/api`, `/process`, `/download`, `/logs`, `/n8n`. Le matcher `@api` du Caddyfile aiguille ces préfixes vers le backend ; le reste tombe sur la SPA.

> [!warning] Tout nouveau préfixe backend doit être ajouté au matcher `@api`
> Si on ajoute un préfixe d'API côté backend **sans** l'ajouter au matcher `@api` du **Caddyfile live de pharmaclick**, la requête est servie comme la **SPA** (et casse). Cf. mémoire « Caddy routage préfixes backend ».

> [!warning] Bind-mount d'un seul fichier → inode obsolète
> Le Caddyfile est monté en lecture seule (**1 fichier**, pas le dossier). Si l'**inode hôte change** (réécriture du fichier), un simple `reload` ne suffit pas → il faut **redémarrer `pharmaclick-caddy`**. Cf. mémoire « Caddy bind-mount fichier obsolète ».

## Sous-domaines Fingec (rappel)
- `app.fingec.fr` — cette app (frontend + backend).
- `n8n.fingec.fr` — éditeur n8n. Les **webhooks** sont exposés via `app.fingec.fr/n8n/webhook/...` (proxy backend authentifié, [[10 - Backend FastAPI]]), pas directement.

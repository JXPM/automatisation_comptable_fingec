---
type: system
tags: [fingec, automatisation-comptable, infra, ci-cd, docker]
updated: 2026-06-25
sources: ["[[2026-06-17 - Session debug OAuth & refonte e-mail de compte]]"]
---

# 40 — Déploiement (CI-CD & VPS)

## Hébergement
- **VPS Hostinger** (`srv1713887`), app servie sur **`app.fingec.fr`**, derrière le **Caddy partagé** de pharmaclick. Conteneurs Docker : `fingec-backend`, `fingec-frontend`, `fingec-n8n`. Cf. mémoire « Déploiement VPS Hostinger » + [[Écosystème Fingec]].
- Fichiers : `docker-compose.yml`, `Dockerfile.backend`, `frontend/Dockerfile`. `render.yaml` **supprimé** ([[43 - Vestiges Render-Vercel & fichiers brouillons]]).

## Variables d'environnement (`.env` à côté du compose)
- **Auth/session** : `AUTH_SECRET`, `AUTH_COOKIE_SECURE` (1 ; 0 en dev HTTP), `AUTH_COOKIE_SAMESITE`.
- **Politique mdp / anti-bruteforce** : `PASSWORD_MIN_LENGTH` (12), `PASSWORD_MIN_CLASSES` (3), `PWNED_CHECK_ENABLED` (1), `RATELIMIT_ENABLED` (1). [[15 - Durcissement sécurité (cookie, mdp, anti-bruteforce)]].
- **Monitoring** : `SENTRY_DSN`, `VITE_SENTRY_DSN` (build front), `SENTRY_ENV`. [[44 - Monitoring & observabilité]].
- RGPD : `OUTPUT_RETENTION_DAYS`, `LOGS_RETENTION_DAYS` ([[Conformité RGPD & pack légal]]). Tous documentés dans `.env.example`.

## Overlay monitoring (optionnel)
`docker-compose.monitoring.yml` (Uptime Kuma + Netdata + Dozzle, ports `127.0.0.1`, accès tunnel SSH). `docker compose -f docker-compose.monitoring.yml up -d`. Guide : `deploy/MONITORING.md`. [[44 - Monitoring & observabilité]].

## GitHub Actions
Deux workflows (`.github/workflows/`), déclenchés sur **push `main`** :
- **`ci.yml`** (CI) : `backend` (pytest, Python 3.10) + `frontend` (tsc `--noEmit` + `npm run build`, Node 20).
- **`deploy.yml`** (CD) : gate **tests backend** (Python 3.12) → **rsync** du code vers le VPS → `docker compose up -d --build` → `docker image prune` → **healthcheck** `fingec-backend` (jusqu'à 60 s). Concurrency `deploy-prod`. Secrets : `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `DEPLOY_PATH`.

> [!warning] `ssh-keyscan` flaky
> L'étape « Add VPS to known_hosts » échoue parfois (port 22 momentanément injoignable depuis le runner GitHub) → **tout le déploiement plante** alors que le code est bon. Déjà vu le 2026-06-17 (échec puis **rerun OK**). Le step réessaie déjà 5× ; en cas d'échec, **`gh run rerun <id> --failed`**. ([[2026-06-17 - Session debug OAuth & refonte e-mail de compte]]).

> [!important] Ce que le CD déploie (et pas)
> Le CD déploie **l'app** (frontend + backend → conteneurs). Il **ne touche pas** le [[30 - Workflow n8n « fingec automatisation »|workflow n8n]] (édité à la main dans n8n) ni les credentials. Une « ancienne version » côté n8n n'est jamais un problème de push.

## Runbook express
1. `git push origin main` → CI + CD automatiques.
2. Vérifier : `gh run list --workflow=deploy.yml`.
3. Si échec `ssh-keyscan` → `gh run rerun <id> --failed`.
4. Healthcheck vert = `fingec-backend healthy`. Sinon, le step dump `docker logs --tail=50`.

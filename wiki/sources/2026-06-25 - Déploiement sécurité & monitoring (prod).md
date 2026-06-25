---
type: source
tags: [fingec, automatisation-comptable, deploiement, securite, monitoring, runbook]
updated: 2026-06-25
status: stable
---

# 2026-06-25 — Déploiement sécurité & monitoring en prod

Session de **mise en production** du lot sécurité ([[15 - Durcissement sécurité (cookie, mdp, anti-bruteforce)]]) + monitoring ([[44 - Monitoring & observabilité]]). Tout est **live et vérifié**.

## Déroulé
1. **Commit** sur branche `securite-et-monitoring` (3 commits : feature MailPage, sécurité+monitoring, wiki). `Journal.sh` supprimé (transcript brouillon). **PR #1** ouverte.
2. **CI verte** (backend pytest 90 tests + frontend build) → **merge** → workflow **Deploy to VPS** OK (rsync + `docker compose up -d --build` + **backend healthy**).
3. **Sentry** : 2 projets créés (`fingec-backend` = FastAPI, `fingec-frontend` = React, **région UE**), DSN ajoutés dans `/opt/fingec/.env` (`SENTRY_DSN`, `VITE_SENTRY_DSN`, `SENTRY_ENV=production`), rebuild backend+frontend. **Événement test reçu** → Sentry confirmé branché.
4. **Monitoring** lancé isolé : `docker compose -p fingec-monitoring -f docker-compose.monitoring.yml up -d` → `fingec-uptime-kuma`, `fingec-netdata`, `fingec-dozzle`.
5. **Uptime Kuma** : compte admin créé + moniteur HTTP `https://app.fingec.fr/health` (intervalle 60 s, **Essais=2**, codes 200-299, **alerte expiration TLS** cochée) → **vert (UP)**.
6. **Login prod re-testé OK** après migration cookie (tout le monde déconnecté une fois, re-login normal).

## Faits opérationnels (runbook VPS)
> [!important] Accès & emplacements
> - **Dossier projet** : **`/opt/fingec`** (contient `docker-compose.yml`, `docker-compose.monitoring.yml`, `.env`).
> - **SSH par clé** (pas de mot de passe — auth password désactivée) : clé `bilejohan04@gmail.com` déjà autorisée. Hôte : **`root@srv1713887.hstgr.cloud`**.
> - **Terminal hôte** côté Hostinger : bouton **« Terminal ↗ »** en haut à droite du *Gestionnaire Docker* (≠ les « Terminal » sous chaque conteneur, qui ouvrent un shell *dans* le conteneur).

> [!warning] 3 projets Docker distincts sur ce VPS — NE PAS mélanger
> `fingec` (backend/frontend/n8n) · `fingec-site` (1 conteneur) · `pharmaclick` (3 conteneurs, voisin). Toujours cibler `fingec` ; le monitoring tourne dans son propre projet **`fingec-monitoring`**.

### Accès aux dashboards monitoring (tunnel SSH depuis son poste)
```
ssh -L 3001:127.0.0.1:3001 -L 19999:127.0.0.1:19999 -L 8888:127.0.0.1:8888 root@srv1713887.hstgr.cloud
```
Puis `http://localhost:3001` (Uptime Kuma), `:19999` (Netdata), `:8888` (Dozzle). Les ports sont publiés sur `127.0.0.1` du VPS → invisibles publiquement.

### Vérifier Sentry
```
docker exec fingec-backend printenv SENTRY_DSN
```
DSN affiché ⇒ Sentry initialisé au démarrage. Envoi d'un test : `docker exec fingec-backend python -c "import sentry_sdk,os;sentry_sdk.init(os.environ['SENTRY_DSN']);sentry_sdk.capture_message('test_fingec');sentry_sdk.flush()"`.

> [!tip] Pièges de copier-coller dans le terminal Hostinger
> Le coller **ajoute 2 espaces en début de chaque ligne** → casse l'indentation Python **et** les heredocs (`PY` indenté n'est pas reconnu). Et les **emoji**/espaces dans une longue ligne peuvent insérer un saut de ligne. **Solution : commandes sur une seule ligne** (bash ignore les espaces de début), sans emoji.

## Reste optionnel
- Notification **e-mail Uptime Kuma** (« site down ») : besoin d'un **mot de passe d'application Gmail** (2FA requise).
- Finaliser la **règle d'alerte Sentry** (écran *New Alert* : WHEN « a new issue is created » + THEN action e-mail).
- Hérité : **révoquer le mot de passe `expert@fingec.fr`** ([[60 - Outillage du dépôt (assistant, règles, skills)]]).

# Déploiement sur VPS (Hostinger) — stack Docker derrière Caddy

Le VPS héberge déjà **pharmaclick** : conteneurs Docker (`backend`, `frontend`,
`caddy`) sur le réseau `pharmaclick_web`, avec **Caddy** qui détient les ports
80/443 et gère le HTTPS (Let's Encrypt) automatiquement.

fingec se greffe sur ce même schéma — **sans toucher à pharmaclick** :
- deux conteneurs `fingec-backend` (uvicorn) + `fingec-frontend` (nginx statique),
- branchés sur le réseau **partagé** `pharmaclick_web`,
- exposés via un **nouveau bloc de site** dans le Caddyfile existant.

Frontend + API sont sur le même sous-domaine → pas de CORS.

## Pré-requis

- DNS : un enregistrement **A** `app.fingec.fr` → IP du VPS (sinon Caddy ne
  pourra pas obtenir le certificat HTTPS).
- Docker + le réseau `pharmaclick_web` déjà présents (c'est le cas).

## 1. Mettre le code sur le serveur

Depuis ta machine (rsync, exclut node_modules/.git/data) :

```bash
rsync -az --delete \
  --exclude .git --exclude node_modules --exclude frontend/dist \
  --exclude .venv --exclude tmp_upload --exclude output --exclude logs.json \
  -e "ssh -i ~/.ssh/fingec_deploy" \
  ./ root@srv1713887.hstgr.cloud:/opt/fingec/
```

## 2. Configurer les secrets

```bash
ssh -i ~/.ssh/fingec_deploy root@srv1713887.hstgr.cloud
cd /opt/fingec
cp .env.example .env
openssl rand -hex 32        # → coller dans ADMIN_TOKEN
nano .env                   # ADMIN_TOKEN + FRONTEND_ORIGINS
```

## 3. Ajouter le bloc Caddy

Ajouter le contenu de `deploy/Caddyfile.fingec.snippet` à la fin de
`/opt/pharmaclick/Caddyfile` (faire une sauvegarde avant) :

```bash
cp /opt/pharmaclick/Caddyfile /opt/pharmaclick/Caddyfile.bak
cat /opt/fingec/deploy/Caddyfile.fingec.snippet >> /opt/pharmaclick/Caddyfile
```

## 4. Build + démarrage

```bash
cd /opt/fingec
./deploy/deploy.sh
```

Le script build les images, démarre les conteneurs et recharge Caddy.

## 5. Vérification

```bash
curl -I https://app.fingec.fr           # 200 + HTML du SPA
docker logs -f fingec-backend                   # logs API
docker exec fingec-backend wget -qO- localhost:8000/logs   # API interne OK
```

## Mises à jour

Refaire l'étape 1 (rsync) puis `./deploy/deploy.sh`.

## Dépannage

- `502` sur le sous-domaine → un conteneur fingec est down (`docker compose ps`),
  ou le nom dans le Caddyfile ne correspond pas (`fingec-backend` / `fingec-frontend`).
- Certificat HTTPS qui n'arrive pas → le DNS `app.fingec.fr` ne pointe pas
  (encore) vers le VPS. Vérifier avec `dig +short app.fingec.fr`.
- `503` à l'effacement des logs → `ADMIN_TOKEN` non défini dans `.env`.
- **pharmaclick n'est jamais modifié** sauf l'ajout du bloc dans son Caddyfile
  (sauvegardé en `.bak`).

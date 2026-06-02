# Déploiement sur VPS (Hostinger) — stack Docker derrière Caddy

Le VPS héberge déjà **pharmaclick** : conteneurs Docker (`backend`, `frontend`,
`caddy`) sur le réseau `pharmaclick_web`, avec **Caddy** qui détient les ports
80/443 et gère le HTTPS (Let's Encrypt) automatiquement.

fingec se greffe sur ce même schéma — **sans toucher à pharmaclick** :
- trois conteneurs `fingec-backend` (uvicorn) + `fingec-frontend` (nginx statique)
  + `fingec-n8n` (automatisation),
- branchés sur le réseau **partagé** `pharmaclick_web`,
- exposés via de **nouveaux blocs de site** dans le Caddyfile existant.

Frontend + API sont sur le même sous-domaine → pas de CORS.

### Surfaces n8n

- **Webhooks** (relances, e-mails, historique) → appelés par le dashboard via
  `app.fingec.fr/n8n/...`, relayés par le backend **après contrôle du JWT**.
  n8n lui-même reste **interne** (aucun port publié).
- **Éditeur n8n** → sous-domaine séparé `n8n.fingec.fr`, protégé par le compte
  propriétaire de n8n, pour éditer les workflows. Les `/webhook*` y sont **bloqués**
  par Caddy (ils ne doivent passer que par le dashboard authentifié).

## Pré-requis

- DNS : deux enregistrements **A** → IP du VPS :
  - `app.fingec.fr` (dashboard + API),
  - `n8n.fingec.fr` (éditeur n8n).
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
openssl rand -hex 32        # → coller dans AUTH_SECRET
openssl rand -hex 32        # → coller dans N8N_ENCRYPTION_KEY
nano .env                   # AUTH_SECRET + N8N_ENCRYPTION_KEY + ADMIN_EMAIL + ADMIN_PASSWORD + FRONTEND_ORIGINS
```

> `N8N_ENCRYPTION_KEY` doit rester **stable** : si tu la changes après coup, les
> credentials enregistrés dans n8n deviennent illisibles.

> Le compte `ADMIN_EMAIL` / `ADMIN_PASSWORD` n'est créé qu'au **tout premier**
> démarrage (base vide). Ensuite, la gestion des utilisateurs se fait dans l'app
> (page **Admin**). Pour amorcer/réparer un admin manuellement :
> `docker exec -it fingec-backend python manage.py create-admin --email x@fingec.fr`

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
docker exec fingec-backend wget -qO- localhost:8000/health   # API interne OK
```

## 6. Premier accès n8n (éditeur)

Ouvrir `https://n8n.fingec.fr` : n8n demande de **créer le compte propriétaire**
(e-mail + mot de passe propres à n8n) au premier lancement. Ce compte protège
l'éditeur. Y recréer/importer les workflows et leurs webhooks
(`get-clients`, `relance-client`, `marquer-recu`, `get-historique`,
`relance-historique`) — ils seront ensuite appelés par le dashboard via
`app.fingec.fr/n8n/...`.

> Vérifier que les webhooks publics sont bien bloqués sur le sous-domaine éditeur :
> `curl -I https://n8n.fingec.fr/webhook/get-clients` doit renvoyer **404**.

## Mises à jour

Refaire l'étape 1 (rsync) puis `./deploy/deploy.sh`.

## Dépannage

- `502` sur le sous-domaine → un conteneur fingec est down (`docker compose ps`),
  ou le nom dans le Caddyfile ne correspond pas (`fingec-backend` / `fingec-frontend`).
- Certificat HTTPS qui n'arrive pas → le DNS `app.fingec.fr` / `n8n.fingec.fr`
  ne pointe pas (encore) vers le VPS. Vérifier avec `dig +short app.fingec.fr`.
- Relances/webhooks en échec depuis le dashboard → vérifier `N8N_BASE_URL`
  (= `http://fingec-n8n:5678`) et que le workflow correspondant est **activé** dans n8n.
- `403` à l'effacement des logs → l'utilisateur connecté n'a pas le rôle `admin`.
- `401` partout après un redémarrage → `AUTH_SECRET` non défini (secret éphémère
  régénéré à chaque démarrage, qui invalide les sessions). Le définir dans `.env`.
- **pharmaclick n'est jamais modifié** sauf l'ajout du bloc dans son Caddyfile
  (sauvegardé en `.bak`).

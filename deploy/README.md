# Déploiement sur VPS (Hostinger)

Cohabite avec un site existant : on ajoute un sous-domaine, un service `uvicorn`
local et un reverse-proxy nginx. Le site existant n'est pas touché.

Frontend et API sont servis sur le **même sous-domaine** → pas de CORS.

## Pré-requis sur le VPS

- nginx installé (`nginx -v`)
- Python 3.10+ (`python3 --version`)
- Node 20+ (`node -v`) — pour builder le frontend
- Un sous-domaine pointant vers l'IP du VPS (enregistrement DNS `A`),
  ex. `fingec.tondomaine.com`

## 1. Récupérer le code

```bash
sudo mkdir -p /opt/fingec && sudo chown $USER /opt/fingec
git clone <URL_DU_DEPOT> /opt/fingec
cd /opt/fingec
mkdir -p data            # données persistantes (logs.json, exports)
```

## 2. Configurer les secrets

```bash
cp deploy/.env.example backend/.env
openssl rand -hex 32      # copier le résultat dans ADMIN_TOKEN
nano backend/.env         # remplir ADMIN_TOKEN + FRONTEND_ORIGINS (ton sous-domaine)
```

## 3. Premier build + dépendances

```bash
./deploy/deploy.sh        # crée le venv, installe, build le frontend, (re)démarre
```

> Au tout premier déploiement, le service systemd et nginx ne sont pas encore
> installés : fais d'abord les étapes 4 et 5, puis relance `./deploy/deploy.sh`.

## 4. Service systemd (backend)

```bash
# Crée l'utilisateur de service si besoin :
sudo useradd --system --no-create-home --shell /usr/sbin/nologin fingec || true
sudo chown -R fingec:fingec /opt/fingec/data

sudo cp deploy/fingec-api.service /etc/systemd/system/fingec-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now fingec-api
systemctl status fingec-api      # doit être "active (running)"
```

Adapter `User=` / chemins dans le `.service` si tu n'utilises pas `/opt/fingec`
ou l'utilisateur `fingec`.

## 5. nginx (reverse-proxy + frontend)

```bash
# Remplace fingec.example.com par ton sous-domaine dans le fichier :
sudo cp deploy/nginx-fingec.conf /etc/nginx/sites-available/fingec.conf
sudo nano /etc/nginx/sites-available/fingec.conf
sudo ln -s /etc/nginx/sites-available/fingec.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 6. HTTPS (Let's Encrypt)

```bash
sudo certbot --nginx -d fingec.tondomaine.com
```

certbot ajoute automatiquement le bloc `listen 443 ssl` et redirige le HTTP.

## Mises à jour ultérieures

```bash
cd /opt/fingec && ./deploy/deploy.sh
```

## Vérifs / dépannage

```bash
journalctl -u fingec-api -f           # logs du backend
curl -s http://127.0.0.1:8001/logs    # l'API répond en local
sudo tail -f /var/log/nginx/error.log # erreurs proxy
```

- `502 Bad Gateway` → le service `fingec-api` est down (`systemctl status fingec-api`).
- Upload refusé > 50 Mo → `client_max_body_size` (nginx) et `MAX_UPLOAD_BYTES` (backend).
- `503` sur suppression des logs → `ADMIN_TOKEN` non défini dans `backend/.env`.

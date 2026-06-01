#!/usr/bin/env bash
# Déploiement / mise à jour de Fingec sur le VPS.
# À lancer depuis la racine du dépôt cloné sur le serveur (ex: /opt/fingec).
#
#   cd /opt/fingec && ./deploy/deploy.sh
#
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "==> Récupération du code"
git pull --ff-only

echo "==> Backend : venv + dépendances"
[ -d .venv ] || python3 -m venv .venv
./.venv/bin/pip install --upgrade pip >/dev/null
./.venv/bin/pip install -r backend/requirements.txt

echo "==> Frontend : build (VITE_API_URL vide = même origine que l'API)"
cd frontend
npm ci
VITE_API_URL="" npm run build
cd "$APP_DIR"

echo "==> Redémarrage des services"
sudo systemctl restart fingec-api
sudo nginx -t && sudo systemctl reload nginx

echo "==> Terminé. Vérifie : systemctl status fingec-api"

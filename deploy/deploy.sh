#!/usr/bin/env bash
# Déploiement / mise à jour de fingec sur le VPS (stack Docker, derrière le Caddy
# partagé de pharmaclick). À lancer depuis la racine du projet sur le serveur.
#
#   cd /opt/fingec && ./deploy/deploy.sh
#
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "ERREUR : .env manquant. Copie .env.example vers .env et renseigne AUTH_SECRET / ADMIN_EMAIL / ADMIN_PASSWORD." >&2
  exit 1
fi

echo "==> Build + (re)démarrage des conteneurs fingec"
docker compose up -d --build

echo "==> Rechargement de Caddy (prise en compte du Caddyfile)"
docker exec pharmaclick-caddy caddy reload --config /etc/caddy/Caddyfile \
  || echo "(!) Recharge Caddy ignorée — vérifie que le bloc fingec est bien dans /opt/pharmaclick/Caddyfile"

echo "==> État"
docker compose ps
echo "Terminé. Logs backend : docker logs -f fingec-backend"

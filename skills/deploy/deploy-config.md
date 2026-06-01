# Deploy Config

Configuration de déploiement :

- Backend (API)  : `backend/` — entrée `main:app` (FastAPI), servi par `uvicorn`
- Requirements   : `backend/requirements.txt`
- CLI (optionnel): `backend/cli.py`
- Frontend       : `frontend/` — build Vite (`npm run build`) → `frontend/dist/`

Cibles de déploiement :

- VPS (Hostinger) : voir `deploy/` à la racine (systemd + nginx + deploy.sh)
- PaaS            : `render.yaml` (backend) + `frontend/vercel.json` (frontend)

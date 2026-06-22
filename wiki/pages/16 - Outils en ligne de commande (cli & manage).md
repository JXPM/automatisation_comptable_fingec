---
type: system
tags: [fingec, automatisation-comptable, backend, cli]
updated: 2026-06-22
status: stable
---

# 16 — Outils en ligne de commande (`cli.py` & `manage.py`)

Deux utilitaires CLI dans `backend/`, complémentaires de l'API ([[10 - Backend FastAPI]]).

## `cli.py` — traitement comptable hors interface
Pipeline complet de [[13 - Traitement comptable (Quadra)]] sans passer par le web.
```bash
python cli.py input.xlsx --country France --output output.xlsx
```
- Args : `input` (CSV/Excel), `--country {France,Non-France}` (défaut France), `--output` (défaut `output.xlsx`).
- Exécute `load_file → clean_data → compute_vat → build_output → detect_anomalies → validate`, écrit le `.xlsx` et **imprime le rapport** + la liste des anomalies (`[sévérité] CODE — message (N ligne(s))`).
- ⚠️ Ne génère **pas** le journal d'écritures ([[14 - Journal d'écritures Quadra]]) — seulement la synthèse.

## `manage.py` — administration des comptes
Surtout pour **amorcer le premier administrateur** ; au quotidien la gestion se fait dans la page **Admin** ([[11 - Authentification & comptes]]). S'appuie sur `auth.py`.
```bash
python manage.py create-admin  --email patron@fingec.fr --password '…'   # rôle admin
python manage.py create-user   --email stagiaire@fingec.fr --password '…' # rôle user
python manage.py set-password   --email x@fingec.fr --password 'nouveau'
python manage.py deactivate     --email x@fingec.fr
python manage.py activate       --email x@fingec.fr
python manage.py list
```
- Sous-commandes : `create-admin`, `create-user`, `set-password`, `deactivate`, `activate`, `list`.
- Mot de passe : via `--password` ou **saisie interactive** (`getpass`, double confirmation) si omis.
- En prod (Docker) : `docker exec -it fingec-backend python manage.py create-admin …` ([[40 - Déploiement (CI-CD & VPS)]]).

> [!note] Amorçage alternatif
> Au **tout premier** démarrage (base vide), `auth._seed_initial_admin()` crée un admin depuis les variables d'env `ADMIN_EMAIL` / `ADMIN_PASSWORD` ([[42 - Conteneurs, images & exécution]]). `manage.py` sert ensuite pour réparer/ajouter.

---
type: reference
tags: [fingec, automatisation-comptable, tests, qualite]
updated: 2026-06-22
status: stable
---

# 51 — Tests automatisés

Suite **pytest** du backend : **71 tests** (au 2026-06-22), tous verts. Exécutés en CI à chaque push/PR ([[40 - Déploiement (CI-CD & VPS)]]) et **bloquants avant déploiement**. Pas de tests unitaires frontend (la CI fait `tsc --noEmit` + `build`) ; des e2e Playwright existent (`frontend/e2e/auth.spec.ts`).

## Fixtures partagées (`backend/tests/conftest.py`)
Ajoute `backend/` au `sys.path` (import direct `from processor import …`). Fournit `sample_clean_df`, `csv_file` (Shopify), `excel_file` (TikTok, feuille `Statement` + feuille à ignorer), `excel_no_statement`.

## Fichiers de test
| Fichier | Tests | Couvre |
|---|---|---|
| `test_processor.py` | **39** | Pipeline `processor.py` : chargement CSV/Excel, feuille `Statement`, nettoyage colonnes, **TVA France/Non-France**, build_output, les **8 anomalies**, score de fiabilité. [[13 - Traitement comptable (Quadra)]]. |
| `test_journal.py` | **9** | Générateur de journal : mapping France au centime, équilibre Débit=Crédit, hors-France sans TVA, agrégation par jour, ajustement→compte d'attente, montant négatif, écriture `.xlsx`, **surcharge config externe**. [[14 - Journal d'écritures Quadra]]. |
| `test_auth_api.py` | 7 | Endpoints d'auth (FastAPI `TestClient`) : login, `/auth/me`, gestion users, garde admin. [[11 - Authentification & comptes]]. |
| `test_password.py` | 7 | Jetons de mot de passe (setup/reset, usage unique, expiration, SHA-256) + hachage bcrypt. |
| `test_assignments.py` | 5 | Attribution client→utilisateur (`auth.py`) : set/get, filtrage par comptable. |
| `test_retention.py` | 4 | Purge RGPD : exports `output/*.xlsx`, `logs.json`, jetons expirés. [[Conformité RGPD & pack légal]]. |

## Lancer
```bash
cd backend && python3 -m pytest -q          # toute la suite
python3 -m pytest tests/test_journal.py -q   # un fichier
```
> [!note] `python` vs `python3` / `jq`
> Dans cet environnement, utiliser **`python3`** (`python` absent) ; **`jq` n'est pas installé** (parser le JSON avec `python3 -c`).

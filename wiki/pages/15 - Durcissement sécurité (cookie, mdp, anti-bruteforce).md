---
type: system
tags: [fingec, automatisation-comptable, backend, frontend, securite]
updated: 2026-06-25
status: stable
---

# 15 — Durcissement sécurité (cookie, mots de passe, anti-bruteforce)

> [!info] Session du 2026-06-25
> Lot de durcissement issu de 4 demandes de Johan. Tout est **testé** (suite à **90 tests**, dont [[51 - Tests automatisés|`test_security.py` + `test_password_policy.py`]]) et **build front OK**. Cf. aussi [[11 - Authentification & comptes]], [[25 - Utilitaires frontend (api, cabinet, clients, exportPdf)]], [[10 - Backend FastAPI]].

## 1. Jeton de session → cookie httpOnly (anti-vol XSS)
Avant : JWT stocké en `localStorage`/`sessionStorage`, envoyé en `Authorization: Bearer` → **lisible par du JavaScript** (vol possible via XSS).

Maintenant :
- Le backend pose le JWT dans un **cookie `httpOnly` + `Secure` + `SameSite=Lax`** (`backend/main.py` `_set_auth_cookie`, nom `fingec_token` défini dans `auth.COOKIE_NAME`). Inaccessible au JS, `SameSite=Lax` protège du CSRF (pas envoyé sur POST cross-site).
- `auth.get_current_user` lit le jeton **en-tête Authorization d'abord** (CLI/tests), **puis cookie** (navigateur) — précédence header pour ne pas casser les clients hors navigateur.
- **« Se souvenir »** : `remember=true` → cookie persistant (durée = TTL 8 h) ; `false` → cookie de session (effacé à la fermeture).
- Nouveau **`POST /auth/logout`** : efface le cookie. CORS passé en `allow_credentials=True`.
- Front : `utils/api.ts` ne stocke **plus aucun jeton** ; `authFetch` utilise `credentials:"include"` ; `AuthContext` détermine la session via `GET /auth/me` (cookie auto). [[25 - Utilitaires frontend (api, cabinet, clients, exportPdf)]].
- Env : `AUTH_COOKIE_SECURE` (1 par défaut ; **0 en dev HTTP**), `AUTH_COOKIE_SAMESITE` (lax).

## 2. Contrôles admin côté serveur + trou du proxy n8n bouché
- La vérif de rôle était **déjà** côté serveur (`require_admin` sur tous les endpoints sensibles ; filtrage clients par utilisateur dans `/api/clients`, `/api/historique`). Le front ne fait que de l'affichage.
- 🔴 **Faille trouvée et corrigée** dans le proxy `/n8n/{path}` : un non-admin pouvait appeler **directement** `webhook/get-clients`, `get-historique`, `send-account-email`… et **contourner le filtrage d'attribution**. Désormais **liste blanche** `_USER_ALLOWED_PROXY_PATHS` : un non-admin ne peut relayer que `send-mail` + les 4 actions client (`relance-client`, `marquer-recu`, `envoi-initial`, `relance-historique`), elles-mêmes soumises au contrôle d'attribution. Tout autre chemin → **403**. [[10 - Backend FastAPI]].

## 3. Rate limiting (anti-bruteforce)
Module **`backend/ratelimit.py`** (fenêtre glissante en mémoire ; OK car 1 seul worker — [[42 - Conteneurs, images & exécution]]).
- **Connexion** : **5 échecs / 15 min** par (IP + e-mail) → **HTTP 429** + `Retry-After`. Ne compte **que les échecs** ; une réussite **remet le compteur à zéro**.
- **Mot de passe oublié** : **5 demandes / heure** par IP.
- IP réelle = **dernier maillon** de `X-Forwarded-For` (Caddy l'ajoute ; un en-tête falsifié par le client est poussé à gauche).
- Désactivable via `RATELIMIT_ENABLED=0` (utilisé par les tests).

## 4. Politique de mot de passe + anti-fuite (HIBP)
Module **`backend/password_policy.py`**, appliqué **partout** (création, réinitialisation par lien, changement, CLI `manage.py`) :
- **≥ 12 caractères** (`PASSWORD_MIN_LENGTH`) + **≥ 3 familles sur 4** (`PASSWORD_MIN_CLASSES`) parmi minuscules / majuscules / chiffres / symboles.
- Refus si le mdp **contient l'adresse e-mail**, ou s'il est dans une courte liste de mdp courants.
- **Have I Been Pwned** (`is_pwned`) en **k-anonymity** : on n'envoie que les **5 premiers caractères du SHA-1**, jamais le mot de passe. **Fail-open** si l'API est injoignable (pas de blocage sur panne). Désactivable via `PWNED_CHECK_ENABLED=0`.
- Front : minimums passés à **12** dans ResetPassword / AccountPage / AdminPage (UX ; le serveur fait foi).
- ⚠️ Le mot de passe initial aléatoire (invitation) reçoit un suffixe `Aa1#` pour **garantir** qu'il respecte la politique.

> [!warning] Point ouvert hérité
> Reste à **révoquer le mot de passe `expert@fingec.fr`** exposé en clair dans `.claude/settings.local.json` ([[60 - Outillage du dépôt (assistant, règles, skills)]]) — action manuelle, hors code.

## Variables d'environnement ajoutées
`AUTH_COOKIE_SECURE`, `AUTH_COOKIE_SAMESITE`, `PASSWORD_MIN_LENGTH`, `PASSWORD_MIN_CLASSES`, `PWNED_CHECK_ENABLED`, `RATELIMIT_ENABLED` — documentées dans `.env.example` et `docker-compose.yml`. [[40 - Déploiement (CI-CD & VPS)]], [[44 - Monitoring & observabilité]].

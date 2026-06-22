---
type: system
tags: [fingec, automatisation-comptable, backend, auth]
updated: 2026-06-17
---

# 11 — Authentification & comptes

Tout dans `backend/auth.py` (SQLite stdlib, pas d'ORM). Pensé pour quelques dizaines d'utilisateurs avec turnover (alternants/stagiaires).

## Stockage (SQLite `app.db`)
- **`users`** : `id, email (UNIQUE NOCASE), full_name, password_hash, role, active, created_at`.
- **`client_assignments`** : `client_email (PK NOCASE) → user_id`, `assigned_at`. Attribution 1-N (un client a au plus un propriétaire ; un comptable en a plusieurs). Les clients vivent dans Google Sheets, référencés par leur **Email**.
- **`password_tokens`** : `token_hash (PK), user_id, purpose, created_at, expires_at, used_at`. On ne stocke **que le SHA-256** du jeton (même si la base fuit, les liens restent inexploitables). Usage **unique**, expirant.

## Mots de passe & jetons
- Hachage **bcrypt** (`hash_password` / `verify_password`).
- **JWT HS256**, TTL **8 h** (`TOKEN_TTL`), signé par `AUTH_SECRET` (⚠️ éphémère si non défini → sessions invalidées au redémarrage).
- Jetons mot de passe (liens e-mail) — TTL par usage (`RESET_TOKEN_TTL`) :
  - **`setup`** (première définition à la création) : **72 h**.
  - **`reset`** (mot de passe oublié) : **2 h**.
  - Générer un jeton **invalide les précédents non utilisés** du même user (un seul lien valable). `consume_password_token` est atomique (anti-rejeu) et **réactive** le compte (`active = 1`).

## Rôles & dépendances FastAPI
- `get_current_user` (Bearer) → 401 si absent/expiré/désactivé.
- `require_admin` → 403 si non-admin.
- **Rôles** : `user` (comptable) | `admin` (cabinet).

## Cycle de vie d'un compte
1. **Création** (admin, `POST /auth/users`) : sans mot de passe fourni → compte créé avec un secret aléatoire inutilisable, puis **e-mail d'invitation** (`setup`) avec lien. L'utilisateur ne peut pas se connecter tant qu'il n'a pas défini son mot de passe. [[12 - E-mails de compte (emailer + n8n)]].
   - Depuis 2026-06-17, le **champ mot de passe a été retiré** du formulaire admin → toute création envoie l'invitation ([[2026-06-17 - Session debug OAuth & refonte e-mail de compte]]).
2. **Définition / réinitialisation** : `POST /auth/forgot-password` (public, réponse toujours identique = anti-énumération) → e-mail `reset` ; `POST /auth/reset-password` consomme le jeton.
3. **Changement** (connecté) : `POST /auth/change-password` (exige le mot de passe actuel) → e-mail `changed`.
4. **Gestion admin** : activer/désactiver, changer de rôle, réinitialiser le mdp (bouton « Mot de passe » qui **applique directement** un mdp, sans e-mail), supprimer.

## Garde-fous
- Impossible de retirer le **dernier administrateur actif** (`count_active_admins`).
- Impossible de **supprimer son propre compte**.
- Supprimer un user **libère** ses clients attribués.

## Attribution & filtrage
- L'admin attribue un client à un comptable (`PUT /api/assignments`). Le filtrage s'applique dans `/api/clients`, `/api/historique` et l'enforcement du proxy n8n. [[10 - Backend FastAPI]].

## Amorce
- `_seed_initial_admin` crée un admin depuis `ADMIN_EMAIL`/`ADMIN_PASSWORD` **si la base est vide**.

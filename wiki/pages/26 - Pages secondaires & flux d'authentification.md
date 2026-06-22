---
type: system
tags: [fingec, automatisation-comptable, frontend, auth]
updated: 2026-06-22
status: stable
---

# 26 — Pages secondaires & flux d'authentification

Pages de `frontend/src/pages/` non détaillées ailleurs. Routage : [[20 - Frontend - structure & pages]]. Clients/Historique/Dashboard : [[23 - Tableau de bord & écrans de relance]].

## Flux d'authentification (pages publiques)
- **LoginPage** (`/login`) — `AuthShell` refondu, « Se souvenir de moi » réel, lien oubli. [[20 - Frontend - structure & pages]].
- **ForgotPasswordPage** (`/forgot-password`) — POST `/auth/forgot-password` ; réponse **toujours identique** (anti-énumération) → message « si un compte existe… ». [[11 - Authentification & comptes]].
- **ResetPasswordPage** (`/reset-password?token=`) — au montage, **valide le lien** (`GET /auth/reset-password/{token}`, pré-remplit l'e-mail) → états `checking/valid/invalid/done` ; POST `/auth/reset-password` (min. 8 car., double saisie). Sert aussi à la **définition initiale** du mot de passe (invitation). [[12 - E-mails de compte (emailer + n8n)]].

## AccountPage (`/compte`)
- « Paramètres du compte » : identité (nom/e-mail, avatar initiales) + **changement de mot de passe** (`POST /auth/change-password`, exige le mot de passe actuel, min. 8 car., double saisie → toast). Réutilise `PasswordField` d'`AuthShell`.

## LogsPage (`/logs`)
- Historique des **traitements** (`GET /logs`) : date, fichier, pays, lignes, **score** (badge coloré), erreurs/avertissements ; **téléchargement** de l'export (`downloadFile`).
- Effacement (`DELETE /logs`) **réservé admin** (403 sinon, [[10 - Backend FastAPI]]) — confirmation avant.

## ClientsPage (`/clients`) & HistoriquePage (`/historique`)
- Listes filtrées **par utilisateur** (un comptable ne voit que ses clients attribués). Recherche (`norm`), filtres statut/mois, `StatusBadge`, avatars (`avatarColor`/`initials`).
- Actions de relance via `Modal` de confirmation → webhooks n8n proxifiés (`/n8n/webhook/relance-client`, `envoi-initial`, `marquer-recu`, `relance-historique`). Détail des boutons→webhooks : [[23 - Tableau de bord & écrans de relance]], [[32 - Relances clients (cycle de mails)]].
- **Admin** : ClientsPage expose l'attribution client→comptable (`PUT /api/assignments`). [[11 - Authentification & comptes]].

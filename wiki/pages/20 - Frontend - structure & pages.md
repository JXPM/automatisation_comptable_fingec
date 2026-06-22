---
type: system
tags: [fingec, automatisation-comptable, frontend, react]
updated: 2026-06-22
---

# 20 — Frontend : structure & pages

SPA **React 19 + Vite + TypeScript** (`frontend/`). Styling **inline + tokens CSS + Tailwind v4**, animations **framer-motion**, export PDF **jsPDF**. Détail stack & design : [[22 - Design system & stack frontend]]. Refonte « façon SaaS » (inspiration Pennylane) menée en juin 2026 — l'app a quasi doublé de taille (35 fichiers, ~5900 lignes au 2026-06-22).

## Organisation (`frontend/src`)
- **`pages/`** — une page par route (voir tableau).
- **`components/`** — shell (`Layout` = sidebar bordeaux animée, `Topbar` = avatar + menu compte/déconnexion), `PageHeader` (en-tête unifié Playfair), `AuthShell` (+ `Field`/`PasswordField`/`SubmitButton`/`Alert`), `Modal`, `Toast`, `UploadForm`, `ResultTable`, `ValidationReport`, `AnomalyConsole`, `StatusBadge`, `UnderDevelopment`.
- **`auth/`** — `AuthContext` (user + token, revalide `/auth/me` au montage, déconnexion auto sur 401), `ProtectedRoute` (`adminOnly`).
- **`utils/`** — `api.ts` (`authFetch`, session localStorage, `downloadFile`), `cabinet.ts` (coordonnées signature + logo), `clients.ts` (`norm`/`initials`/`avatarColor`), `exportPdf.ts` (rapport PDF).

## Routes (`App.tsx`)
Publiques : `/login`, `/forgot-password`, `/reset-password`. Les autres sont sous `ProtectedLayout` (session requise + `Layout`).

| Page | Route | Rôle |
|---|---|---|
| `LoginPage` | `/login` | connexion (AuthShell éditorial) |
| `ForgotPasswordPage` | `/forgot-password` | demande de réinitialisation |
| `ResetPasswordPage` | `/reset-password?token=` | définition/réinit du mdp (lien e-mail) |
| `DashboardPage` | `/` | accueil SaaS (KPIs, actions, activité) — [[23 - Tableau de bord & écrans de relance]] |
| `TraitementPage` | `/traitement` | upload comptable → aperçu/score/anomalies/téléchargement [[13 - Traitement comptable (Quadra)]] |
| `AccountPage` | `/compte` | paramètres du compte (identité + changer mdp) |
| `ClientsPage` | `/clients` | liste clients (filtrée), actions de relance [[23 - Tableau de bord & écrans de relance]] |
| `HistoriquePage` | `/historique` | suivi des envois par mois [[23 - Tableau de bord & écrans de relance]] |
| `MailPage` | `/mail` | composer & envoyer un e-mail (1..N destinataires) [[21 - Signature e-mail & charte Fingec]] |
| `LogsPage` | `/logs` | historique des traitements (`GET /logs`) |
| `AdminPage` | `/admin` | gestion utilisateurs (admin only) [[11 - Authentification & comptes]] |

> [!warning] Correction (2026-06-22)
> La route de l'onglet « Nouveau mail » est **`/mail`** (ancienne doc : `/nouveau-mail` — faux). Le libellé de navigation reste « Nouveau mail » ([[Layout]] `NAV`).

## Shell de l'app (pages protégées)
- **`Layout`** : sidebar fixe 244px en dégradé bordeaux (`#8C1B2A → #3A0C16`) avec glow animé, logo `/fingec-logo.png`, nav (`Accueil`, `Traitement`, `Clients`, `Historique`, `Nouveau mail`, `Logs` + `Admin` si admin). Onglet actif animé (`layoutId` framer-motion). Transition de page sur changement de route.
- **`Topbar`** : avatar (initiales) en haut-droite → menu (Paramètres du compte, Se déconnecter). La déconnexion a quitté la sidebar pour la topbar (todo réalisé). [[refonte-ui-todo]].

## Accès API (`utils/api.ts`)
- `API_URL = import.meta.env.VITE_API_URL ?? ""` — vide en dév (proxy Vite), défini en prod. ⚠️ Un commentaire du fichier évoque encore « Vercel » : périmé, la prod est sur **VPS Hostinger/Caddy** ([[02 - Architecture globale]]).
- `authFetch` ajoute le **JWT Bearer** (`fingec_token` en localStorage) et force `cache: "no-store"` ; un **401 déconnecte** (clearSession + handler). Session : `setSession`/`clearSession`/`getStoredUser`.
- `downloadFile` télécharge via fetch+blob (un lien `<a>` ne porte pas le header Bearer).
- Données clients/historique : `/api/clients`, `/api/historique` (filtrés serveur). Actions relance : `/n8n/webhook/...` (proxy authentifié). Composer un mail : `POST /n8n/webhook/send-mail`.

## Persistance côté navigateur
- **localStorage** : `fingec_token`, `fingec_user` (session), `fingec_cabinet` (coordonnées signature).
- **sessionStorage** : `fingec_traitement` (dernier résultat de traitement, restauré au retour sur la page).

## AdminPage (création d'utilisateur)
- Formulaire : e-mail, nom, **rôle** (le champ **mot de passe a été retiré** le 2026-06-17 → invitation auto). Réponse `setup_email_sent` → toast. Bouton « Mot de passe » par ligne = applique un mdp directement (sans e-mail). [[2026-06-17 - Session debug OAuth & refonte e-mail de compte]].

## Tests e2e
- Playwright (`frontend/e2e/auth.spec.ts`) — pages auth (login, oubli/réinit, paramètres). Scripts `test:e2e` / `test:e2e:ui`.

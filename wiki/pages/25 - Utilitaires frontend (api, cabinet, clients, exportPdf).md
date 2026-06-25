---
type: reference
tags: [fingec, automatisation-comptable, frontend, utils]
updated: 2026-06-25
status: stable
---

# 25 — Utilitaires frontend (`utils/`)

Helpers de `frontend/src/utils/` + `theme.ts`.

## `api.ts` — accès API & session
- `API_URL = import.meta.env.VITE_API_URL ?? ""` (vide en dév → proxy Vite vers `:8001` ; vide en prod → même origine Caddy). Commentaire « Vercel » corrigé → prod = **VPS Hostinger/Caddy** ([[02 - Architecture globale]]).
- **Session = cookie httpOnly** (depuis 2026-06-25) : le front **ne stocke plus aucun jeton** en JS (anti-XSS). `setSession`/`getToken`/`clearSession`/`getStoredUser` **supprimés**. Le cookie `fingec_token` est posé par le backend au login. [[15 - Durcissement sécurité (cookie, mdp, anti-bruteforce)]].
- `authFetch(path, opts)` : `credentials:"include"` (envoie le cookie) + `cache:"no-store"` ; sur **401** → handler de déconnexion (enregistré par `AuthContext`).
- `logoutRequest()` : `POST /auth/logout` (efface le cookie côté serveur). `AuthContext` détermine la session au montage via `GET /auth/me`.
- `downloadFile(filename)` : GET `/download/{filename}` en **fetch+blob** (un `<a download>` ne porte pas la session) ; nom de sauvegarde = le fichier sans préfixe `output_`.
- **Suivi d'erreurs** : `main.tsx` initialise `@sentry/react` si `VITE_SENTRY_DSN` ([[44 - Monitoring & observabilité]]).

## `cabinet.ts` — coordonnées de signature
- `CabinetInfo { adresse, telephone, ordre, contact }`, persistées en localStorage (`fingec_cabinet`) — éditables dans [[21 - Signature e-mail & charte Fingec]] sans toucher au code.
- `DEFAULT_CABINET` : adresse **6 rue Frédéric Chopin, 67118 Geispolsheim**, ordre « membre de l'Ordre des Experts-Comptables d'Alsace », contact `contact@fingec.fr | www.fingec.fr`.
- `CABINET_LOGO` : PNG hébergé sur **githubusercontent** (`fingec/fingec-assets/.../fing.png`) — URL publique indispensable pour l'affichage dans les e-mails.

## `clients.ts` — helpers d'affichage
- `norm(s)` : minuscule + suppression des accents (NFD) — utilisé pour recherches/filtrage et `StatusBadge`.
- `initials(name)` : 2 initiales majuscules (avatars).
- `avatarColor(name)` : couleur déterministe (hash) dans une palette de 6.

## `exportPdf.ts` — rapport PDF
- `exportValidationPdf(report, anomalies, preview, filename, country)` via **jsPDF + jspdf-autotable** (import dynamique → chunk `pdf` séparé, [[22 - Design system & stack frontend]]).
- Bandeau bordeaux « FINGEC / Rapport de validation comptable », table de stats, table d'anomalies (couleur par sévérité), aperçu (50 lignes), pied « Document confidentiel — Usage interne » + pagination. Nom : `rapport_<fichier>_<date>.pdf`.

## `theme.ts` — constantes de marque
- `B = #A72231`, `B_DARK = #7E1626`, `B_LIGHT = #C13049`, `BURGUNDY_RGB = [167,34,49]` (pour jsPDF). Tokens CSS correspondants dans `index.css`.

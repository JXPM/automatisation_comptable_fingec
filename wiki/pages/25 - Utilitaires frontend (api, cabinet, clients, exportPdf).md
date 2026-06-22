---
type: reference
tags: [fingec, automatisation-comptable, frontend, utils]
updated: 2026-06-22
status: stable
---

# 25 — Utilitaires frontend (`utils/`)

Helpers de `frontend/src/utils/` + `theme.ts`.

## `api.ts` — accès API & session
- `API_URL = import.meta.env.VITE_API_URL ?? ""` (vide en dév → proxy Vite vers `:8001` ; vide en prod → même origine Caddy). Commentaire « Vercel » corrigé → prod = **VPS Hostinger/Caddy** ([[02 - Architecture globale]]).
- **Session** : `setSession(token, user, remember=true)` → `localStorage` (persistant) ou `sessionStorage` (durée de l'onglet) ; `getToken`/`getStoredUser`/`clearSession` lisent/purgent **les deux** stores. Clés `fingec_token` / `fingec_user`.
- `authFetch(path, opts)` : ajoute `Authorization: Bearer <token>` + `cache:"no-store"` ; sur **401** → `clearSession()` + handler (déconnexion) — enregistré par `AuthContext`.
- `downloadFile(filename)` : GET `/download/{filename}` en **fetch+blob** (un `<a download>` ne porte pas le header Bearer) ; nom de sauvegarde = le fichier sans préfixe `output_`.

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

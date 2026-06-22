---
type: system
tags: [fingec, automatisation-comptable, frontend, design, stack]
updated: 2026-06-22
---

# 22 — Design system & stack frontend

Capture la **stack technique** et le **système visuel** du frontend après la refonte SaaS de juin 2026 ([[20 - Frontend - structure & pages]]). Évite l'écueil du « look généré par IA » via une charte maison soignée. [[refonte-ui-references]].

## Stack (`frontend/package.json`)
| Dépendance | Version | Rôle |
|---|---|---|
| **react / react-dom** | ^19.2 | UI |
| **react-router-dom** | ^7.14 | routing (`App.tsx`) |
| **framer-motion** | ^12.38 | animations (sidebar, KPIs, transitions, panneaux) |
| **jspdf** + **jspdf-autotable** | ^4.2 / ^5.0 | export PDF du rapport de validation |
| **tailwindcss** + **@tailwindcss/vite** | ^4.2 | utilitaires CSS (importé via `@import "tailwindcss"` dans `index.css`) |
| **vite** | ^8.0 | bundler / dev server |
| **typescript** | ~6.0 | typage |
| **@playwright/test** | ^1.61 | e2e |

> [!note] Hybridation du styling
> Le style est surtout **inline** (objets `CSSProperties`) + **variables CSS** (`:root`), avec **Tailwind v4** disponible en complément. Pas de framework de composants (pas de MUI/Chakra) : chaque écran est composé main.

## Tokens de couleur
- **`theme.ts`** (TS) : `B = #A72231` (bordeaux principal), `B_DARK = #7E1626`, `B_LIGHT = #C13049`, `BURGUNDY_RGB = [167,34,49]` (pour jsPDF).
- **`index.css` `:root`** (CSS) : `--b/--b-dark/--b-light/--b-soft/--b-tint`, encres `--ink #0F1421` / `--ink-2` / `--muted` / `--muted-2`, lignes `--line/--line-2`, fonds `--bg #F6F4F2` / `--surface #fff`, ombres `--shadow-sm/md/lg/glow`, `--ease cubic-bezier(0.22,1,0.36,1)`.
- Typo : **Inter / DM Sans** (corps), **Playfair Display** serif (titres, logo, avatars). Fond `body` = double radial-gradient bordeaux très léger sur `--bg`.

## Composants transverses
- **`PageHeader`** : en-tête unifié (filet d'accent animé + sur-titre capitales + titre Playfair 32px + sous-titre + actions). Utilisé par toutes les pages.
- **`AuthShell`** : coquille auth en 2 volets (panneau de marque éditorial à gauche, formulaire à droite ; volet marque masqué < 880px). Exporte `Field`, `PasswordField` (bascule afficher/masquer), `SubmitButton`, `Alert`.
- **`StatusBadge`** : pastille de statut client — `en-attente` (gris), `envoye` (violet), `relance` (ambre), `recu` (vert). Clé normalisée via `norm()`.
- **`Modal`**, **`Toast`** (`useToast`/`showToast`), **`UnderDevelopment`** (floute une page + carte « En développement / V1 », pour les sections à venir).
- **`clients.ts`** : `norm` (minuscule + sans accents), `initials`, `avatarColor` (hash → palette de 6 couleurs) — avatars déterministes par nom.

## Animations (framer-motion)
- Sidebar : glow ambiant en boucle, onglet actif partagé (`layoutId="nav-active-bg/bar"`), entrées décalées.
- Transitions de page (`AnimatePresence` sur `location.pathname` dans [[Layout]]).
- Dashboard : compteurs animés (`useMotionValue`/`useSpring`/`useTransform`).
- Skeletons (`.skeleton` + `@keyframes shimmer`) pendant les chargements.

## Export PDF (`utils/exportPdf.ts`)
- `exportValidationPdf(report, anomalies, preview, filename, country)` génère un **rapport A4 brandé Fingec** : bandeau bordeaux + « FINGEC », ligne méta (pays / lignes / score), table de stats (score colorisé par seuils 90/70), table des anomalies (sévérité colorée ERROR/WARNING/INFO), aperçu données (50 lignes), pied « Document confidentiel — Usage interne » + pagination.
- Déclenché depuis `ValidationReport` (page [[13 - Traitement comptable (Quadra)]]).

## Logo
- App : `/fingec-logo.png` (servi en statique, `public/`).
- E-mails : `CABINET_LOGO` = `https://raw.githubusercontent.com/fingec/fingec-assets/refs/heads/main/fing.png` (URL publique requise pour l'affichage hors app). [[21 - Signature e-mail & charte Fingec]].

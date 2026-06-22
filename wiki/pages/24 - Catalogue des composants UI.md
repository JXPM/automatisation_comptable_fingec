---
type: reference
tags: [fingec, automatisation-comptable, frontend, composants]
updated: 2026-06-22
status: stable
---

# 24 — Catalogue des composants UI

Inventaire de `frontend/src/components/` (+ `auth/`). Style **inline + tokens CSS** ([[22 - Design system & stack frontend]]), animations **framer-motion**. Vue d'ensemble : [[20 - Frontend - structure & pages]].

| Composant | Rôle | Points clés |
|---|---|---|
| **Layout** | Coquille des pages protégées | sidebar bordeaux 244px (glow animé, bruit), nav avec onglet actif animé (`layoutId` `nav-active-bg`/`nav-active-bar`), `main` = conteneur de scroll. ⚠️ trait actif centré sans `transform` (sinon écrasé par framer). |
| **Topbar** | Barre haute sticky (h.60) | avatar (initiales) → menu compte : « Paramètres du compte » (`/compte`) + « Se déconnecter ». Ferme au clic extérieur / Échap. `backdrop-filter blur`. |
| **PageHeader** | En-tête de page unifié | barre d'accent animée (`scaleY`) + eyebrow capitales + titre **Playfair** + sous-titre/actions optionnels. Partagé par toutes les pages. |
| **AuthShell** | Coquille d'auth (login/oubli/réinit) | formulaire à gauche, volet onboarding bordeaux à droite (lampe, dashboard flottant, carrousel). Exporte **`Field`**, **`PasswordField`** (icônes lucide), **`SubmitButton`** (flèche optionnelle), **`Alert`**. [[20 - Frontend - structure & pages]]. |
| **LegalLayout** | Coquille pages légales publiques | topbar logo + retour connexion, carte article, liens croisés mentions/confidentialité/CGU. [[Conformité RGPD & pack légal]]. |
| **UploadForm** | Import du fichier comptable | drag&drop (DataTransfer), select Pays, champ **Société/dossier** (en-tête du journal), POST `/process` (`authFetch`). [[13 - Traitement comptable (Quadra)]]. |
| **ValidationReport** | Rapport de validation | KPIs (lignes/erreurs/avertissements/score), barre de score colorée, boutons **Journal Quadra** / **Synthèse (.xlsx)** / **Exporter PDF**, **badge d'équilibre** + notes du journal. |
| **ResultTable** | Aperçu des données traitées | colonnes (date/sales_ht/vat/fees/shipping/adjustments/total_settlement), **tri 3 états**, taille de page (10/20/30/50/Tout), surlignage des lignes d'une anomalie sélectionnée (sévérité). |
| **AnomalyConsole** | Panneau « Vérification des données » | états idle/scanning/clean/issues, compteurs animés (`useSpring`), cartes d'anomalies cliquables (filtrent le tableau), icônes SVG inline. [[13 - Traitement comptable (Quadra)]]. |
| **Modal** | Confirmation (relance) | overlay flouté, « Confirmer la relance », Annuler/Envoyer. Utilisé par Clients & Historique. |
| **StatusBadge** | Pastille de statut client | mappe `en-attente/envoye/relance/recu` (via `norm`) → couleurs. |
| **Toast** | Notifications | `ToastProvider` + `useToast().showToast(msg, type)`, auto-dismiss 3,5 s, succès/erreur. Monté à la racine ([[20 - Frontend - structure & pages]]). |
| **UnderDevelopment** | Voile « En développement » | floute le contenu + carte centrale animée « Bientôt disponible ». Pour les sections hors V1. |
| **auth/ProtectedRoute** | Garde de route | spinner pendant `loading`, redirige `/login` (mémorise `from`) si non connecté, `adminOnly` → redirige `/` si pas admin. |
| **auth/AuthContext** | État d'auth global | `user/loading/login/logout`, revalide `/auth/me` au montage, déconnexion auto sur 401. [[11 - Authentification & comptes]]. |

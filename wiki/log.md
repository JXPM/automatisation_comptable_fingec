---
type: log
tags: [log, journal]
updated: 2026-06-17
---

# 🪵 Journal du Wiki

> Append-only. Préfixe parsable : `## [AAAA-MM-JJ] <type> | <titre>`.
> Dernières actions : `grep "^## \[" wiki/log.md | tail -5`.

## [2026-06-17] setup | Initialisation du cerveau « Automatisation Comptable Fingec »
- Mise en place du pattern **LLM Wiki** (schéma + index + log + conventions), calqué sur le cerveau `pharmaclick-ci/wiki`. Schéma : [[CLAUDE]].
- Structure créée : `wiki/{pages,sources,syntheses,assets}` + `index.md` + `log.md` + `.claude/commands/`.
- Commandes installées : `/ingest`, `/query`, `/save`, `/lint` (adaptées du repo BenBktech « Un-second-cerveau-Obsidian-Claude »).

## [2026-06-17] setup | Pré-remplissage à partir du code + de la session du jour
- **16 pages** créées couvrant tout le projet : fondations ([[01 - Vue d'ensemble]], [[02 - Architecture globale]]), backend ([[10 - Backend FastAPI]], [[11 - Authentification & comptes]], [[12 - E-mails de compte (emailer + n8n)]], [[13 - Traitement comptable (Quadra)]]), frontend ([[20 - Frontend - structure & pages]], [[21 - Signature e-mail & charte Fingec]]), n8n ([[30 - Workflow n8n « fingec automatisation »]], [[31 - Credentials Google OAuth (Sheets & Gmail)]], [[32 - Relances clients (cycle de mails)]]), infra ([[40 - Déploiement (CI-CD & VPS)]], [[41 - Caddy & routage]]), référence ([[50 - Glossaire, endpoints & webhooks]]), entité [[Écosystème Fingec]].
- Faits tirés du code lu en direct : `backend/{main,auth,emailer,processor}.py`, `frontend/src/...` (MailPage, AdminPage, api.ts, cabinet.ts), `.github/workflows/{ci,deploy}.yml`, exports n8n. MOC : [[00 - Index (MOC)]].

## [2026-06-17] ingest | Session debug OAuth & refonte e-mail de compte
- Source : [[2026-06-17 - Session debug OAuth & refonte e-mail de compte]].
- A alimenté : [[31 - Credentials Google OAuth (Sheets & Gmail)]] (expiration 7 j, 2 credentials séparées), [[12 - E-mails de compte (emailer + n8n)]] (échec silencieux, refonte HTML/expéditeur), [[40 - Déploiement (CI-CD & VPS)]] (ssh-keyscan flaky → rerun).
- ⚠️ Contradictions flaguées : statut OAuth « Testing » à confirmer ([[31 - Credentials Google OAuth (Sheets & Gmail)]]) ; cartographie hébergement à synchroniser avec le cerveau pharmaclick ([[Écosystème Fingec]]).
- Questions ouvertes : publier l'app OAuth Google (Testing → Production) ; brancher `contact@fingec.fr` comme expéditeur.

## [2026-06-22] setup | Pack conformité RGPD & légal + page wiki
- Création du dossier `legal/` (racine dépôt) : **9 documents** — mentions légales, politique de confidentialité (+ cookies), CGU, registre des traitements (art. 30), registre sous-traitants (art. 28), politique de conservation, procédure violation (art. 33-34), modèle DPA (art. 28), évaluation AIPD (art. 35) + `README` index.
- Ancrés sur l'architecture réelle : 3 traitements (comptes SQLite, clients Google Sheets/Gmail, fichiers comptables). Sous-traitants : Hostinger, Google ; n8n auto-hébergé = non-tiers.
- Idée reçue corrigée : **plus de dépôt CNIL** depuis 2018 (accountability).
- Page créée : [[Conformité RGPD & pack légal]] (`status: draft`) ; index mis à jour (nouvelle section « 🔒 Conformité & légal »).
- ⚠️ À trancher (session « clarifications ») : rôle RGPD (responsable vs sous-traitant), identité cabinet (`[À COMPLÉTER]`), compte Google Workspace vs perso, frontend prod (VPS vs Vercel). Trous techniques : purge `output/` + `logs.json` + jetons expirés.

## [2026-06-22] maintenance | RGPD : clarifications intégrées + purge implémentée
- **Identité renseignée** dans tout le pack `legal/` : Fingec EURL, SIRET 808 015 994 00037, RCS Strasbourg, TVA FR49808015994, siège 6 rue Frédéric Chopin 67118 Geispolsheim, gérant Ohouo N'Katta. **DPO non désigné** (non obligatoire).
- **Sous-traitants tranchés** : Google **Workspace pro** confirmé ; **tout hébergé sur Hostinger** (pas de Vercel) → reste à archiver les DPA + confirmer datacenter UE.
- **Trous techniques comblés** (code) : purge auto quotidienne dans `backend/main.py` (`_purge_loop`, `_purge_outputs`, `_purge_logs`) + `auth.purge_expired_tokens`. Env `OUTPUT_RETENTION_DAYS` (90) / `LOGS_RETENTION_DAYS` (365), branchées dans `.env.example` + `docker-compose.yml`. Tests : `backend/tests/test_retention.py` (4). Suite : **62 passed**.
- Reste à trancher : **rôle RGPD** (responsable vs sous-traitant) ; placeholders mineurs (capital, n° Ordre, contact RGPD). Détail : [[Conformité RGPD & pack légal]].

## [2026-06-22] ingest | Relecture complète du frontend (refonte SaaS) — wiki resynchronisé
- Lecture in extenso de `frontend/src` (35 fichiers, ~5900 lignes) + `processor.py`. Le frontend a quasi doublé depuis le 2026-06-17.
- **Page [[20 - Frontend - structure & pages]] réécrite** : routes exactes, shell (sidebar bordeaux animée + topbar avatar), persistance local/sessionStorage, `authFetch`/401.
- **Nouvelles pages** : [[22 - Design system & stack frontend]] (stack Tailwind v4 + framer-motion + jsPDF + React 19/RR7/Vite 8, tokens CSS, PageHeader/AuthShell, export PDF `exportPdf.ts`) ; [[23 - Tableau de bord & écrans de relance]] (Dashboard KPIs + mapping boutons→webhooks Clients/Historique).
- **[[21 - Signature e-mail & charte Fingec]] enrichie** : édition inline des coordonnées dans MailPage, carnet d'adresses fusionné (clients + collaborateurs).
- ⚠️ **Contradictions flaguées** : route `/mail` (≠ ancien `/nouveau-mail`) ; champ d'envoi `message` vs `{{ $json.html }}` côté n8n (à vérifier dans le workflow) ; `DEFAULT_CABINET.adresse` placeholder ≠ adresse réelle (Geispolsheim) ; commentaire « Vercel » dans `api.ts` périmé (prod = VPS).
- `processor.py` conforme à [[13 - Traitement comptable (Quadra)]] (8 anomalies, score 100−15e−5w) : pas de correction nécessaire.

## [2026-06-22] maintenance | Vérif e-mails n8n + corrections code
- **Fausse alerte levée** : les nœuds Gmail consomment bien le champ **`message`** (`{{ $json.body.message }}`), pas `html` → les mails partent non vides. Wiki [[21 - Signature e-mail & charte Fingec]] corrigé (callout `success`).
- Route `/mail` : jamais un bug, simple doc périmée (déjà corrigée). Sans rapport avec l'arrivée des mails.
- **Code corrigé** : `cabinet.ts` `DEFAULT_CABINET.adresse` → vraie adresse (Geispolsheim) ; commentaire « Vercel » de `api.ts` remplacé (prod = VPS/Caddy).
- ⚠️ Reste : la signature **codée en dur dans le nœud n8n account-email** garde `12 rue Exemple…` → à corriger dans l'instance n8n (pas de CD).
- DPA modèle : identité Fingec pré-remplie ; `[Le Client]` reste à renseigner au cas par cas (doc dormante car Fingec = responsable autonome).

## [2026-06-22] query | Vérif sur le n8n EN LIGNE (MCP) — correction de l'entrée précédente
- Interrogé l'instance live `n8n.fingec.fr` (workflow `CtEh608Gl7o9N9HA`, 41 nœuds) via MCP — **pas** l'export du dépôt (périmé : sans `send-mail` ni `envoi-initial`).
- **Flux `send-mail` exact** : webhook reçoit `{from,to,subject,message}` → nœud Code **`Split recipients`** mappe `html = body.message` + découpe `to` → nœud Gmail **`Send composed mail`** lit `{{ $json.html }}`. Donc `message` (front) ET `{{ $json.html }}` (Gmail) sont **tous deux corrects**, pontés par Split. Correction de l'entrée maintenance précédente qui disait « pas html ». [[21 - Signature e-mail & charte Fingec]].
- **Adresse placeholder `12 rue Exemple`** présente dans **4 nœuds Gmail live** (Send a message, Send a message2, Send initial mail, Send Account Email) → à corriger dans n8n.
- Webhooks live (8) : get-clients, relance-client, get-historique, marquer-recu, relance-historique, envoi-initial, send-mail, send-account-email.

## [2026-06-22] maintenance | Correctifs n8n LIVE + complétion identité légale
- **n8n en ligne modifié & publié** (via MCP, workflow `CtEh608Gl7o9N9HA`) :
  - `appendAttribution=false` sur les **6 nœuds Gmail** → suppression de « This email was sent automatically with n8n ».
  - Adresse `12 rue Exemple` → **6 rue Frédéric Chopin, 67118 Geispolsheim** dans 4 nœuds (Send a message, Send a message2, Send initial mail, Send Account Email). Vérifié par md5 (aucune autre modif), 0 occurrence restante. Version publiée (`activeVersionId` 7acb3f2c).
  - ⚠️ Reste un placeholder **téléphone** `03 00 00 00 00` dans les signatures n8n de relance/initial (à remplacer par +33 (0)9 83 00 08 43 si souhaité).
- **Pack légal complété** : capital **1 000 €**, contact **expert@fingec.fr** / **+33 (0)9 83 00 08 43**, datacenter Hostinger **Paris (UE)**. Word régénérés (10/10). Seul reste : n° d'Ordre des experts-comptables. [[Conformité RGPD & pack légal]].

## [2026-06-22] maintenance | Téléphone n8n + refonte connexion + pages légales publiques
- **n8n LIVE** : remplacé le placeholder `03 00 00 00 00` → **+33 (0)9 83 00 08 43** dans les 3 nœuds de signature (Send a message, Send a message2, Send initial mail). Vérifié md5, 0 occurrence restante, **publié** (`activeVersionId` c55d7f51).
- **Page de connexion refondue** (charte Fingec, façon référence Dribbble) : `AuthShell` réécrit — formulaire à gauche (logo centré, icônes **lucide**, « Se souvenir de moi » + flèche), volet droit « onboarding » bordeaux (lampe suspendue, aperçu de tableau de bord flottant, carrousel framer-motion). Dépendance ajoutée : **lucide-react**. « Se souvenir de moi » rendu réel (localStorage vs sessionStorage via `setSession(…, remember)`). [[20 - Frontend - structure & pages]], [[22 - Design system & stack frontend]].
- **Pages légales publiques publiées** : routes `/mentions-legales`, `/confidentialite`, `/cgu` (`src/pages/legal/` + coquille `LegalLayout`), reprises fidèlement du pack `legal/`. Liens en pied de page de la connexion. [[Conformité RGPD & pack légal]].
- `tsc` clean + `npm run build` OK ; rendu vérifié au Playwright (desktop + mobile).

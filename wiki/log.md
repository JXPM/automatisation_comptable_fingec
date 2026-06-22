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

## [2026-06-22] feature | Génération du journal d'écritures Quadra (TikTok)
- **Nouveau livrable** : la sortie n'est plus seulement une synthèse, mais un **journal d'écritures en partie double** (format Cegid Quadra), calqué sur `MODELE JNL TIKTOK FRANCE.xlsx` (fourni). Module `backend/journal.py`.
- **Mapping (France)** vérifié au centime sur le fichier réel : Débit `90TIKTFR`=encaissement (total_settlement) + `62220000`=commission HT + `44566000`=TVA déductible ; Crédit `70721000`=ventes HT + `70800000`=port HT + `44572000`=TVA collectée. **TVA = TTC − HT** (équilibre exact). 1 écriture/jour (agrégation), journal `VTE`, libellé « F TIKTOK - FRANCE ».
- **Hors France** : même structure sans TVA (libellé « F TIKTOK - EXPORT ») — ⚠️ comptes export repris de France par défaut, **à confirmer**.
- **Équilibrage** : arrondi ≤ 0,02 € absorbé sur la TVA collectée ; ajustement plus grand → ligne d'ajustement explicite + note.
- **Détection plateforme** : CSV = Shopify (journal **non généré**, modèle pas encore défini), Excel = TikTok. Config comptes centralisée et modifiable (`JOURNAL_CONFIG`).
- **Front** : bouton « Journal Quadra » (livrable principal) + « Synthèse (.xlsx) » (contrôle qualité) dans [[20 - Frontend - structure & pages]] ; badge d'équilibre + notes. **Tests** : `backend/tests/test_journal.py` (8). Suite : **70 passed**. Contrat HTTP `/process` vérifié (TestClient).
- ⚠️ Restent à confirmer : comptes export (hors France), compte d'ajustement, modèle de sortie Shopify, et l'en-tête « entreprise » du fichier (générique pour l'instant).

## [2026-06-22] feature | Journal Quadra : config externalisée + ajustement en compte d'attente + en-tête société
- **« Faire varier au lieu d'halluciner »** : le mapping des comptes est désormais **surchargeable** par un fichier `backend/journal_config.json` (ou env `JOURNAL_CONFIG_FILE`), deep-merge sur les défauts (clé `plateforme|régime`, ex. `tiktok|france`). Modèle : `backend/journal_config.example.json`. Rien n'est figé en dur.
- **Ajustements → compte d'attente `471000`** (au lieu de réutiliser le port). Un écart non rapproché est parqué en classe 47 + note d'avertissement, pour reclassement **manuel** par le comptable (ne fausse ni résultat ni TVA).
- **En-tête société** : champ facultatif « Société / dossier » sur l'upload (`UploadForm`) → `entreprise` (Form) → bandeau du journal. Vide = bandeau générique. Pas d'invention du nom client.
- Tests : `test_journal.py` passe à **9** (ajout override config + compte d'attente) → suite **71 passed**. `tsc`/`build` OK. Variations vérifiées : FR (en-tête injecté, équilibré), EXPORT (sans TVA, libellé « F TIKTOK - EXPORT », note), override JSON (comptes custom, équilibré).
- Reste « plus tard » : modèle de sortie **Shopify** (CSV → journal non généré, message explicite).

## [2026-06-22] maintenance | Vérif « la sortie varie selon le fichier » + ingestion wiki
- **Doute soulevé** : « peu importe le fichier, rien ne change ». **Démenti par preuve** : deux fichiers réels donnent des sorties distinctes — `Juilet_Aout` = 176 lignes / 13 628,18 € / 1ʳᵉ date 19/07 ; `NOV_DEC` = 250 lignes / 32 683,99 € / 1ʳᵉ date 01/11. Vérifié à 3 niveaux : réponse API `/process`, **fichiers `.xlsx` sur disque** (tailles + contenu), et **reproduction navigateur** (l'affichage passe de 34 → 49 lignes). Conclusion : backend + UI réagissent bien au fichier. Le « 128 450 € » que l'on voit est **uniquement** l'illustration décorative du **login** (pas une donnée). Le Dashboard, lui, est piloté par `/api/clients` + `/logs`.
- **Démo locale** lancée : backend `:8001` (base propre `/tmp/fingec_demo`, admin `admin@fingec.fr`), frontend `:5173`.
- **Ingestion wiki** : page **[[14 - Journal d'écritures Quadra]]** créée (mapping, équilibre, ajustement 471, config externe, intégration `/process`, format export, tests) ; [[13 - Traitement comptable (Quadra)]] renvoie vers elle (synthèse = vue contrôle) ; [[20 - Frontend - structure & pages]] mis à jour (login refondu, pages légales, champ société, boutons Journal/Synthèse, remember-me réel, proxy `:8001`) ; `index.md` (20 pages).

## [2026-06-22] maintenance | UI : panneau d'anomalies contenu + animations d'entrée + ajout rapide destinataires
- **Panneau « Vérification des données »** (`TraitementPage`) : ancien rail collé en haut sur 100vh → **bloc contenu** (sticky `top:24`, `marginTop:36`, `maxHeight:calc(100vh-48px)`, défilement interne, coins arrondis + ombre). Ne prend plus toute la hauteur.
- **Animations d'entrée** au chargement d'un fichier : le panneau **glisse depuis la droite + fondu** (`initial x:48, opacity:0`) ; les blocs de résultat (`ValidationReport` puis `ResultTable`) apparaissent en **fondu-montant décalé** (delay 0.12). [[20 - Frontend - structure & pages]].
- **Nouveau mail** (`MailPage`) : barre **« Ajout rapide »** dans les destinataires — boutons **Tous les collaborateurs (N)**, **Tous les clients (N)**, **Tout le monde (N)** (ajout dédoublonné via `addEmails`) + **Tout retirer**. S'appuie sur l'annuaire fusionné (clients `/api/clients` + collaborateurs `/auth/users`). [[21 - Signature e-mail & charte Fingec]].
- `tsc` clean + `npm run build` OK ; vérifié au navigateur (clic « Tous les collaborateurs » → destinataire ajouté).
- **Fix trait d'accent de la nav** (`Layout`) : le petit bandeau vertical de l'onglet actif (`nav-active-bar`) était mal centré — `transform: translateY(-50%)` est **écrasé par framer-motion** (animation `layoutId`). Recentré sans transform (`top:0; bottom:0; margin:auto 0`, hauteur 18px).

## [2026-06-22] ingest | Ingestion EXHAUSTIVE du dépôt fichier par fichier (cerveau agrandi)
- Parcours intégral du dépôt (backend, frontend, infra, meta) pour ne rien laisser de côté. **8 nouvelles pages** + index/métriques (28 pages au total) :
  - [[16 - Outils en ligne de commande (cli & manage)]] — `cli.py` (traitement hors UI), `manage.py` (create-admin/create-user/set-password/activate/deactivate/list ; amorçage via `ADMIN_EMAIL`/`ADMIN_PASSWORD`).
  - [[24 - Catalogue des composants UI]] — tous les composants `components/` + `auth/` (Layout, Topbar, PageHeader, AuthShell, LegalLayout, UploadForm, ValidationReport, ResultTable, AnomalyConsole, Modal, StatusBadge, Toast, UnderDevelopment, ProtectedRoute).
  - [[25 - Utilitaires frontend (api, cabinet, clients, exportPdf)]] — `api.ts` (authFetch/session 2 stores, downloadFile), `cabinet.ts` (logo githubusercontent, defaults), `clients.ts` (norm/initials/avatarColor), `exportPdf.ts` (jsPDF), `theme.ts`.
  - [[26 - Pages secondaires & flux d'authentification]] — Compte, Logs (DELETE admin), Clients/Historique, login/oubli/réinit (anti-énumération, validation de lien).
  - [[42 - Conteneurs, images & exécution]] — `docker-compose.yml` (3 conteneurs sur `pharmaclick_web`), `Dockerfile.backend` (py3.12, 1 worker, healthcheck), `frontend/Dockerfile`+`nginx.conf` (en-têtes sécurité), variables d'env, `requirements.txt`.
  - [[51 - Tests automatisés]] — suite pytest **71 tests** détaillée par fichier (processor 39, journal 9, auth 7, password 7, assignments 5, retention 4) + fixtures `conftest.py`.
- ⚠️ **Contradictions / dette flaguées** : [[43 - Vestiges Render-Vercel & fichiers brouillons]] (`render.yaml`, `frontend/vercel.json`, `Journal.sh`, `settings.json` génériques — hébergement Render+Vercel **abandonné** au profit du VPS Docker) et [[60 - Outillage du dépôt (assistant, règles, skills)]] (agents/commands/rules/skills **scaffolding générique** référençant un faux `src/`+`ui/` ; exports n8n périmés).
- 🔴 **Sécurité** : `.claude/settings.local.json` contient un **mot de passe en clair** (`expert@fingec.fr`) dans d'anciennes commandes curl → à **révoquer** (signalé dans [[60 - Outillage du dépôt (assistant, règles, skills)]]).

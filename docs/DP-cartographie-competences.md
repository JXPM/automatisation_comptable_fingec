# Cartographie des compétences C1 → C21 (DEVIA) ↔ projet Fingec

> Document de travail pour le Dossier Professionnel. Pour chaque compétence du
> référentiel (RNCP 37827), on relie **une preuve concrète** dans Fingec
> (fichier, capture, test, commit) et on note le **statut** :
> ✅ solide · 🟡 à renforcer · 🔴 manque à combler.
>
> Rappel épreuves : **E1** = C1-C5 · **E2** = C6-C8 · **E3** = C9-C13 ·
> **E4** = C14-C19 · **E5** = C20-C21.

---

## Bloc 1 — Collecte, stockage et mise à disposition des données (E1)

| Comp. | Intitulé | Ce que Fingec démontre | Preuves | Statut |
|---|---|---|---|---|
| **C1** | Automatiser l'extraction de données depuis plusieurs sources | **Mix de sources** : fichiers **TikTok (.xlsx)** / **Shopify (.csv)** ; **API REST** (webhooks n8n → Google Sheets) ; **scraping HTML** des taux de change BCE (téléchargement + parsing + gestion d'erreurs + scheduling quotidien) ; **base** SQLite | `backend/processor.py`, `backend/scraper.py` (`fetch_rates`, `parse_rates_html`), `backend/main.py` (`/api/rates`, `_rates_loop`), `n8n/workflows/` | ✅ (fichier + API REST + **scraping** + BDD ; big data hors périmètre, à argumenter) |
| **C2** | Requêtes SQL d'extraction | Requêtes paramétrées SQLite : utilisateurs/attributions, **agrégats de monitorage** (GROUP BY, AVG, sous-requête MAX), **taux de change** (upsert, MAX date) | `backend/auth.py`, `backend/ai/store.py` (`monitoring_summary`), `backend/scraper.py` (`latest_rates`) | ✅ |
| **C3** | Règles d'agrégation : nettoyage, suppression des entrées corrompues, homogénéisation | Nettoyage pandas (normalisation colonnes, typage, drop lignes vides), **détection d'anomalies** (7 règles), **homogénéisation** des libellés pour le modèle (weak supervision) | `backend/processor.py` (`clean_data`, `detect_anomalies`), `backend/ai/dataset.py` | ✅ |
| **C4** | Créer une base de données (Merise, RGPD, import) | **MCD/MPD Merise formalisé** ; schéma SQLite (users, assignments, password_tokens, ai_predictions, ai_feedback, exchange_rates) créé idempotemment ; **pack RGPD** (registre, conservation, purge auto) | `docs/DP-modele-donnees-merise.md`, `backend/auth.py`, `backend/ai/store.py`, `backend/scraper.py`, `legal/` | ✅ |
| **C5** | API REST exposant le jeu de données (OpenAPI, auth) | API FastAPI documentée (OpenAPI auto sur `/docs`), authentifiée par cookie httpOnly + JWT, endpoints `/process`, `/download`, `/api/*` | `backend/main.py`, `backend/ai/api.py` | ✅ |

**Statut E1 :** scraping (taux BCE) et MCD/MPD Merise désormais **livrés** ✅. Reste à argumenter le volet « big data » (probablement à présenter comme hors périmètre justifié : volumétrie réelle modeste).

---

## Bloc 2 — Intégrer des modèles et services d'IA

### E2 (C6-C8) — Veille, benchmark, paramétrage d'un service d'IA

| Comp. | Intitulé | Ce que Fingec démontre | Preuves | Statut |
|---|---|---|---|---|
| **C6** | Veille technique et réglementaire | À formaliser : veille sur la catégorisation comptable par ML, l'IA Act, le RGPD appliqué aux données comptables | *(à rédiger : sources, rythme hebdo, synthèses)* | 🔴 (à produire) |
| **C7** | Benchmark de services d'IA préexistants | À formaliser : comparaison **modèle maison (TF-IDF+régression) vs LLM (API OpenAI/Claude) vs services OCR/compta (Dext, Pennylane)** — pourquoi un modèle léger, interprétable et auto-hébergé est retenu (coût, RGPD, éco-responsabilité) | choix d'archi déjà acté dans `backend/ai/train.py` (commentaire) | 🟡 (décision prise, **benchmark écrit à formaliser**) |
| **C8** | Paramétrer un service d'IA | Le modèle est servi comme un **service interne** configurable (seuil de revue `AI_REVIEW_THRESHOLD`, chemins d'artefacts, rechargement à chaud) | `backend/ai/model.py`, `backend/ai/api.py` | 🟡 (interprétable comme « service » ; à articuler dans le récit E2) |

### E3 (C9-C13) — API du modèle, intégration, monitorage, tests, CI/CD

| Comp. | Intitulé | Ce que Fingec démontre | Preuves | Statut |
|---|---|---|---|---|
| **C9** | API REST exposant un modèle d'IA (OWASP, doc) | Routeur `/api/ai` : `categorize`, `categorize-batch`, `feedback`, `categories`, doc OpenAPI ; sécurité (auth, validation des entrées, 401/422/503) | `backend/ai/api.py` | ✅ |
| **C10** | Intégrer l'API du modèle dans une application | Écran **« Catégorisation IA »** : prédictions + confiance + **revue/correction** | `frontend/src/pages/CategorisationPage.tsx`, `frontend/src/utils/ai.ts` · capture `fingec-categorisation-correction.png` | ✅ |
| **C11** | Monitorer un modèle (métriques, dashboard) | **Tableau de bord « Monitorage IA »** : volume, confiance moyenne, taux de revue, histogramme, dérive par jour ; journalisation des prédictions | `frontend/src/pages/MonitoringIAPage.tsx`, `backend/ai/store.py` · capture `fingec-monitoring-ia.png` | ✅ |
| **C12** | Tests automatisés du modèle | 19 tests (dataset déterministe, plancher de généralisation, contrat d'inférence, revue, API, cloisonnement admin) | `backend/tests/test_ai_model.py`, `backend/tests/test_ai_api.py` | ✅ |
| **C13** | Chaîne de livraison continue du modèle (MLOps) | **Boucle de feedback + réentraînement à chaud**, entraînement **packagé au build Docker**, CI (pytest) et CD (deploy) GitHub Actions | `backend/ai/train.py`, `Dockerfile.backend` (`RUN python -m ai.train`), `.github/workflows/` · commit `23e6c26` | ✅ |

---

## Bloc 3 — Réaliser une application intégrant un service d'IA

### E4 (C14-C19) — Application

| Comp. | Intitulé | Ce que Fingec démontre | Preuves | Statut |
|---|---|---|---|---|
| **C14** | Analyser le besoin (specs, Merise, accessibilité) | Besoin métier : réduire la saisie comptable manuelle ; specs fonctionnelles du flux import → écriture Quadra | `CLAUDE.md`, `GUIDE-PRISE-EN-MAIN.md` | 🟡 (à formaliser en user stories + critères) |
| **C15** | Concevoir le cadre technique (archi, outils) | Archi : **React/Vite (front) + FastAPI (back) + n8n (orchestration) + SQLite + Docker/Caddy (VPS)** | `docker-compose.yml`, `Dockerfile.backend`, `deploy/` | ✅ |
| **C16** | Coordonner la réalisation (agile, MLOps) | Trunk-based, commits par feature, CI/CD ; contexte MLOps pour le modèle | historique Git, `.github/workflows/` | 🟡 (à raconter : méthode, rituels) |
| **C17** | Développer composants et interfaces (front, standards, sécurité) | UI complète (auth, traitement, clients, mail, **catégorisation IA**, monitorage) ; sécurité (httpOnly, JWT, OWASP) | `frontend/src/`, `backend/` | ✅ |
| **C18** | Automatiser les tests du code source (CI) | `ci.yml` : pytest backend + typecheck/build frontend à chaque push/PR | `.github/workflows/ci.yml` | ✅ |
| **C19** | Processus de livraison continue (CD, packaging) | `deploy.yml` : gate de tests → rsync → `docker compose up --build` → healthcheck | `.github/workflows/deploy.yml` | ✅ |

### E5 (C20-C21) — Monitorage applicatif et incident

| Comp. | Intitulé | Ce que Fingec démontre | Preuves | Statut |
|---|---|---|---|---|
| **C20** | Surveiller une application (monitorage, journalisation, alertes, feedback loop) | **Stack monitoring** (Sentry + Uptime Kuma/Netdata/Dozzle), `observability.py`, journalisation, **feedback loop** du modèle | `backend/observability.py`, `docker-compose.monitoring.yml` | ✅ |
| **C21** | Résoudre un incident technique | À documenter : un incident réel résolu (ex. expiration OAuth Google → mails silencieux ; ou bug d'affichage clients) avec diagnostic, correctif, test | historique Git + mémoire projet | 🟡 (choisir 1 incident et le documenter de bout en bout) |

---

## Synthèse des manques à combler (priorisée)

**Déjà comblés** : ✅ C1/C2 (scraping BCE + SQL), ✅ C4 (Merise `docs/DP-modele-donnees-merise.md`).

Restent (essentiellement de la **rédaction**, plus de code) :
1. 🔴 **C6 (veille)** + 🟡 **C7 (benchmark écrit)** : produire la veille et le benchmark de services d'IA (E2 repose dessus).
2. 🟡 **C14/C16** : rédiger **user stories** + récit méthode agile.
3. 🟡 **C21** : choisir **un incident** et le documenter (diagnostic → résolution → test).

> Les blocs **2-E3** et **3-E4** sont **solidement couverts** par la brique IA et l'app. Les manques restants sont rédactionnels (veille, benchmark, user stories, incident) — à traiter pendant l'écriture du DP.

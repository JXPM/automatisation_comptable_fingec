# Plan du Dossier Professionnel — DEVIA (Fingec)

> Structure cible : **50-70 pages hors annexes**, Calibri/Arial 12, interligne
> 1,5, justifié, sommaire cliquable. Page de garde imposée + **attestation
> anti-plagiat en dernière page**. Nommage PDF : `NOM-Prénom-2026`.
> Remise **20/07/2026 avant 12h** (Compilatio). ⚠️ Reformuler tout texte
> généré (anti-plagiat + détecteur d'IA).

## 0. Pages préliminaires (~4 p)
- **Page de garde** : NOM Prénom · « Développeur en Intelligence Artificielle » ·
  RNCP 37827 · Promotion · EPSI/Simplon · Nom entreprise (stage) · Responsable de
  formation · logos école + entreprise.
- Remerciements (1 p).
- **Sommaire cliquable et numéroté**.
- (Glossaire optionnel.)

## 1. Introduction (~2 p)
- Présentation personnelle + parcours.
- Le projet **Fingec** en une phrase + pourquoi il couvre les 3 blocs.
- Annonce du plan.

## 2. Environnement professionnel (~6-8 p)
- **Entreprise/stage** : activité, secteur (cabinet comptable / e-commerce).
- **Cartographie du SI** : schéma (front React, back FastAPI, n8n, SQLite,
  Docker/Caddy/VPS Hostinger, monitoring). → *réutiliser le schéma d'archi.*
- Service / équipe / mes **missions**.
- Méthodologie de travail (agile/trunk-based, Git, CI/CD). → **C16**

## 3. Valorisation des compétences — par épreuve (cœur, ~32-40 p)

### 3.1 E1 — Collecte, stockage, mise à disposition des données (C1-C5) (~8 p)
- Sources : fichiers TikTok/Shopify, **scraping taux BCE**, webhooks n8n, SQLite.
- Nettoyage / anomalies / homogénéisation (pandas).
- **Base de données** : MCD/MPD Merise + RGPD. → *réutiliser `DP-modele-donnees-merise.md`*
- API REST d'exposition (FastAPI, OpenAPI).
- Preuves : `processor.py`, `scraper.py`, `/api/*`, captures.

### 3.2 E2 — Veille, benchmark, service d'IA (C6-C8) (~6 p)
- → *réutiliser `DP-E2-veille-benchmark.md`* (veille, benchmark modèle maison vs
  LLM vs SaaS, paramétrage du service).

### 3.3 E3 — API du modèle, intégration, monitorage, tests, CI/CD (C9-C13) (~10 p)
- **Le cœur IA.** Problème → solution (catégorisation comptable).
- Jeu de données (weak supervision), entraînement, **évaluation honnête**
  (split de groupe + holdout, matrice de confusion).
- API du modèle (`/api/ai`, OWASP, OpenAPI).
- Intégration UI (écran Catégorisation IA). → *captures*
- **Monitorage** (dashboard) + **boucle de feedback / réentraînement** (MLOps).
- Tests (19) + **CI/CD** (pipeline multi-étapes + entraînement au build Docker).
- Preuves : `backend/ai/`, captures `fingec-*.png`, runs GitHub Actions, commits.

### 3.4 E4 — Application intégrant le service d'IA (C14-C19) (~8 p)
- **Analyse du besoin** + user stories + objectifs d'accessibilité. → **C14** *(à rédiger)*
- Architecture & pile technique (C15).
- Développement front/back, sécurité (C17).
- Tests automatisés (C18) + livraison continue (C19).
- Preuves : `frontend/`, `.github/workflows/`, `docker-compose.yml`.

### 3.5 E5 — Monitorage applicatif & résolution d'incident (C20-C21) (~5 p)
- Monitorage applicatif (Sentry, Uptime Kuma, observability). → **C20**
- **Incident documenté** : tests e2e d'auth cassés par la refonte du login →
  diagnostic → correctif → test qui repasse. → **C21** *(à produire)*

## 4. Conclusion (~3 p)
- L'entreprise et ses perspectives.
- Le service et ses évolutions (pistes : LLM en repli, OCR factures, import Quadra direct).
- **Apports professionnels et personnels.**

## 5. Annexes (hors décompte)
- Extraits de code clés, captures, schémas, métriques (`metrics.json`), liens dépôt.
- **Attestation de non-plagiat** (dernière page).

---

## État de la matière (ce qui est prêt vs à écrire)

| Section | Matière dispo | Reste à faire |
|---|---|---|
| E1 | ✅ code + Merise (`DP-modele-donnees-merise.md`) | rédiger le récit + captures |
| E2 | ✅ brouillon (`DP-E2-veille-benchmark.md`) | dater la veille, reformuler |
| E3 | ✅ tout (code, tests, captures, runs CI) | rédiger le récit |
| E4 | ✅ app + CI/CD | **user stories (C14)** + récit méthode (C16) |
| E5 | ✅ monitoring | **documenter l'incident e2e (C21)** |
| Env. pro | partiel | infos entreprise/stage à fournir par toi |

**Manques restants = rédactionnels** : user stories (C14), incident (C21), veille
datée (C6). Le reste est de la mise en récit de preuves existantes.

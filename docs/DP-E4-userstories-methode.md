# DP — Épreuve E4 : Analyse du besoin & méthode (C14, C16)

> ⚠️ Brouillon à reformuler (anti-plagiat + détecteur d'IA).

## C14 — Analyse du besoin (user stories + accessibilité)

**Problème métier :** dans un cabinet, la saisie des écritures e-commerce
(TikTok/Shopify) est chronophage et répétitive : télécharger le relevé, ventiler
chaque montant sur le bon compte, équilibrer, importer dans Quadra. Objectif :
**automatiser** la préparation et **réduire les erreurs**.

**User stories (format : En tant que… je veux… afin de…) :**

| # | En tant que | Je veux | Afin de | Critères d'acceptation |
|---|---|---|---|---|
| US1 | comptable | importer un relevé TikTok/Shopify | générer un journal Quadra | fichier accepté (.xlsx/.csv), export équilibré débit=crédit |
| US2 | comptable | voir un **score de fiabilité** et les anomalies | contrôler avant import | anomalies listées, score affiché |
| US3 | comptable | que l'**IA propose le compte** de chaque ligne | gagner du temps de ventilation | prédiction + confiance, cas douteux signalés |
| US4 | comptable | **corriger** une prédiction | améliorer le modèle | correction enregistrée (feedback) |
| US5 | admin | **monitorer** le modèle | piloter la qualité | tableau de bord (volume, confiance, dérive) |
| US6 | admin | **attribuer des clients** aux comptables | cloisonner l'accès | un comptable ne voit que ses clients |
| US7 | comptable | convertir un relevé en **devise étrangère** | tenir la compta en euros | taux de change scrapé, conversion EUR |
| US8 | utilisateur | me connecter en sécurité | protéger les données | cookie httpOnly, JWT, mot de passe fort |

**Objectifs d'accessibilité (à formuler sur un standard, ex. RGAA/WCAG) :**
contrastes suffisants, libellés de formulaire associés, navigation clavier,
états (focus, erreurs) explicites. *(À auditer et à citer comme objectif des
user stories.)*

**Faisabilité technique :** confirmée — données disponibles (relevés), modèle
léger entraînable, infrastructure existante (Docker/VPS).

## C16 — Coordination / méthode de travail

- **Gestion de version : Git**, dépôt GitHub, **trunk-based** : une branche par
  fonctionnalité (`feat/…`), commits atomiques et messages explicites, fusion
  rapide sur `main`.
- **Intégration & livraison continues** : à chaque push, la **CI** (pipeline
  multi-étapes : lint, tests, modèle IA, builds Docker, e2e) valide ; le **CD**
  (gate de tests → rsync → `docker compose up --build` → healthcheck) déploie en
  production automatiquement.
- **Cycles courts** : on livre par incréments (chaque épreuve = une ou plusieurs
  fonctionnalités déployées et vérifiées en prod), avec une **revue** à chaque
  étape (captures, vérifications live).
- **Pilotage / traçabilité** : l'historique Git, les runs GitHub Actions et le
  monitorage servent de tableau de bord d'avancement.
- **Contexte MLOps** pour la partie IA (entraînement reproductible, packaging au
  build, réentraînement sur feedback).

> À adapter : si l'entreprise utilise un outil (Jira, Trello, Notion) ou des
> rituels (daily, sprint review), les citer ici.

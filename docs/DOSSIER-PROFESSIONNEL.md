# DOSSIER PROFESSIONNEL

> ⚠️ **À LIRE.** Brouillon **détaillé** destiné à prendre du volume (cible 50-70
> pages hors annexes). À **reformuler avec tes propres mots** (anti-plagiat +
> détecteur d'IA) et à mettre en forme dans Word : **Calibri/Arial 12, interligne
> 1,5, justifié**, sommaire **cliquable**, attestation anti-plagiat **en dernière
> page**. PDF : `BILE-KouameJohan-2026.pdf`. Pour insérer une capture : enregistre
> l'image dans `docs/images/` puis remplace le bloc `🖼️ [CAPTURE À INSÉRER]`
> par `![légende](images/nom.png)`, et régénère avec `docs/build-docx.sh`.

---

## Page de garde

> *(À remplir — éléments imposés)*

- **Nom Prénom :** BILE Kouamé Johan Paul-Marie
- **Intitulé de la formation :** [À COMPLÉTER]
- **Nom de la certification :** Développeur en Intelligence Artificielle — RNCP 37827
- **Promotion :** 2025 / 2026
- **Nom de l'école :** [À COMPLÉTER : EPSI / Simplon]
- **Nom de l'entreprise :** Fingec — Cabinet d'expertise comptable
- **Tuteur entreprise / référent :** N'KATTA Ohouo Christian
- **Responsable de formation :** [À COMPLÉTER]
- **Logos :** [À INSÉRER : logo école + logo Fingec]

---

## Remerciements

> *(À personnaliser.)* Je remercie **N'KATTA Ohouo Christian** et l'équipe du
> cabinet **Fingec** pour leur accompagnement, ainsi que l'équipe pédagogique de
> [École] pour la formation reçue. [À COMPLÉTER]

---

## Sommaire

*(À générer automatiquement dans Word — cliquable et numéroté.)*

---

## 1. Introduction

> *(Personnaliser le paragraphe de présentation.)*

Je m'appelle **BILE Kouamé Johan Paul-Marie** et je prépare le titre
**Développeur en Intelligence Artificielle** (RNCP 37827). [À COMPLÉTER : 3-4
phrases sur mon parcours, ma découverte de la data/IA et ma motivation.]

J'ai effectué mon stage au sein du cabinet d'expertise comptable **Fingec**. Ce
cabinet accompagne notamment des **commerçants en ligne** (vendeurs sur TikTok
Shop et Shopify), dont la comptabilité présente une particularité : les
plateformes fournissent des **relevés de règlement** volumineux, hétérogènes et
souvent libellés en anglais, qu'il faut transformer manuellement en écritures
comptables avant de les importer dans le logiciel **Quadra**. Cette tâche est
répétitive, chronophage et source d'erreurs.

Ma mission a consisté à **concevoir, développer et mettre en production** une
application web qui **automatise** cette préparation comptable, depuis l'import du
fichier brut jusqu'à l'export Quadra, en passant par un **contrôle qualité** et
une **brique d'intelligence artificielle** qui propose le compte comptable de
chaque ligne.

Ce projet unique a la particularité de mobiliser les **trois blocs de
compétences** du titre :

1. **Bloc 1 — Données :** collecte multi-sources, nettoyage, stockage en base et
   mise à disposition par une API.
2. **Bloc 2 — Modèle d'IA :** un modèle de **catégorisation comptable** entraîné,
   exposé par API, monitoré et réentraîné (MLOps).
3. **Bloc 3 — Application :** une application complète, sécurisée, testée,
   déployée en continu et maintenue en production (`app.fingec.fr`).

Ces **trois blocs** sont **évalués à travers cinq épreuves** (E1 à E5) : le Bloc 1
correspond à l'épreuve **E1** ; le Bloc 2 est évalué en **deux épreuves**, **E2**
(veille et choix d'un service d'IA, C6-C8) et **E3** (développement, intégration et
mise en production du modèle, C9-C13) ; le Bloc 3 l'est également en deux,
**E4** (l'application, C14-C19) et **E5** (le monitorage applicatif et la
résolution d'incident, C20-C21). C'est pourquoi le dossier comporte **cinq
parties** correspondant aux cinq épreuves, qui couvrent ensemble les **trois
blocs** et les **21 compétences** (C1 à C21).

Le présent dossier valorise donc mes compétences **épreuve par épreuve** (E1 à
E5), en m'appuyant systématiquement sur des réalisations concrètes, versionnées sur
Git et vérifiables en ligne.

---

## 2. Environnement professionnel

### 2.1 Activité et secteur de l'entreprise

**Fingec** est un **cabinet d'expertise comptable** [À COMPLÉTER : taille,
localisation, année de création, typologie de clientèle]. Son cœur de métier est
la tenue, la révision et l'établissement des comptes de ses clients. Une part
croissante de ces clients exerce une activité de **vente en ligne**, ce qui
introduit des spécificités comptables : multiplicité des flux (ventes, frais de
commission, frais de port, taxes, remboursements), volumétrie élevée, et des
relevés au format propre à chaque plateforme.

### 2.2 La problématique métier

Concrètement, pour **un seul mois** d'un client e-commerce, le comptable doit :

- récupérer le relevé de la plateforme (TikTok Shop, Shopify) ;
- isoler les bonnes informations parmi des dizaines de colonnes ;
- **ventiler** chaque montant sur le bon compte du plan comptable (compte de
  ventes, de commissions, de port, de TVA, de remboursements…) ;
- décomposer la **TVA** (HT / TVA) pour les opérations françaises ;
- produire une écriture **équilibrée** (débit = crédit) ;
- importer le tout dans **Quadra**.

Réalisée à la main, cette opération prend un temps considérable et expose à des
erreurs de ventilation ou d'équilibrage. **L'enjeu du projet** est d'industrialiser
ce processus tout en gardant le comptable maître des décisions.

### 2.3 Mes missions

> *(À personnaliser selon ton vécu.)*

- Recueil du besoin auprès de l'équipe comptable.
- Conception de l'architecture technique.
- Développement du traitement des relevés (nettoyage, contrôle qualité, génération
  du journal Quadra).
- Conception et entraînement de la **brique d'IA** de catégorisation.
- Développement de l'interface web et de l'API.
- Mise en production (Docker, VPS, CI/CD) et suivi (monitorage, corrections).

### 2.4 Cartographie du système d'information

L'application s'inscrit dans l'architecture suivante :

- **Frontend** : application web **React + TypeScript** (build Vite), servie par
  un conteneur **Nginx**.
- **Backend** : API **FastAPI (Python)**, authentification par **cookie httpOnly +
  JWT**, autorisation par rôle (administrateur / comptable).
- **Orchestration** : **n8n** (webhooks) pour les échanges avec **Google Sheets**
  (référentiel des clients, historique des envois) et l'envoi d'e-mails. Le
  backend joue le rôle de **proxy authentifié** vers n8n.
- **Stockage** : base **SQLite** (utilisateurs, attributions client→comptable,
  journal des prédictions IA, corrections, taux de change).
- **Intelligence artificielle** : modèle scikit-learn de catégorisation, packagé
  et servi par l'API.
- **Infrastructure** : conteneurs **Docker** orchestrés par Docker Compose sur un
  **VPS Hostinger**, derrière un reverse proxy **Caddy** (HTTPS automatique).
- **CI/CD** : **GitHub Actions** (intégration continue + déploiement continu).
- **Observabilité** : **Sentry** (erreurs), **Uptime Kuma** (disponibilité),
  journalisation applicative.

> 🖼️ **[CAPTURE À INSÉRER]** — *Figure 2.1 — Schéma d'architecture du système
> d'information.* (À dessiner ; fichier `docs/images/architecture.png`.)

### 2.5 Méthodologie de travail

Le projet a été conduit selon une approche **itérative et incrémentale** : chaque
fonctionnalité est développée sur une **branche Git** dédiée, validée par des
**tests automatisés** et une **revue**, puis fusionnée et **déployée
automatiquement** en production. Cette boucle courte (développer → tester →
livrer → vérifier) garantit un produit toujours fonctionnel et traçable.

---

## 3. Valorisation des compétences

### 3.1 E1 — Collecte, stockage et mise à disposition des données (C1-C5)

#### 3.1.1 Contexte

La première brique du projet consiste à **rassembler des données hétérogènes** et
à les rendre exploitables : les relevés des plateformes, le référentiel des
clients, et les taux de change pour les ventes en devises étrangères.

#### 3.1.2 C1 — Automatiser l'extraction depuis plusieurs sources

J'ai mis en place un **flux d'extraction multi-sources**, mobilisant plusieurs
types de sources comme l'exige le référentiel :

**a) Fichiers de données (TikTok, Shopify).** Le module `processor.py`
(`load_file`) lit indifféremment un **CSV Shopify** ou un **Excel TikTok**. Pour
l'Excel, il sélectionne automatiquement la feuille pertinente (`Statements` /
`Statement`) et **ignore** les feuilles annexes (`Order details`, `Reports`,
`Payments`…). Il gère les erreurs (fichier vide, feuille absente, colonnes
obligatoires manquantes) avec des messages explicites.

**b) Service web / API REST (n8n + Google Sheets).** Le référentiel des clients
et l'historique des envois sont stockés dans **Google Sheets** et exposés via des
**webhooks n8n**. Le frontend ne contacte jamais n8n directement : il passe par le
**backend**, qui vérifie le jeton de session puis relaie la requête (proxy
`/n8n/...`). Ce point est important pour la sécurité : n8n n'est jamais joignable
sans authentification, et les données sont **filtrées par utilisateur** (un
comptable ne voit que ses clients attribués).

**c) Scraping web (taux de change BCE).** Les ventes peuvent être libellées en
devise étrangère (USD, GBP…) ; pour tenir la comptabilité en euros, il faut un
taux de change daté. Je l'obtiens en **scrappant** la page HTML des taux de
référence de la **Banque centrale européenne** : le module `scraper.py` télécharge
la page (`fetch_rates`), puis **parse** le tableau des devises (`parse_rates_html`)
au moyen d'expressions régulières ciblant la structure `td.currency` + `span.rate`.
Le résultat est **stocké en base** et **rafraîchi quotidiennement** au démarrage
de l'application (point de lancement planifié). La fonction de parsing est **pure**
(elle prend une chaîne HTML et renvoie un dictionnaire), ce qui la rend
**testable** sans accès réseau.

L'ensemble des scripts est **versionné** sur Git ; le scraping comprend bien un
point de lancement, l'initialisation des dépendances, les connexions externes, la
gestion des erreurs et la sauvegarde des résultats.

#### 3.1.3 C2 — Requêtes SQL d'extraction

Les données stockées sont interrogées en **SQL** (SQLite, requêtes
**paramétrées** contre l'injection) :

- agrégats de **monitorage** du modèle : `COUNT`, `AVG`, regroupements `GROUP BY`,
  et **sous-requête `MAX`** pour la date la plus récente (`ai/store.py`,
  `monitoring_summary`) ;
- récupération du **dernier jeu de taux** de change (`scraper.py`,
  `latest_rates`) ;
- lecture filtrée des utilisateurs et des attributions client→comptable
  (`auth.py`).

La documentation des requêtes met en lumière les choix de sélections, de filtrages
et d'agrégation en fonction des objectifs (suivi qualité, conversion de devises,
cloisonnement des accès).

#### 3.1.4 C3 — Agrégation, nettoyage et homogénéisation

Le module `processor.py` réalise un **nettoyage** complet avec **pandas** :
normalisation des noms de colonnes (minuscules, underscores), **typage numérique**
des montants, suppression des lignes entièrement vides, et conservation des seules
colonnes utiles (`date`, `total_settlement_amount`, `net_sales`, `shipping`,
`fees`, `adjustments`).

Il identifie ensuite les **entrées corrompues ou suspectes** via **sept règles de
détection d'anomalies** :

1. **Valeurs manquantes** par colonne (erreur) ;
2. **Ventes nettes négatives** (suspect : les remboursements devraient passer par
   `adjustments`) ;
3. **Frais ou port négatifs** (avertissement : correction possible) ;
4. **Incohérence des totaux** : `total_settlement ≠ net_sales + adjustments −
   fees − shipping` au-delà d'une tolérance ;
5. **TVA incohérente** (France) : ratio TVA/HT s'écartant de 20 % ;
6. **Valeurs aberrantes** détectées par **MAD** (median absolute deviation,
   robuste) avec repli sur l'écart-type ;
7. **Doublons** (même date + même total) et **dates futures**.

Un **score de fiabilité** (0-100 %) est calculé en pénalisant erreurs et
avertissements, ce qui donne au comptable une indication immédiate sur la qualité
du relevé importé.

Pour la brique IA, j'**homogénéise** également les libellés (casse, ponctuation,
variantes) lors de la construction du jeu d'entraînement (voir E3).

#### 3.1.5 C4 — Créer la base de données (Merise, RGPD)

J'ai modélisé la base selon la méthode **Merise** :

- **MCD** (modèle conceptuel) : entités UTILISATEUR, ATTRIBUTION (client→comptable),
  JETON_MDP, PREDICTION, FEEDBACK, TAUX_CHANGE, avec leurs cardinalités.
- **MPD** (modèle physique) : tables SQLite `users`, `client_assignments`,
  `password_tokens`, `ai_predictions`, `ai_feedback`, `exchange_rates`, avec clés
  primaires, contraintes d'unicité et liens.

Le détail (diagramme entité-association, types, choix techniques) figure en
**annexe** (et dans `docs/DP-modele-donnees-merise.md`).

**Conformité RGPD :** les mots de passe sont hachés (**bcrypt**) et les jetons ne
sont jamais stockés en clair (**SHA-256**) ; une **purge automatique** quotidienne
supprime les données au-delà d'une durée de conservation paramétrable
(minimisation) ; un **registre des traitements** et une **politique de
conservation** sont rédigés (dossier `legal/`). Les tables sont créées
**idempotemment** au démarrage, ce qui rend la procédure d'installation
reproductible.

#### 3.1.6 C5 — API REST d'exposition

L'**API FastAPI** expose les données et traitements : `/process` (traitement d'un
relevé), `/download` (export Quadra), `/api/clients`, `/api/historique`,
`/api/rates`. Elle est **documentée automatiquement** au standard **OpenAPI**
(accessible sur `/docs`), et **sécurisée** par authentification (cookie httpOnly +
JWT) et autorisation par rôle.

> 🖼️ **[CAPTURE À INSÉRER]** — *Figure E1.1 — Écran « Traitement » : import d'un
> relevé, score de fiabilité, anomalies et journal Quadra généré.* (Fichier
> `docs/images/e1-traitement.png`.)

> 🖼️ **[CAPTURE À INSÉRER]** — *Figure E1.2 — Documentation OpenAPI de l'API
> (`app.fingec.fr/docs`).* (Fichier `docs/images/e1-openapi.png`.)

**Livrable E1 :** rapport présentant le flux automatisé de collecte, les requêtes
de nettoyage/agrégation, la création de la base et l'exposition par API.

---

### 3.2 E2 — Veille, benchmark et service d'IA (C6-C8)

#### 3.2.1 C6 — Veille technique et réglementaire

J'ai mis en place une **veille hebdomadaire** (créneau d'environ une heure, le
vendredi), structurée autour de trois axes et capitalisée dans un espace de notes
(wiki du projet) :

| Axe | Sources suivies |
|---|---|
| ML / NLP | documentation **scikit-learn**, blog **Hugging Face**, *Papers with Code* |
| MLOps | **MLflow**, **DVC**, guides MLOps |
| Réglementaire | **CNIL** (IA & RGPD), **AI Act** (règlement UE 2024/1689) |
| Métier comptable | éditeurs (**Pennylane**, **Dext**, **Cegid**) |

Les sources sont **qualifiées** (auteur identifié, notoriété, fraîcheur de
publication). [À COMPLÉTER : 2-3 synthèses datées rédigées avec tes mots.]
Principaux enseignements ayant **orienté le projet** :

- **AI Act** : un outil d'**aide** à la catégorisation comptable relève d'un risque
  limité, à condition d'assurer la **transparence** (informer qu'une IA propose)
  et de garder un **humain dans la boucle** — ce que réalise le seuil de revue.
- **RGPD** : privilégier une solution **auto-hébergée** pour ne pas transmettre les
  données comptables des clients à un tiers.

#### 3.2.2 C7 — Benchmark de services d'IA

**Besoin reformulé :** à partir d'un libellé de transaction (court, parfois en
anglais), proposer le **compte comptable** avec un indice de confiance, en restant
**conforme RGPD** et **économe**.

**Solutions étudiées :**

| Solution | Avantages | Inconvénients |
|---|---|---|
| **A. Modèle maison** (TF-IDF + régression logistique) — *retenu* | auto-hébergé (RGPD), interprétable, coût ~0, rapide, réentraînable | jeu de données à constituer |
| **B. LLM via API** (GPT / Claude) | puissant en zéro-shot, pas de dataset | données envoyées à un tiers, coût par appel, non déterministe |
| **C. SaaS comptable / OCR** (Dext, Pennylane, Rossum) | clé en main, OCR inclus | boîte noire, abonnement, peu de contrôle/monitorage |

**Grille de décision pondérée** (critères les plus lourds : RGPD, coût, contrôle,
sobriété) : la **solution A** l'emporte. Le **LLM** reste une piste d'amélioration
en **repli** sur les libellés très ambigus ; les **SaaS** répondent à un autre
besoin (OCR de factures) et restent incompatibles avec l'exigence de monitorage du
titre. *(Détail des raisons d'écarter chaque service dans
`docs/DP-E2-veille-benchmark.md`.)*

> Démarche **éco-responsable** : un modèle de quelques kilo-octets, entraîné en ~1
> seconde sur CPU, sans GPU ni appel cloud — empreinte minime face à un grand
> modèle de langage.

#### 3.2.3 C8 — Paramétrer le service d'IA

Le modèle retenu est **intégré comme service interne** de l'application :

- **Installation / dépendances** : `scikit-learn`, `joblib`, `numpy` ajoutés aux
  dépendances ; **entraînement packagé au build Docker**.
- **Configuration** par variables d'environnement (sans toucher au code) :
  `AI_REVIEW_THRESHOLD` (seuil de revue), `AI_MODEL_PATH` / `AI_ARTIFACTS_DIR`.
- **Gestion des accès** : monitorage et réentraînement **réservés à
  l'administrateur**.
- **Monitorage** disponible (tableau de bord — cf. E3).
- **Intégration au SI** : exposé en **API REST** (`/api/ai/*`), consommable par le
  front et réutilisable par n8n.

**Livrable E2 :** rapport professionnel individuel (veille, benchmark, mise en
place et configuration du service).

---

### 3.3 E3 — API du modèle, intégration, monitorage, tests, CI/CD (C9-C13)

C'est le **cœur du projet d'intelligence artificielle**.

#### 3.3.1 Problème adressé

Chaque composante d'une transaction e-commerce (commission, port, taxe,
affiliation, remboursement, ajustement…) doit être imputée au **bon compte
comptable Quadra**. Le mapping par **règles fixes** atteint vite ses limites : la
feuille détaillée d'un relevé TikTok compte **62 colonnes**, avec des libellés
quasi-libres, et de nouveaux types de frais (ou une autre plateforme) apparaissent
régulièrement. J'ai donc développé un **modèle de classification** qui apprend à
associer un **libellé** à un **compte**, et **généralise** aux libellés inédits.

#### 3.3.2 Construction du jeu de données (weak supervision)

Les relevés ne fournissent pas d'étiquette « compte comptable ». Je l'ai donc
**dérivée** par **weak supervision** (`ai/dataset.py`) :

- un **vocabulaire métier** par catégorie, tiré des **libellés réels** des
  colonnes du relevé, complété de leurs **équivalents Shopify** et de formulations
  **françaises et anglaises** (un cabinet français saisit en français, les relevés
  sont en anglais) ;
- une **augmentation** réaliste : préfixes de plateforme, variations de casse,
  ponctuation parasite, fautes de frappe légères ;
- un procédé **déterministe** (graine fixe) : le jeu de données — et donc le
  modèle — sont **reproductibles**, condition d'un pipeline sérieux.

Chaque exemple est étiqueté par une des **8 catégories** cibles, alignées sur le
plan comptable utilisé par le journal Quadra (Ventes, Port, Commission, Publicité &
affiliation, Services, Taxes, Remboursements, Ajustement).

#### 3.3.3 Le modèle et son évaluation

- **Pipeline** : vectorisation **TF-IDF** combinant n-grammes de **mots** et de
  **caractères** (robuste aux libellés courts et aux fautes) → **régression
  logistique** multinomiale (`ai/train.py`). Choix justifié par le benchmark :
  léger, interprétable, rapide.
- **Évaluation honnête** : j'utilise un **split par groupe** — toutes les variantes
  augmentées d'un même libellé restent du même côté — de sorte que le test ne
  contient que des libellés dont **aucune variante n'a été vue** à l'entraînement.
  J'ajoute un **jeu de holdout** de libellés **rédigés à la main**, absents du
  vocabulaire d'entraînement, pour mesurer la vraie généralisation.

**Résultats mesurés** : accuracy **0,77**, F1 macro **0,79**, exactitude sur
libellés inédits **0,81**. Matrice de confusion (lignes = réel, colonnes =
prédit) :

| réel \ prédit | Vent | Port | Comm | Pub | Serv | Tax | Remb | Ajus |
|---|---|---|---|---|---|---|---|---|
| **Ventes** | 33 | 0 | 0 | 0 | 0 | 0 | 7 | 1 |
| **Port** | 0 | 24 | 1 | 0 | 7 | 0 | 0 | 0 |
| **Commission** | 0 | 0 | 22 | 0 | 0 | 0 | 0 | 0 |
| **Publicité** | 1 | 0 | 0 | 28 | 0 | 0 | 0 | 0 |
| **Services** | 0 | 6 | 0 | 19 | 15 | 0 | 0 | 0 |
| **Taxes** | 0 | 0 | 0 | 0 | 0 | 8 | 0 | 0 |
| **Remboursement** | 0 | 6 | 0 | 0 | 0 | 0 | 35 | 0 |
| **Ajustement** | 10 | 0 | 1 | 0 | 0 | 0 | 1 | 41 |

> Lecture : la diagonale (bonnes prédictions) domine. Les confusions résiduelles
> sont **interprétables** (« Services » parfois confondu avec « Publicité », car
> les libellés se ressemblent) — d'où l'intérêt du **seuil de revue** qui renvoie
> ces cas au comptable plutôt que de risquer une mauvaise imputation. Un score
> parfait, ici, trahirait au contraire une fuite de données.

- **Inférence** (`ai/model.py`) : renvoie le compte prédit, le **score de
  confiance**, un drapeau **« à revoir »** quand la confiance passe sous le seuil,
  et des **alternatives**. Face à un libellé inconnu, le modèle **signale** (faible
  confiance) au lieu d'inventer.

#### 3.3.4 C9 — API REST exposant le modèle

Le routeur `/api/ai` (`ai/api.py`) expose `categorize`, `categorize-batch`,
`feedback`, `categories`, documenté en **OpenAPI**. La **sécurité** suit l'**OWASP
API Security Top 10** : authentification obligatoire (API1), **bornage des
entrées** (taille des libellés, taille des lots — API4), erreurs propres
(401/422/503 plutôt que 500).

#### 3.3.5 C10 — Intégration dans l'application

L'écran **« Catégorisation IA »** (React) permet de saisir des libellés (un par
ligne) et affiche pour chacun le **compte proposé**, une **barre de confiance**, un
état (« Auto » / « À revoir »), et un menu de **correction**.

![Écran Catégorisation IA : prédictions, score de confiance et colonne de correction](images/e3-categorisation-ia.png)
*Figure 1 — Écran « Catégorisation IA » : pour chaque libellé, le compte Quadra
proposé, le score de confiance et la possibilité de corriger.*

#### 3.3.6 C11 — Monitorer le modèle

Un **tableau de bord « Monitorage IA »** (réservé à l'administrateur) restitue les
métriques de surveillance : **volume** de prédictions, **confiance moyenne**,
**taux de revue**, **histogramme** de confiance, **dérive** (confiance moyenne par
jour), et nombre de corrections reçues. Chaque prédiction servie est **journalisée**
(`ai/store.py`), ce qui alimente ces métriques en continu. C'est le « vecteur de
restitution des métriques » attendu par le référentiel.

![Tableau de bord Monitorage IA : KPI, histogramme de confiance, répartition par catégorie](images/e3-monitorage-ia.png)
*Figure 2 — Tableau de bord « Monitorage IA » : volume, confiance moyenne, taux de
revue, distribution de la confiance et répartition par compte.*

#### 3.3.7 C12 — Tests automatisés du modèle

J'ai écrit **19 tests** dédiés à l'IA (`tests/test_ai_model.py`,
`tests/test_ai_api.py`) couvrant : la **reproductibilité** du jeu de données, un
**plancher de généralisation** (le holdout doit dépasser un seuil), le **contrat
d'inférence**, le déclenchement de la **revue** sur faible confiance,
l'**authentification** et la **validation** des entrées de l'API, le
**cloisonnement administrateur**, et le **réentraînement**. La suite backend
complète compte **121 tests**, tous verts.

#### 3.3.8 C13 — Chaîne de livraison continue du modèle (MLOps)

- **Boucle de feedback** : les corrections du comptable sont **stockées** puis
  **réinjectées au réentraînement** (`/api/ai/retrain`), avec **rechargement à
  chaud** du modèle servi. J'ai mesuré l'effet : une correction pertinente a fait
  **progresser** l'exactitude sur libellés inédits (de 0,875 à 0,9375).
- **Packaging reproductible** : le modèle est **entraîné au build de l'image
  Docker** (`RUN python -m ai.train`), de sorte que l'image embarque un artefact
  versionné et reconstructible à l'identique.
- **CI/CD** : le pipeline GitHub Actions comporte une étape **« Modèle IA »** qui
  entraîne le modèle et **vérifie un seuil de qualité** (le holdout doit rester ≥
  0,75), bloquant toute régression avant livraison.

![Réentraînement du modèle sur le feedback depuis le tableau de bord](images/e3-reentrainement.png)
*Figure 3 — Réentraînement du modèle sur les corrections, déclenché depuis le
tableau de bord ; les nouvelles métriques sont affichées après l'opération.*

**Livrable E3 :** rapport + démonstration (API du modèle, application enrichie par
l'API, chaîne de livraison continue du modèle).

---

### 3.4 E4 — Application intégrant un service d'IA (C14-C19)

#### 3.4.1 C14 — Analyse du besoin

Le besoin a été formalisé sous forme de **user stories** (détail dans
`docs/DP-E4-userstories-methode.md`). Exemples :

| En tant que | Je veux | Afin de |
|---|---|---|
| comptable | importer un relevé et obtenir un journal Quadra | gagner du temps |
| comptable | voir un score de fiabilité et les anomalies | contrôler avant import |
| comptable | que l'IA propose le compte de chaque ligne | accélérer la ventilation |
| comptable | corriger une prédiction | améliorer le modèle |
| administrateur | monitorer le modèle | piloter la qualité |
| administrateur | attribuer des clients aux comptables | cloisonner l'accès |

Des **objectifs d'accessibilité** (contrastes, libellés de formulaire, navigation
clavier — standard RGAA/WCAG) ont été intégrés aux critères. [À COMPLÉTER : audit
d'accessibilité réalisé.]

#### 3.4.2 C15 — Cadre technique

Architecture **n-tiers** : présentation (React), traitement (FastAPI), données
(SQLite), orchestration (n8n), le tout conteneurisé (Docker) et déployé sur VPS.
Les choix sont justifiés par la **maîtrise du RGPD** (auto-hébergement), la
**simplicité d'exploitation** et le **coût**.

#### 3.4.3 C16 — Coordination / méthode

**Git / GitHub**, flux **trunk-based** (une branche par fonctionnalité, fusion
rapide sur `main`), **intégration et livraison continues** à chaque push,
livraison par **incréments** vérifiés en production. [À COMPLÉTER : outils/rituels
de l'entreprise s'il y en a — Jira, Trello, daily…]

#### 3.4.4 C17 — Composants techniques et interfaces

- **Interfaces** : connexion, traitement des relevés, gestion des clients,
  **catégorisation IA**, **monitorage**, administration des utilisateurs.
- **Composants métier** : calcul de la **TVA** (décomposition HT/TVA), et surtout
  la **génération du journal Quadra** en **partie double équilibrée**
  (`journal.py`) — chaque jour produit une écriture où Débit = Crédit, avec
  absorption des écarts d'arrondi et ligne d'ajustement explicite si nécessaire.
- **Gestion des droits** : rôles administrateur / comptable, **attribution** des
  clients aux comptables, filtrage des données par utilisateur.
- **Sécurité** : cookie **httpOnly + Secure**, JWT, politique de mot de passe,
  recommandations **OWASP**.

> 🖼️ **[CAPTURE À INSÉRER]** — *Figure E4.1 — Vue d'ensemble de l'application
> (navigation + une page).* (Fichier `docs/images/e4-application.png`.)

#### 3.4.5 C18 — Tests automatisés du code source

Tests **backend (pytest)** et **end-to-end (Playwright)**, exécutés en
**intégration continue** à chaque push/PR. Le pipeline CI est **multi-étapes** :
détection des changements, lint, tests backend, entraînement/évaluation du modèle,
build frontend, tests e2e, builds Docker, puis récapitulatif.

#### 3.4.6 C19 — Livraison continue

Le workflow `deploy.yml` enchaîne : **gate de tests** (le déploiement n'a lieu que
si les tests passent) → **rsync** du code vers le VPS → `docker compose up --build`
→ **healthcheck** automatique. Le déploiement est donc **automatique,
reproductible et sécurisé**.

> 🖼️ **[CAPTURE À INSÉRER]** — *Figure E4.2 — Graphe du pipeline CI multi-étapes
> (GitHub → Actions → un run « CI »).* (Fichier `docs/images/e4-pipeline-ci.png`.)
> C'est la meilleure preuve combinée de C18, C19 et C13.

**Livrable E4 :** rapport + démonstration de l'application complète.

---

### 3.5 E5 — Monitorage applicatif et résolution d'incident (C20-C21)

#### 3.5.1 C20 — Surveiller l'application

Le dispositif de surveillance combine plusieurs niveaux : **CI** (tests à chaque
push), **Sentry** (remontée des erreurs runtime), **Uptime Kuma** (disponibilité),
**journalisation** applicative (`observability.py`), et la **boucle de feedback**
du modèle. Des **alertes** (e-mail/push) sont configurées sur les indicateurs
clés.

> 🖼️ **[CAPTURE À INSÉRER]** — *Figure E5.1 — Tableau de bord de monitoring
> applicatif (Uptime Kuma ou Sentry).* (Fichier `docs/images/e5-monitoring.png`.)

#### 3.5.2 C21 — Résolution d'un incident technique

**Incident réel** survenu pendant le développement (détail dans
`docs/DP-E5-incident.md`) :

- **Symptôme :** après la refonte de la page de connexion, **3 tests end-to-end**
  d'authentification ont échoué — détectés par la **CI**.
- **Périmètre :** les **tests** uniquement ; l'application en production
  fonctionnait. Il s'agissait donc d'une **régression de la couverture de tests**,
  pas d'une panne utilisateur (distinction importante à expliquer).
- **Diagnostic :** reproduit en local (`npx playwright test`). Les **sélecteurs**
  des tests pointaient sur des libellés **modifiés** par la refonte (titre
  « Connexion » → « Bon retour ! », politique de mot de passe passée de 8 à 12
  caractères). Le code applicatif était correct.
- **Résolution :** mise à jour des sélecteurs dans `auth.spec.ts`.
- **Vérification :** **6/6 tests au vert**, correctif **versionné** et **rejoué en
  CI**. J'ai de plus **ajouté le job E2E au pipeline** pour prévenir toute
  récidive — une action corrective de fond.

> 🖼️ **[CAPTURE À INSÉRER]** — *Figure E5.2 — Tests e2e au vert (6/6) après
> correctif.* (Fichier `docs/images/e5-e2e-verts.png`.)

**Enseignement :** des tests reposant sur des libellés visibles sont fragiles aux
refontes ; piste d'amélioration = des attributs stables (`data-testid`) pour
découpler les tests de la présentation.

**Livrable E5 :** documentation du monitorage et de la résolution de l'incident.

---

## 4. Conclusion

> *(À reformuler et personnaliser — cette section reflète ton recul.)*

### 4.1 L'entreprise et ses perspectives
Fingec dispose désormais d'un **outil d'automatisation déployé en production** qui
réduit sensiblement le temps de saisie comptable e-commerce. [À COMPLÉTER : impact
constaté, retours de l'équipe.]

### 4.2 Le service et ses évolutions
Pistes d'évolution : un **LLM en repli** sur les libellés ambigus, l'**OCR de
factures** (façon Dext) pour élargir les sources, l'**import direct dans Quadra**,
et l'extension à de **nouvelles plateformes**. Le réentraînement périodique sur le
feedback améliorera continuellement la précision.

### 4.3 Apports professionnels et personnels
[À COMPLÉTER : ce que tu as appris — concevoir une IA appliquée de bout en bout,
le MLOps, la mise en production, la rigueur des tests et de la CI/CD, le travail en
contexte métier comptable, etc.]

---

## 5. Annexes

- **Figure 2.1** — Schéma d'architecture du SI *(à dessiner)*.
- **MCD / MPD Merise** (cf. `DP-modele-donnees-merise.md`).
- **Figures 1 à 3** (intégrées dans E3) — Catégorisation IA, Monitorage IA,
  Réentraînement (fichiers `docs/images/`).
- **Matrice de confusion** du modèle + `metrics.json`.
- **Extraits de code** : modèle (`ai/train.py`, `ai/model.py`), API (`ai/api.py`),
  scraping (`scraper.py`), journal Quadra (`journal.py`).
- **Liens** : dépôt GitHub, application `app.fingec.fr`.
- Captures à ajouter : Traitement, OpenAPI, application, pipeline CI, monitoring,
  tests e2e (cf. emplacements `🖼️ [CAPTURE À INSÉRER]`).

---

## 6. Attestation de non-plagiat

*(À placer en dernière page — modèle officiel : `wiki/assets/EPSI - DEVIADS
Attestation de Non-plagiat EPSI.docx`.)*

« Je soussigné **BILE Kouamé Johan Paul-Marie** atteste que ce dossier est le fruit
de mon travail personnel… » [À COMPLÉTER, daté et signé.]

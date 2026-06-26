# DP — Épreuve E2 : Veille, benchmark et paramétrage d'un service d'IA (C6, C7, C8)

> ⚠️ **Brouillon de travail** : matière à **reformuler avec tes propres mots**
> (le dossier passe l'anti-plagiat ET un détecteur d'IA). Ce document fournit la
> structure, les arguments et les faits — pas le texte final à coller.

---

## C6 — Veille technique et réglementaire

**Thématique retenue :** la catégorisation automatique d'écritures comptables par
apprentissage automatique, et son cadre réglementaire (données personnelles +
IA).

**Organisation de la veille (à présenter comme une routine) :**
- **Rythme** : un créneau hebdomadaire (≈ 1 h), le vendredi.
- **Outils d'agrégation** : un lecteur RSS (ex. Feedly/Inoreader), des
  newsletters spécialisées, et une liste de dépôts GitHub suivis.
- **Outils de partage / capitalisation** : un espace de notes (le wiki Obsidian
  du projet) où chaque synthèse est consignée.

**Sources suivies (qualifiées : auteur identifié, notoriété, fraîcheur) :**

| Axe | Sources |
|---|---|
| ML / NLP | documentation **scikit-learn**, blog **Hugging Face**, *Papers with Code* (text classification) |
| MLOps | **MLflow**, **DVC**, *Made With ML*, *Google MLOps guides* |
| Réglementaire | **CNIL** (IA & RGPD), **AI Act** (règlement UE 2024/1689), *EDPB* |
| Métier comptable | éditeurs (**Pennylane**, **Dext**, **Cegid**), presse comptable |

**Exemples de synthèses (à dater et rédiger) :**
1. *AI Act* : les systèmes d'aide à la catégorisation comptable relèvent du
   risque **limité/minimal** (pas d'usage « à haut risque » au sens de l'annexe
   III) → obligations de **transparence** : informer l'utilisateur qu'une IA
   propose, et garder un **humain dans la boucle** (ce que fait déjà le seuil de
   revue de Fingec).
2. *RGPD* : les libellés de transaction peuvent contenir des données
   personnelles → **minimisation** (on n'entraîne que sur des libellés de
   nature, pas sur des données nominatives) et **conservation** maîtrisée.
3. *Technique* : choix d'un modèle **léger et interprétable** (TF-IDF +
   régression logistique) plutôt qu'un grand modèle, justifié plus bas.

**Lien avec le projet :** la veille a directement orienté deux décisions —
l'architecture du modèle (léger/local pour le RGPD) et le **garde-fou humain**
(conformité AI Act).

---

## C7 — Benchmark de services d'IA

**Expression de besoin reformulée :** à partir d'un libellé de transaction
(souvent court, parfois en anglais), proposer automatiquement le **compte
comptable** adéquat, avec un indice de confiance, pour réduire la saisie
manuelle — tout en restant **conforme au RGPD** (données comptables clients) et
**économe** (cabinet, pas de gros budget cloud).

**Solutions étudiées :**

| Solution | Principe | Avantages | Inconvénients |
|---|---|---|---|
| **A. Modèle maison** (TF-IDF + régression logistique, scikit-learn) — *retenu* | Classifieur entraîné en interne | Auto-hébergé (RGPD ✅), **interprétable**, ~0 € de coût marginal, **rapide** (<10 ms), réentraînable sur le feedback | Demande de construire le jeu de données ; précision plafonnée par la donnée |
| **B. LLM via API** (OpenAI GPT / Anthropic Claude) | Prompt « classe ce libellé » | Très bon en zéro-shot, pas de dataset | **Données envoyées à un tiers** (RGPD ⚠️), **coût par appel**, latence réseau, **non déterministe**, dépendance externe |
| **C. Service comptable/OCR** (Dext, Pennylane, Rossum) | SaaS spécialisé facture→compta | Clé en main, OCR inclus | **Coût d'abonnement**, **boîte noire** (peu de contrôle/monitorage), périmètre figé, intégration limitée à notre flux TikTok/Shopify |

**Grille de décision (pondérée) :**

| Critère | Poids | A. Maison | B. LLM API | C. SaaS |
|---|---|---|---|---|
| Conformité RGPD / hébergement | ⭐⭐⭐ | ✅ | ⚠️ | ⚠️ |
| Coût | ⭐⭐⭐ | ✅ | ❌ | ❌ |
| Interprétabilité / contrôle | ⭐⭐ | ✅ | ⚠️ | ❌ |
| Éco-responsabilité (sobriété) | ⭐⭐ | ✅ | ❌ (gros modèle) | ~ |
| Effort de mise en œuvre | ⭐ | ⚠️ | ✅ | ✅ |
| Adéquation au flux TikTok/Shopify | ⭐⭐ | ✅ | ✅ | ⚠️ |

**Conclusion / préconisation :** le **modèle maison (A)** est retenu. Il maximise
les critères les plus lourds (RGPD, coût, contrôle, sobriété). Un LLM (B) reste
une **piste d'amélioration** pour les libellés très ambigus (en repli, derrière
le seuil de revue), mais son coût et l'envoi de données à un tiers l'écartent en
première intention. Les SaaS (C) couvrent un autre besoin (OCR de factures) et
restent une **boîte noire** incompatible avec l'exigence de monitorage du titre.

> Démarche éco-responsable : un modèle de **quelques Ko**, entraîné en ~1 s sur
> CPU, sans GPU ni appel cloud — empreinte minime face à un LLM de plusieurs
> milliards de paramètres.

---

## C8 — Paramétrer le service d'IA

Le modèle retenu est **intégré comme un service interne** de l'application :

- **Installation / dépendances** : `scikit-learn`, `joblib` (ajoutés à
  `requirements.txt`), entraînement **packagé au build Docker**
  (`RUN python -m ai.train`).
- **Configuration** (sans toucher au code, par variables d'environnement) :
  - `AI_REVIEW_THRESHOLD` — seuil de confiance déclenchant la revue humaine ;
  - `AI_MODEL_PATH` / `AI_ARTIFACTS_DIR` — emplacement de l'artefact.
- **Accès / droits** : API derrière l'authentification ; **monitorage et
  réentraînement réservés à l'admin**.
- **Monitorage du service** : tableau de bord dédié (volume, confiance, taux de
  revue, dérive) — cf. E3.
- **Intégration au SI** : exposé en **API REST** (`/api/ai/*`), consommé par le
  front et réutilisable par n8n.

> En clair : le « service d'IA » n'est pas un SaaS externe paramétré, mais **un
> service que j'ai déployé et configuré moi-même** dans l'infrastructure Fingec
> (Docker/VPS) — à articuler ainsi en soutenance.

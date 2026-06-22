---
type: system
tags: [fingec, automatisation-comptable, metier, comptabilite, quadra, journal]
updated: 2026-06-22
status: stable
---

# 14 — Journal d'écritures Quadra (TikTok)

Génère le **livrable final** : un **journal d'écritures comptables en partie double** (format Cegid Quadra), prêt à importer. Remplace, en tant que sortie principale, le simple tableau de synthèse de [[13 - Traitement comptable (Quadra)]]. Module : `backend/journal.py`. Calqué sur le modèle fourni par le cabinet client : `MODELE JNL TIKTOK FRANCE.xlsx` (déposé dans `~/Downloads`, non versionné).

> [!important] Pourquoi c'est différent de la synthèse
> [[13 - Traitement comptable (Quadra)]] produit **1 ligne agrégée par jour** (`date, sales_ht, vat, fees, shipping, total_settlement`). Quadra attend **plusieurs lignes comptables par jour** réparties sur des comptes, avec **Débit = Crédit**. C'est cette transformation que fait `journal.py`. La synthèse reste téléchargeable comme **vue de contrôle qualité**.

## Le mapping (régime France) — vérifié au centime

Pour **chaque jour**, une écriture équilibrée du journal **`VTE`**, libellé **« F TIKTOK - FRANCE »** :

| Compte | Sens | Montant | Signification |
|---|---|---|---|
| **90TIKTFR** | Débit | `total_settlement` | encaissement net reçu de TikTok |
| **62220000** | Débit | `fees` HT (en positif) | commission TikTok (charge) |
| **44566000** | Débit | TVA sur commission | TVA déductible |
| **70721000** | Crédit | `net_sales` HT | ventes HT |
| **70800000** | Crédit | `shipping` HT | port / frais de port |
| **44572000** | Crédit | TVA sur (ventes + port) | TVA collectée |

> [!note] Calcul de la TVA = TTC − HT (et non HT × 20 %)
> Chaque TVA est l'**écart entre le TTC et le HT arrondis** (`tva = round(ttc - round(ttc/1.2, 2), 2)`). C'est ce qui fait **tomber l'écriture juste au centime** : comme dans les données `total_settlement = net_sales + shipping + fees` (frais négatifs), l'écriture s'équilibre par construction.

**Exemple vérifié — 31/08/2025** (TTC : net_sales 139,90 / shipping 2,92 / fees −7,00 / settlement 135,82) :
- Débit : 90TIKTFR **135,82** + 62220000 **5,83** + 44566000 **1,17** = **142,82**
- Crédit : 70721000 **116,58** + 70800000 **2,43** + 44572000 **23,81** = **142,82** ✓

Vérif d'ensemble sur le vrai fichier `TikTok Juilet_Aout 2025.xlsx` : **176 lignes, Débit = Crédit = 13 628,18 €**. Sur `TikTok NOV_DEC 2025.xlsx` : **250 lignes, 32 683,99 €** (preuve que la sortie **varie bien** selon le fichier).

## Régime hors France (export)
- **Pas de TVA** : comptes `44572000`/`44566000` absents ; ventes & port crédités/débités en TTC = HT.
- Libellé **« F TIKTOK - EXPORT »** + **note d'avertissement** automatique.
- ⚠️ Comptes export **repris de la France par défaut** (pas de modèle dédié fourni) → **à confirmer** avec le plan comptable (compte de ventes export éventuellement distinct, ex. `70722000`).

## Équilibrage & ajustements
- **Arrondi ≤ 0,02 €** : absorbé silencieusement sur la TVA collectée (`ROUND_TOLERANCE`).
- **Écart plus grand** (présence d'`adjustments`, relevé incohérent) : une **ligne d'ajustement explicite** est ajoutée sur un **compte d'attente `471000`** + une **note**.
  > [!tip] Pourquoi un compte d'attente (classe 47)
  > Un ajustement non rapproché est, par définition, un montant qu'on ne sait pas encore qualifier. Le parquer en **47x** force un **reclassement manuel** par le comptable et **ne fausse ni le résultat ni la TVA** (≠ le fondre dans les ventes/charges). Sur les fichiers réels du cabinet, ce cas ne se déclenche jamais.
- Montant négatif sur une ligne → **bascule automatique** Débit ↔ Crédit (jours de remboursement net).

## Configuration des comptes — « faire varier sans halluciner »
- Tout le mapping vit dans `JOURNAL_CONFIG` (clé `(plateforme, régime)`), **modifiable**.
- **Surcharge sans toucher au code** : créer `backend/journal_config.json` (ou pointer l'env **`JOURNAL_CONFIG_FILE`** vers un JSON). Deep-merge sur les défauts ; on peut ne redéfinir **qu'un seul compte**. Modèle : `backend/journal_config.example.json`. Clé JSON = `"plateforme|régime"` (ex. `"tiktok|france"`).

## Intégration `/process`
- `POST /process` ([[10 - Backend FastAPI]]) génère, **en plus** de `output_<stem>.xlsx` (synthèse), le fichier **`journal_<stem>.xlsx`**.
- **Détection de plateforme** : `.csv` ⇒ **Shopify** → journal **non généré** (modèle de sortie pas encore défini, message explicite) ; Excel ⇒ **TikTok**.
- Réponse enrichie : `journal`, `journal_preview` (lignes), `journal_balance` (`debit/credit/balanced/lines`), `journal_notes`. Le log (`logs.json`) reçoit `journal_file`.
- Champ **`entreprise`** (Form, facultatif) → bandeau d'en-tête du fichier (sinon « Journal des ventes »).

## Export `.xlsx` (format épuré)
- Bandeau ligne 1 : `Cegid Quadra Comptabilité — <entreprise> (TIKTOK <pays>)` + « Édité le … ».
- En-têtes (ligne 4) : **Code, Date, Compte, Libellé, Débit, Crédit**. Date `jj/mm/aaaa`, montants `#,##0.00`. Calqué sur la feuille `Sheet1 (3)` du modèle.

## Côté frontend
- `UploadForm` : champ **« Société / dossier »** (facultatif) en plus de Pays. [[20 - Frontend - structure & pages]].
- `ValidationReport` : bouton principal **« Journal Quadra »** (livrable) + **« Synthèse (.xlsx) »** (contrôle) + **« Exporter PDF »** ; **badge d'équilibre** (« ✓ Écriture équilibrée · N lignes · Débit = Crédit ») et affichage des `journal_notes`.

## Tests
- `backend/tests/test_journal.py` (**9 tests**) : mapping France au centime, équilibre, hors-France sans TVA, agrégation multi-jours, ajustement → compte d'attente + note, montant négatif (bascule), écriture du `.xlsx`, plateforme inconnue (erreur), **surcharge par config externe**.

## Reste à faire
- ⬜ Modèle de sortie **Shopify** (CSV) → générateur dédié.
- ⬜ Confirmer les **comptes export** (hors France).
- ⬜ Compte d'**ajustement** définitif (471000 par défaut).
- ⬜ Bandeau **entreprise** : aujourd'hui saisi à la main (l'app ne connaît pas le dossier client à l'upload).

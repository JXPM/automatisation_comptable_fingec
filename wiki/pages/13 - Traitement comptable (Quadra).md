---
type: system
tags: [fingec, automatisation-comptable, metier, tva]
updated: 2026-06-17
---

# 13 — Traitement comptable (TikTok/Shopify → Quadra)

Cœur métier historique. `backend/processor.py`, exposé par `POST /process` ([[10 - Backend FastAPI]]) et par `backend/cli.py`.

## Pipeline
```
load_file → clean_data → compute_vat → build_output → detect_anomalies → validate
```

### 1. `load_file`
- **CSV** (Shopify) lu tel quel ; **Excel** (TikTok) → uniquement la feuille **`Statement`/`Statements`** (les autres ignorées). Erreur si feuille absente ou fichier vide.

### 2. `clean_data`
- Normalise les noms de colonnes (minuscule, `_`). Colonnes **obligatoires** : `statement_date`, `total_settlement_amount`.
- Garde `KEEP_COLUMNS` = `statement_date, total_settlement_amount, net_sales, shipping, fees, adjustments`. `statement_date` → `date`. Conversion numérique (`coerce`), drop des lignes 100 % vides.

### 3. `compute_vat` — règle TVA
| Pays | Transformation (sur `net_sales`, `fees`, `shipping`, `adjustments`) |
|---|---|
| **France** | `HT = montant / 1.20` puis `TVA = HT × 0.20` (`VAT_RATE = 0.20`) |
| **Non-France** | `HT = montant`, `TVA = 0` |

### 4. `build_output` — colonnes finales
`date, sales_ht, vat, fees, shipping, adjustments, total_settlement`.
- `vat` = somme des TVA de `net_sales + fees + shipping + adjustments`. Arrondi 2 décimales. Export `.xlsx` (openpyxl) prêt **Quadra**.

### 5. `detect_anomalies` — 8 contrôles
| # | Code | Sévérité | Détecte |
|---|---|---|---|
| 1 | `MISSING_VALUE` | error | valeur manquante par colonne |
| 2 | `NEGATIVE_SALES` | error | `net_sales < 0` (remboursements ?) |
| 3 | `NEGATIVE_FEES/SHIPPING` | warning | frais/port négatifs |
| 4 | `TOTAL_MISMATCH` | error | `total_settlement` ≠ `net_sales + adjustments − fees − shipping` (tolérance **5 %**) |
| 5 | `VAT_INCOHERENCE` | warning | ratio TVA/HT ≠ 20 % (France, tol. 2 pts) |
| 6 | `OUTLIER` | warning | montant aberrant (MAD/z-score robuste, fallback std) |
| 7 | `DUPLICATE` | warning | même date + même total |
| 8 | `FUTURE_DATE` | info | date postérieure à aujourd'hui |

### 6. `validate` — score de fiabilité
- `reliability_score = 100 − 15×erreurs − 5×warnings` (plancher 0). Renvoie aussi `rows`, `missing_values`, `anomaly_count`, `errors`, `warnings`.

## Côté frontend
- Page **Traitement** (`UploadForm` + `ResultTable` + `ValidationReport` + `AnomalyConsole`) : upload, choix du pays, aperçu, rapport d'anomalies, score, téléchargement. [[20 - Frontend - structure & pages]].

## CLI
- `python cli.py input.xlsx --country France --output output.xlsx`.

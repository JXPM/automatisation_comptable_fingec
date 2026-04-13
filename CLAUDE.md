# 📊 Automatisation Comptable - TikTok / Shopify

## 🧠 Overview

Ce projet automatise la préparation des écritures comptables à partir de fichiers fournis par des plateformes e-commerce (TikTok, Shopify).

L’objectif est de transformer les données brutes en un format propre, standardisé et prêt à être importé dans Quadra.

---

## 📥 Input

- Formats de fichiers :
  - CSV (Shopify)
  - Excel (TikTok)

- Informations requises :
  - Pays : France / Non-France

---

## 📂 Data Source

- Utiliser uniquement la feuille `Statement` pour les fichiers Excel.
- Ignorer les autres feuilles telles que `Order Details`, `Reports`, `Payments`, etc.

---

## 🧹 Data Cleaning

### Colonnes à supprimer
- `statement_id`
- `payment_id`
- `status`
- `tip`
- autres colonnes non pertinentes

### Colonnes à conserver
- `date`
- `total_settlement_amount`
- `net_sales`
- `fees`
- `shipping`

---

## 🇫🇷 VAT Logic (France)

Si le pays est France :

Pour chaque ligne, calculer :

- HT = montant TTC / 1.20
- TVA = HT × 0.20

Appliquer cette règle aux montants :
- `net_sales`
- `fees`
- `shipping`

---

## 🌍 Non-France Logic

Si le pays est Non-France :

- Aucune transformation de TVA
- Utiliser les valeurs telles quelles

---

## 📊 Output Structure

Le tableau final doit contenir :

- `date`
- `sales_ht`
- `vat`
- `fees`
- `shipping`
- `total_settlement`

---

## 🔍 Validation

- Vérifier l’absence de valeurs manquantes
- Détecter les anomalies (valeurs négatives, conflits de totaux)
- Calculer un score de fiabilité (%) basé sur la qualité des données et la cohérence

---

## 📤 Output

- Fichier Excel final (`.xlsx`)
- Prêt à importer dans Quadra

---

## 🛠️ Tech Stack

- Python
- pandas
- openpyxl
- FastAPI (optionnel pour une interface web)

---

## 🚀 Future Improvements

- Détection automatique du pays
- Intégration Dext API
- Import direct dans Quadra
 - Interface web plus complète (FastAPI + React)
- Tableaux de bord de contrôle qualité

---

## 📌 Notes

Cet outil vise à réduire la saisie manuelle, diminuer les erreurs et rendre le processus de préparation comptable scalable.

La structure peut évoluer vers une application SaaS dédiée à l’automatisation comptable pour e-commerce.

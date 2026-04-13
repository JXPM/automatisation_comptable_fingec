# Automatisation Comptable - TikTok / Shopify

Outil de préparation automatique des écritures comptables à partir de fichiers de ventes TikTok et Shopify. Génère un fichier Excel prêt à importer dans Quadra.

## Stack

- **Backend** : Python 3 + FastAPI + pandas + openpyxl
- **Frontend** : React + Vite + TypeScript + Tailwind CSS

## Structure du projet

```
automatisation_comptable_fingec/
├── backend/
│   ├── main.py          # API FastAPI (endpoints /process et /download)
│   ├── processor.py     # Logique métier (chargement, nettoyage, TVA, validation)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   └── components/
│   │       ├── UploadForm.tsx
│   │       ├── ResultTable.tsx
│   │       └── ValidationReport.tsx
│   ├── vite.config.ts   # Proxy vers le backend
│   └── package.json
├── CLAUDE.md            # Documentation technique et règles métier
└── README.md
```

## Installation

### Backend

```bash
cd backend
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Lancement

**Terminal 1 — Backend (port 8000) :**

```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend (port 5173) :**

```bash
cd frontend
npm run dev
```

Puis ouvrir `http://localhost:5173`

## Fonctionnement

1. Uploader un fichier CSV (Shopify) ou Excel (TikTok — feuille `Statement`)
2. Sélectionner le pays : **France** ou **Non-France**
3. Le backend traite les données :
   - Nettoyage et normalisation des colonnes
   - Calcul HT / TVA à 20% si France
   - Vérification de cohérence des totaux
   - Score de fiabilité des données
4. Prévisualisation du tableau et téléchargement du `.xlsx` Quadra

## CLI (alternatif)

```bash
cd backend
python cli.py input_file.xlsx --country France --output output.xlsx
```

## Règles TVA

| Pays       | Transformation             |
|------------|----------------------------|
| France     | montant / 1.20 → HT + TVA  |
| Non-France | valeurs brutes conservées  |

## Output

Fichier Excel avec les colonnes : `date`, `sales_ht`, `vat`, `fees`, `shipping`, `total_settlement`

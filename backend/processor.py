import pandas as pd
import numpy as np
from datetime import date

KEEP_COLUMNS = [
    "statement_date",
    "total_settlement_amount",
    "net_sales",
    "shipping",
    "fees",
    "adjustments",
]

VAT_RATE = 0.20
TOLERANCE = 0.05        # 5% d'écart acceptable sur les totaux
OUTLIER_ZSCORE = 3.0    # seuil z-score pour détecter les valeurs aberrantes


def load_file(path: str) -> pd.DataFrame:
    if path.lower().endswith(".csv"):
        df = pd.read_csv(path)
    else:
        xls = pd.ExcelFile(path)
        sheet = next(
            (s for s in xls.sheet_names if s.strip().lower() in ("statement", "statements")),
            None,
        )
        if sheet is None:
            raise ValueError(
                f"Feuille 'Statement' ou 'Statements' introuvable. "
                f"Feuilles disponibles : {', '.join(xls.sheet_names)}"
            )
        df = pd.read_excel(xls, sheet_name=sheet)

    if df.empty:
        raise ValueError("Le fichier est vide ou ne contient aucune donnée.")

    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    required = {"statement_date", "total_settlement_amount"}
    missing_required = required - set(df.columns)
    if missing_required:
        raise ValueError(
            f"Colonnes obligatoires manquantes : {', '.join(missing_required)}. "
            f"Colonnes trouvées : {', '.join(df.columns.tolist())}"
        )

    cols_to_keep = [c for c in KEEP_COLUMNS if c in df.columns]
    df = df[cols_to_keep]
    df = df.rename(columns={"statement_date": "date"})

    numeric_cols = [c for c in df.columns if c != "date"]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.dropna(how="all")
    df = df.reset_index(drop=True)

    return df


def compute_vat(df: pd.DataFrame, country: str) -> pd.DataFrame:
    df = df.copy()
    country = country.strip().lower()

    for field in ["net_sales", "fees", "shipping", "adjustments"]:
        if field not in df.columns:
            continue
        if country == "france":
            df[f"{field}_ht"] = df[field] / (1 + VAT_RATE)
            df[f"{field}_vat"] = df[f"{field}_ht"] * VAT_RATE
        else:
            df[f"{field}_ht"] = df[field]
            df[f"{field}_vat"] = 0.0

    return df


def build_output(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    dates = pd.to_datetime(df["date"], errors="coerce")

    out = pd.DataFrame()
    out["date"] = dates.dt.date

    numeric = {
        "sales_ht":        df.get("net_sales_ht", pd.Series(0.0, index=df.index)),
        "vat":             (
                               df.get("net_sales_vat",   pd.Series(0.0, index=df.index))
                             + df.get("fees_vat",         pd.Series(0.0, index=df.index))
                             + df.get("shipping_vat",     pd.Series(0.0, index=df.index))
                             + df.get("adjustments_vat",  pd.Series(0.0, index=df.index))
                           ),
        "fees":            df.get("fees_ht",        pd.Series(0.0, index=df.index)),
        "shipping":        df.get("shipping_ht",    pd.Series(0.0, index=df.index)),
        "adjustments":     df.get("adjustments_ht", pd.Series(0.0, index=df.index)),
        "total_settlement":df.get("total_settlement_amount", pd.Series(dtype=float)),
    }

    for col, series in numeric.items():
        out[col] = series.round(2)

    return out


# ─── Détection d'anomalies ────────────────────────────────────────────────────

def _anomaly(severity: str, code: str, message: str, rows: list[int], detail: str = "") -> dict:
    return {
        "severity": severity,   # "error" | "warning" | "info"
        "code": code,
        "message": message,
        "rows": rows,
        "detail": detail,
    }


def detect_anomalies(raw: pd.DataFrame, out: pd.DataFrame, country: str) -> list[dict]:
    """
    raw  : DataFrame après clean_data (colonnes originales renommées)
    out  : DataFrame après build_output (colonnes finales)
    """
    anomalies = []
    is_france = country.strip().lower() == "france"

    # 1. Valeurs manquantes par colonne
    for col in out.columns:
        missing = out[col].isna()
        if missing.any():
            rows = missing[missing].index.tolist()
            anomalies.append(_anomaly(
                "error", "MISSING_VALUE",
                f"Valeur manquante dans « {col} »",
                rows,
                f"{len(rows)} ligne(s) sans valeur."
            ))

    # 2. Ventes nettes négatives (suspect — les remboursements passent par adjustments)
    if "net_sales" in raw.columns:
        neg = raw["net_sales"] < 0
        if neg.any():
            rows = neg[neg].index.tolist()
            anomalies.append(_anomaly(
                "error", "NEGATIVE_SALES",
                "Ventes nettes négatives détectées",
                rows,
                "net_sales < 0 est inhabituel. Vérifier si ce sont des remboursements."
            ))

    # 3. Fees ou shipping négatifs (peuvent être des corrections, à signaler)
    for col in ["fees", "shipping"]:
        if col in raw.columns:
            neg = raw[col] < 0
            if neg.any():
                rows = neg[neg].index.tolist()
                anomalies.append(_anomaly(
                    "warning", f"NEGATIVE_{col.upper()}",
                    f"Valeur négative dans « {col} »",
                    rows,
                    f"Peut indiquer une correction ou un remboursement."
                ))

    # 4. Total settlement ≠ net_sales + adjustments - fees - shipping (par ligne)
    if all(c in raw.columns for c in ["total_settlement_amount", "net_sales"]):
        adj = raw.get("adjustments", pd.Series(0.0, index=raw.index)).fillna(0)
        fees = raw.get("fees", pd.Series(0.0, index=raw.index)).fillna(0)
        ship = raw.get("shipping", pd.Series(0.0, index=raw.index)).fillna(0)
        reconstructed = raw["net_sales"].fillna(0) + adj - fees - ship
        diff = (reconstructed - raw["total_settlement_amount"]).abs()
        denom = raw["total_settlement_amount"].abs().replace(0, np.nan)
        rel = diff / denom
        bad = rel > TOLERANCE
        if bad.any():
            rows = bad[bad].index.tolist()
            anomalies.append(_anomaly(
                "error", "TOTAL_MISMATCH",
                "Total settlement ≠ somme des composantes",
                rows,
                f"{len(rows)} ligne(s) avec écart > {TOLERANCE:.0%} entre total_settlement et net_sales + adjustments − fees − shipping."
            ))

    # 5. TVA incohérente (France uniquement) : vat / base_ht ≠ 20%
    if is_france and "vat" in out.columns and "sales_ht" in out.columns:
        base = out["sales_ht"].fillna(0)
        vat = out["vat"].fillna(0)
        # Éviter division par zéro
        mask = base.abs() > 0.01
        if mask.any():
            ratio = vat[mask] / base[mask]
            bad = (ratio - VAT_RATE).abs() > 0.02   # tolérance 2 pts
            if bad.any():
                rows = bad[bad].index.tolist()
                anomalies.append(_anomaly(
                    "warning", "VAT_INCOHERENCE",
                    "Taux de TVA incohérent",
                    rows,
                    f"Ratio TVA/HT attendu : {VAT_RATE:.0%}. Écart détecté sur {len(rows)} ligne(s)."
                ))

    # 6. Valeurs aberrantes sur net_sales et total_settlement.
    # MAD (median absolute deviation) est robuste: l'outlier ne fausse pas le seuil.
    # Fallback en std de population (ddof=0) quand MAD=0 (ex. 9 valeurs identiques + 1 extrême).
    COL_LABELS = {
        "net_sales": "Ventes nettes",
        "total_settlement_amount": "Total settlement",
    }
    for col in ["net_sales", "total_settlement_amount"]:
        if col not in raw.columns:
            continue
        series = raw[col].dropna()
        if len(series) < 4:
            continue
        median = series.median()
        mad = (series - median).abs().median()
        if np.isfinite(mad) and mad > 0:
            z = 0.6745 * (raw[col] - median).abs() / mad
            bad = z > 3.5
            center = median
        else:
            mean = series.mean()
            std = series.std(ddof=0)
            if not np.isfinite(std) or np.isclose(std, 0):
                continue
            z = (raw[col] - mean).abs() / std
            bad = z >= OUTLIER_ZSCORE
            center = mean
        if bad.any():
            rows = bad[bad & raw[col].notna()].index.tolist()
            if not rows:
                continue
            col_label = COL_LABELS.get(col, col)
            anomalies.append(_anomaly(
                "warning", "OUTLIER",
                f"Montant inhabituel — {col_label}",
                rows,
                f"Montant très éloigné de la valeur centrale ({center:,.2f}) sur la colonne « {col_label} »."
            ))

    # 7. Doublons (même date + même total_settlement_amount)
    if "date" in raw.columns and "total_settlement_amount" in raw.columns:
        dup = raw.duplicated(subset=["date", "total_settlement_amount"], keep=False)
        if dup.any():
            rows = dup[dup].index.tolist()
            anomalies.append(_anomaly(
                "warning", "DUPLICATE",
                "Lignes potentiellement en doublon",
                rows,
                "Même date et même montant total sur plusieurs lignes."
            ))

    # 8. Dates dans le futur
    if "date" in raw.columns:
        dates = pd.to_datetime(raw["date"], errors="coerce")
        today = pd.Timestamp(date.today())
        future = dates > today
        if future.any():
            rows = future[future].index.tolist()
            anomalies.append(_anomaly(
                "info", "FUTURE_DATE",
                "Date dans le futur",
                rows,
                "Ces lignes ont une date postérieure à aujourd'hui."
            ))

    return anomalies


def validate(out: pd.DataFrame, anomalies: list[dict]) -> dict:
    report: dict = {
        "rows": len(out),
        "missing_values": int(out.isna().sum().sum()),
        "anomaly_count": len(anomalies),
        "errors": sum(1 for a in anomalies if a["severity"] == "error"),
        "warnings": sum(1 for a in anomalies if a["severity"] == "warning"),
    }

    reliability = 100
    reliability -= report["errors"] * 15
    reliability -= report["warnings"] * 5
    report["reliability_score"] = max(0, reliability)

    return report

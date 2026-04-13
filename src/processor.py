import pandas as pd

KEEP_COLUMNS = [
    "date",
    "total_settlement_amount",
    "net_sales",
    "fees",
    "shipping",
]

VAT_RATE = 0.20


def load_file(path: str) -> pd.DataFrame:
    if path.lower().endswith(".csv"):
        df = pd.read_csv(path)
    else:
        xls = pd.ExcelFile(path)
        if "Statement" not in xls.sheet_names:
            raise ValueError("La feuille 'Statement' est introuvable dans le fichier Excel.")
        df = pd.read_excel(xls, sheet_name="Statement")
    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    df = df.loc[:, [c for c in KEEP_COLUMNS if c in df.columns]]
    return df


def compute_vat(df: pd.DataFrame, country: str) -> pd.DataFrame:
    df = df.copy()
    country = country.strip().lower()
    if country == "france":
        for field in ["net_sales", "fees", "shipping"]:
            if field in df.columns:
                df[f"{field}_ht"] = df[field] / (1 + VAT_RATE)
                df[f"{field}_vat"] = df[f"{field}_ht"] * VAT_RATE
    else:
        for field in ["net_sales", "fees", "shipping"]:
            if field in df.columns:
                df[f"{field}_ht"] = df[field]
                df[f"{field}_vat"] = 0.0
    return df


def build_output(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["sales_ht"] = df.get("net_sales_ht", pd.Series(dtype=float))
    df["vat"] = df.get("net_sales_vat", 0.0) + df.get("fees_vat", 0.0) + df.get("shipping_vat", 0.0)
    df["fees"] = df.get("fees_ht", 0.0)
    df["shipping"] = df.get("shipping_ht", 0.0)
    df["total_settlement"] = df.get("total_settlement_amount", pd.Series(dtype=float))
    output_columns = ["date", "sales_ht", "vat", "fees", "shipping", "total_settlement"]
    return df.loc[:, [c for c in output_columns if c in df.columns]]


def validate(df: pd.DataFrame) -> dict:
    report = {
        "missing_values": int(df.isna().sum().sum()),
        "negative_values": int((df.select_dtypes(include=["number"]) < 0).sum().sum()),
        "rows": len(df),
    }
    reliability = 100
    if report["missing_values"] > 0:
        reliability -= 20
    if report["negative_values"] > 0:
        reliability -= 20
    report["reliability_score"] = max(0, reliability)
    return report

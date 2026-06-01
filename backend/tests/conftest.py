"""Shared fixtures for backend tests."""
from __future__ import annotations

import sys
from pathlib import Path

# Make `backend/` importable as a package root so tests can `from processor import ...`
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import pandas as pd
import pytest


@pytest.fixture
def sample_clean_df() -> pd.DataFrame:
    """A small clean DataFrame matching the schema after `clean_data`."""
    return pd.DataFrame(
        {
            "date": ["2025-01-01", "2025-01-02", "2025-01-03"],
            "total_settlement_amount": [100.0, 200.0, 300.0],
            "net_sales": [120.0, 240.0, 360.0],
            "shipping": [10.0, 20.0, 30.0],
            "fees": [10.0, 20.0, 30.0],
            "adjustments": [0.0, 0.0, 0.0],
        }
    )


@pytest.fixture
def csv_file(tmp_path: Path, sample_clean_df: pd.DataFrame) -> Path:
    """A valid CSV with the columns expected by `load_file` + `clean_data`."""
    raw = sample_clean_df.rename(columns={"date": "statement_date"}).copy()
    target = tmp_path / "shopify.csv"
    raw.to_csv(target, index=False)
    return target


@pytest.fixture
def excel_file(tmp_path: Path, sample_clean_df: pd.DataFrame) -> Path:
    """A valid Excel file with a `Statement` sheet (TikTok format)."""
    raw = sample_clean_df.rename(columns={"date": "statement_date"}).copy()
    target = tmp_path / "tiktok.xlsx"
    with pd.ExcelWriter(target, engine="openpyxl") as writer:
        raw.to_excel(writer, sheet_name="Statement", index=False)
        # Add an extra sheet that should be ignored
        pd.DataFrame({"x": [1, 2]}).to_excel(writer, sheet_name="Order Details", index=False)
    return target


@pytest.fixture
def excel_no_statement(tmp_path: Path) -> Path:
    """Excel file missing the required `Statement` sheet."""
    target = tmp_path / "no_statement.xlsx"
    with pd.ExcelWriter(target, engine="openpyxl") as writer:
        pd.DataFrame({"x": [1]}).to_excel(writer, sheet_name="Other", index=False)
    return target

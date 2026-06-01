"""Unit tests for `processor.py`.

Covers each pure function — load_file, clean_data, compute_vat, build_output,
detect_anomalies, validate — including each individual anomaly code.
"""
from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from processor import (
    VAT_RATE,
    build_output,
    clean_data,
    compute_vat,
    detect_anomalies,
    load_file,
    validate,
)


# ── load_file ────────────────────────────────────────────────────────────────

class TestLoadFile:
    def test_loads_csv(self, csv_file: Path) -> None:
        df = load_file(str(csv_file))
        assert len(df) == 3
        assert "statement_date" in df.columns

    def test_loads_excel_statement_sheet(self, excel_file: Path) -> None:
        df = load_file(str(excel_file))
        assert len(df) == 3
        assert "statement_date" in df.columns

    def test_excel_picks_statement_sheet_case_insensitive(self, tmp_path: Path) -> None:
        target = tmp_path / "case.xlsx"
        with pd.ExcelWriter(target, engine="openpyxl") as writer:
            pd.DataFrame({"statement_date": ["2025-01-01"], "total_settlement_amount": [10]}).to_excel(
                writer, sheet_name="STATEMENT", index=False,
            )
        df = load_file(str(target))
        assert len(df) == 1

    def test_excel_without_statement_sheet_raises(self, excel_no_statement: Path) -> None:
        with pytest.raises(ValueError, match="Statement"):
            load_file(str(excel_no_statement))

    def test_empty_csv_raises(self, tmp_path: Path) -> None:
        target = tmp_path / "empty.csv"
        # Header row only — no data
        target.write_text("statement_date,total_settlement_amount\n", encoding="utf-8")
        with pytest.raises(ValueError, match="vide"):
            load_file(str(target))


# ── clean_data ───────────────────────────────────────────────────────────────

class TestCleanData:
    def test_renames_statement_date_to_date(self, sample_clean_df: pd.DataFrame) -> None:
        raw = sample_clean_df.rename(columns={"date": "statement_date"})
        cleaned = clean_data(raw)
        assert "date" in cleaned.columns
        assert "statement_date" not in cleaned.columns

    def test_normalises_column_names(self) -> None:
        raw = pd.DataFrame({
            "Statement Date": ["2025-01-01"],
            "Total Settlement Amount": [100.0],
            " Net Sales ": [80.0],
        })
        cleaned = clean_data(raw)
        assert "date" in cleaned.columns
        assert "total_settlement_amount" in cleaned.columns
        assert "net_sales" in cleaned.columns

    def test_drops_unknown_columns(self) -> None:
        raw = pd.DataFrame({
            "statement_date": ["2025-01-01"],
            "total_settlement_amount": [100.0],
            "statement_id": ["abc"],
            "payment_id": ["xyz"],
            "status": ["ok"],
            "tip": [1],
        })
        cleaned = clean_data(raw)
        for col in ("statement_id", "payment_id", "status", "tip"):
            assert col not in cleaned.columns

    def test_missing_required_columns_raises(self) -> None:
        raw = pd.DataFrame({"net_sales": [100.0]})
        with pytest.raises(ValueError, match="obligatoires"):
            clean_data(raw)

    def test_coerces_numeric_columns(self) -> None:
        raw = pd.DataFrame({
            "statement_date": ["2025-01-01"],
            "total_settlement_amount": ["100.50"],  # string → numeric
            "net_sales": ["abc"],                    # invalid → NaN
        })
        cleaned = clean_data(raw)
        assert cleaned["total_settlement_amount"].iloc[0] == pytest.approx(100.50)
        assert pd.isna(cleaned["net_sales"].iloc[0])

    def test_drops_fully_empty_rows(self) -> None:
        raw = pd.DataFrame({
            "statement_date": ["2025-01-01", None, "2025-01-03"],
            "total_settlement_amount": [100.0, None, 300.0],
            "net_sales": [80.0, None, 240.0],
        })
        cleaned = clean_data(raw)
        # The middle row had all-NaN, should be dropped
        assert len(cleaned) == 2

    def test_does_not_mutate_input(self, sample_clean_df: pd.DataFrame) -> None:
        raw = sample_clean_df.rename(columns={"date": "statement_date"})
        before = raw.copy()
        clean_data(raw)
        pd.testing.assert_frame_equal(raw, before)


# ── compute_vat ──────────────────────────────────────────────────────────────

class TestComputeVAT:
    def test_france_splits_ttc_into_ht_and_vat(self, sample_clean_df: pd.DataFrame) -> None:
        df = compute_vat(sample_clean_df, "France")
        # 120 TTC at 20% → HT = 100, VAT = 20
        assert df["net_sales_ht"].iloc[0] == pytest.approx(100.0)
        assert df["net_sales_vat"].iloc[0] == pytest.approx(20.0)
        # Sum HT + VAT == TTC
        assert df["net_sales_ht"].iloc[0] + df["net_sales_vat"].iloc[0] == pytest.approx(120.0)

    def test_france_applies_to_all_amount_fields(self, sample_clean_df: pd.DataFrame) -> None:
        df = compute_vat(sample_clean_df, "France")
        for field in ("net_sales", "fees", "shipping", "adjustments"):
            assert f"{field}_ht" in df.columns
            assert f"{field}_vat" in df.columns

    def test_non_france_passes_through_with_zero_vat(self, sample_clean_df: pd.DataFrame) -> None:
        df = compute_vat(sample_clean_df, "Non-France")
        assert df["net_sales_ht"].iloc[0] == pytest.approx(120.0)
        assert df["net_sales_vat"].iloc[0] == pytest.approx(0.0)

    def test_country_is_case_insensitive(self, sample_clean_df: pd.DataFrame) -> None:
        for variant in ("FRANCE", "france", " France "):
            df = compute_vat(sample_clean_df, variant)
            assert df["net_sales_vat"].iloc[0] > 0

    def test_skips_missing_optional_columns(self) -> None:
        df = pd.DataFrame({
            "date": ["2025-01-01"],
            "total_settlement_amount": [100.0],
            "net_sales": [120.0],
            # no fees/shipping/adjustments
        })
        out = compute_vat(df, "France")
        assert "net_sales_ht" in out.columns
        assert "fees_ht" not in out.columns

    def test_vat_rate_is_consistent_with_module_constant(self, sample_clean_df: pd.DataFrame) -> None:
        df = compute_vat(sample_clean_df, "France")
        ratio = df["net_sales_vat"].iloc[0] / df["net_sales_ht"].iloc[0]
        assert ratio == pytest.approx(VAT_RATE)


# ── build_output ─────────────────────────────────────────────────────────────

class TestBuildOutput:
    def test_produces_expected_columns(self, sample_clean_df: pd.DataFrame) -> None:
        df = compute_vat(sample_clean_df, "France")
        out = build_output(df)
        expected = {"date", "sales_ht", "vat", "fees", "shipping", "adjustments", "total_settlement"}
        assert expected.issubset(set(out.columns))

    def test_vat_is_sum_of_components(self, sample_clean_df: pd.DataFrame) -> None:
        df = compute_vat(sample_clean_df, "France")
        out = build_output(df)
        # row 0: net_sales=120, fees=10, shipping=10, adjustments=0
        # vat = 20 + 1.67 + 1.67 + 0 = 23.34 (rounded to 2dp)
        expected_vat = round(120 / 1.20 * 0.20 + 10 / 1.20 * 0.20 + 10 / 1.20 * 0.20, 2)
        assert out["vat"].iloc[0] == pytest.approx(expected_vat, abs=0.01)

    def test_values_are_rounded_to_2_decimals(self, sample_clean_df: pd.DataFrame) -> None:
        df = compute_vat(sample_clean_df, "France")
        out = build_output(df)
        for col in ("sales_ht", "vat", "fees", "shipping"):
            for value in out[col].dropna():
                assert value == round(value, 2)

    def test_handles_invalid_dates_as_nat(self) -> None:
        df = pd.DataFrame({
            "date": ["not-a-date"],
            "total_settlement_amount": [100.0],
            "net_sales_ht": [80.0],
        })
        out = build_output(df)
        assert pd.isna(out["date"].iloc[0])


# ── detect_anomalies ─────────────────────────────────────────────────────────

def _make_raw(**columns) -> pd.DataFrame:
    """Helper: build a `clean_data`-shaped DataFrame from kwargs."""
    return pd.DataFrame(columns)


class TestDetectAnomalies:

    def test_clean_dataset_returns_no_errors(self, sample_clean_df: pd.DataFrame) -> None:
        out = build_output(compute_vat(sample_clean_df, "France"))
        anomalies = detect_anomalies(sample_clean_df, out, "France")
        # Sample is 3 rows with same date pattern but different amounts → no duplicates
        # No errors expected; warnings/info may exist depending on data
        assert all(a["severity"] != "error" for a in anomalies)

    def test_missing_value_is_flagged_as_error(self) -> None:
        raw = _make_raw(
            date=["2025-01-01", "2025-01-02"],
            total_settlement_amount=[100.0, 200.0],
            net_sales=[120.0, np.nan],
            fees=[10.0, 20.0],
            shipping=[10.0, 20.0],
        )
        out = build_output(compute_vat(raw, "France"))
        anomalies = detect_anomalies(raw, out, "France")
        codes = [a["code"] for a in anomalies]
        assert "MISSING_VALUE" in codes
        miss = next(a for a in anomalies if a["code"] == "MISSING_VALUE")
        assert miss["severity"] == "error"
        assert 1 in miss["rows"]

    def test_negative_sales_is_error(self) -> None:
        raw = _make_raw(
            date=["2025-01-01"],
            total_settlement_amount=[-100.0],
            net_sales=[-120.0],
            fees=[10.0],
            shipping=[10.0],
        )
        out = build_output(compute_vat(raw, "France"))
        anomalies = detect_anomalies(raw, out, "France")
        codes = [a["code"] for a in anomalies]
        assert "NEGATIVE_SALES" in codes
        neg = next(a for a in anomalies if a["code"] == "NEGATIVE_SALES")
        assert neg["severity"] == "error"

    def test_negative_fees_is_warning(self) -> None:
        raw = _make_raw(
            date=["2025-01-01"],
            total_settlement_amount=[100.0],
            net_sales=[120.0],
            fees=[-5.0],
            shipping=[10.0],
        )
        out = build_output(compute_vat(raw, "France"))
        anomalies = detect_anomalies(raw, out, "France")
        codes = [a["code"] for a in anomalies]
        assert "NEGATIVE_FEES" in codes
        warn = next(a for a in anomalies if a["code"] == "NEGATIVE_FEES")
        assert warn["severity"] == "warning"

    def test_negative_shipping_is_warning(self) -> None:
        raw = _make_raw(
            date=["2025-01-01"],
            total_settlement_amount=[100.0],
            net_sales=[120.0],
            fees=[10.0],
            shipping=[-5.0],
        )
        out = build_output(compute_vat(raw, "France"))
        anomalies = detect_anomalies(raw, out, "France")
        assert "NEGATIVE_SHIPPING" in [a["code"] for a in anomalies]

    def test_total_mismatch_above_tolerance(self) -> None:
        # total_settlement should be net_sales + adj - fees - shipping = 100 - 10 - 10 = 80
        # But we set it to 200 — way off.
        raw = _make_raw(
            date=["2025-01-01"],
            total_settlement_amount=[200.0],
            net_sales=[100.0],
            fees=[10.0],
            shipping=[10.0],
            adjustments=[0.0],
        )
        out = build_output(compute_vat(raw, "France"))
        anomalies = detect_anomalies(raw, out, "France")
        assert "TOTAL_MISMATCH" in [a["code"] for a in anomalies]

    def test_total_mismatch_within_tolerance_passes(self) -> None:
        # tolerance = 5%. settlement = 79 vs reconstructed 80 → 1.25% off → OK
        raw = _make_raw(
            date=["2025-01-01"],
            total_settlement_amount=[79.0],
            net_sales=[100.0],
            fees=[10.0],
            shipping=[10.0],
            adjustments=[0.0],
        )
        out = build_output(compute_vat(raw, "France"))
        anomalies = detect_anomalies(raw, out, "France")
        assert "TOTAL_MISMATCH" not in [a["code"] for a in anomalies]

    def test_duplicate_rows_flagged(self) -> None:
        raw = _make_raw(
            date=["2025-01-01", "2025-01-01", "2025-01-02"],
            total_settlement_amount=[100.0, 100.0, 200.0],
            net_sales=[120.0, 120.0, 240.0],
            fees=[10.0, 10.0, 20.0],
            shipping=[10.0, 10.0, 20.0],
        )
        out = build_output(compute_vat(raw, "France"))
        anomalies = detect_anomalies(raw, out, "France")
        dups = [a for a in anomalies if a["code"] == "DUPLICATE"]
        assert dups, "expected DUPLICATE anomaly"
        assert sorted(dups[0]["rows"]) == [0, 1]

    def test_future_date_flagged_as_info(self) -> None:
        future = (date.today() + timedelta(days=30)).isoformat()
        raw = _make_raw(
            date=[future],
            total_settlement_amount=[100.0],
            net_sales=[120.0],
            fees=[10.0],
            shipping=[10.0],
        )
        out = build_output(compute_vat(raw, "France"))
        anomalies = detect_anomalies(raw, out, "France")
        future_anos = [a for a in anomalies if a["code"] == "FUTURE_DATE"]
        assert future_anos
        assert future_anos[0]["severity"] == "info"

    def test_outlier_detected_with_extreme_value(self) -> None:
        # 9 normal values + 1 extreme — z-score way above 3
        amounts = [100.0] * 9 + [10_000.0]
        raw = _make_raw(
            date=[f"2025-01-{i+1:02d}" for i in range(10)],
            total_settlement_amount=amounts,
            net_sales=[a * 1.2 for a in amounts],
            fees=[10.0] * 10,
            shipping=[10.0] * 10,
        )
        out = build_output(compute_vat(raw, "France"))
        anomalies = detect_anomalies(raw, out, "France")
        assert "OUTLIER" in [a["code"] for a in anomalies]

    def test_outlier_skipped_when_too_few_rows(self) -> None:
        # < 4 rows → no outlier detection
        raw = _make_raw(
            date=["2025-01-01", "2025-01-02"],
            total_settlement_amount=[100.0, 1_000_000.0],
            net_sales=[120.0, 1_200_000.0],
            fees=[10.0, 10.0],
            shipping=[10.0, 10.0],
        )
        out = build_output(compute_vat(raw, "France"))
        anomalies = detect_anomalies(raw, out, "France")
        assert "OUTLIER" not in [a["code"] for a in anomalies]

    def test_vat_incoherence_only_for_france(self) -> None:
        raw = _make_raw(
            date=["2025-01-01"],
            total_settlement_amount=[100.0],
            net_sales=[120.0],
            fees=[10.0],
            shipping=[10.0],
        )
        # Non-France: vat=0 by construction → no incoherence flag
        out = build_output(compute_vat(raw, "Non-France"))
        anomalies = detect_anomalies(raw, out, "Non-France")
        assert "VAT_INCOHERENCE" not in [a["code"] for a in anomalies]


# ── validate ─────────────────────────────────────────────────────────────────

class TestValidate:
    def test_clean_dataset_scores_100(self, sample_clean_df: pd.DataFrame) -> None:
        out = build_output(compute_vat(sample_clean_df, "France"))
        report = validate(out, anomalies=[])
        assert report["reliability_score"] == 100
        assert report["errors"] == 0
        assert report["warnings"] == 0

    def test_each_error_subtracts_15_points(self, sample_clean_df: pd.DataFrame) -> None:
        out = build_output(compute_vat(sample_clean_df, "France"))
        anomalies = [
            {"severity": "error", "code": "X", "message": "x", "rows": [], "detail": ""},
            {"severity": "error", "code": "Y", "message": "y", "rows": [], "detail": ""},
        ]
        report = validate(out, anomalies)
        assert report["reliability_score"] == 100 - 2 * 15
        assert report["errors"] == 2

    def test_each_warning_subtracts_5_points(self, sample_clean_df: pd.DataFrame) -> None:
        out = build_output(compute_vat(sample_clean_df, "France"))
        anomalies = [
            {"severity": "warning", "code": "X", "message": "x", "rows": [], "detail": ""}
        ]
        report = validate(out, anomalies)
        assert report["reliability_score"] == 95
        assert report["warnings"] == 1

    def test_reliability_score_floors_at_zero(self, sample_clean_df: pd.DataFrame) -> None:
        out = build_output(compute_vat(sample_clean_df, "France"))
        anomalies = [
            {"severity": "error", "code": "E", "message": "", "rows": [], "detail": ""}
        ] * 20
        report = validate(out, anomalies)
        assert report["reliability_score"] == 0

    def test_report_counts_total_anomalies(self, sample_clean_df: pd.DataFrame) -> None:
        out = build_output(compute_vat(sample_clean_df, "France"))
        anomalies = [
            {"severity": "error",   "code": "E", "message": "", "rows": [], "detail": ""},
            {"severity": "warning", "code": "W", "message": "", "rows": [], "detail": ""},
            {"severity": "info",    "code": "I", "message": "", "rows": [], "detail": ""},
        ]
        report = validate(out, anomalies)
        assert report["anomaly_count"] == 3
        assert report["rows"] == len(out)

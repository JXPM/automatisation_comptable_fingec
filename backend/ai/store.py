"""
Persistance de la brique IA : journal des prédictions et corrections du
comptable (boucle de feedback). Même base SQLite que l'authentification
(`app.db` dans le volume de données), même style minimal (sqlite3 stdlib).

Deux tables :
  - `ai_predictions` : trace chaque prédiction servie → matière du **monitorage**
    (volume, confiance moyenne, taux de revue, dérive dans le temps) ;
  - `ai_feedback`    : enregistre les corrections du comptable → matière du
    **réentraînement** (apprentissage continu / feedback loop).
"""

from __future__ import annotations

import os
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path

_BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = Path(os.environ.get("BACKEND_DATA_DIR", str(_BASE_DIR))).resolve()
DB_PATH = DATA_DIR / "app.db"

_lock = threading.Lock()


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def init_db() -> None:
    """Crée les tables IA si absentes (idempotent)."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with _lock, _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_predictions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                ts          TEXT NOT NULL,
                user_email  TEXT NOT NULL DEFAULT '',
                input       TEXT NOT NULL,
                category    TEXT NOT NULL,
                account     TEXT NOT NULL,
                confidence  REAL NOT NULL,
                review      INTEGER NOT NULL DEFAULT 0,
                model_version TEXT NOT NULL DEFAULT ''
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_feedback (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                ts          TEXT NOT NULL,
                user_email  TEXT NOT NULL DEFAULT '',
                input       TEXT NOT NULL,
                predicted_category TEXT NOT NULL DEFAULT '',
                predicted_confidence REAL NOT NULL DEFAULT 0,
                corrected_category TEXT NOT NULL,
                used_for_training INTEGER NOT NULL DEFAULT 0
            )
            """
        )


# ── Écriture ─────────────────────────────────────────────────────────────────
def log_prediction(*, user_email: str, input: str, category: str, account: str,
                   confidence: float, review: bool, model_version: str = "") -> None:
    with _lock, _connect() as conn:
        conn.execute(
            "INSERT INTO ai_predictions "
            "(ts, user_email, input, category, account, confidence, review, model_version) "
            "VALUES (?,?,?,?,?,?,?,?)",
            (_now(), user_email, input, category, account, float(confidence),
             int(bool(review)), model_version),
        )


def log_predictions_bulk(user_email: str, preds: list[dict], model_version: str = "") -> None:
    """Insère un lot de prédictions en une transaction (cf. /categorize-batch)."""
    if not preds:
        return
    ts = _now()
    with _lock, _connect() as conn:
        conn.executemany(
            "INSERT INTO ai_predictions "
            "(ts, user_email, input, category, account, confidence, review, model_version) "
            "VALUES (?,?,?,?,?,?,?,?)",
            [(ts, user_email, p["input"], p["category"], p["account"],
              float(p["confidence"]), int(bool(p["review"])), model_version) for p in preds],
        )


def log_feedback(*, user_email: str, input: str, predicted_category: str,
                 predicted_confidence: float, corrected_category: str) -> int:
    with _lock, _connect() as conn:
        cur = conn.execute(
            "INSERT INTO ai_feedback "
            "(ts, user_email, input, predicted_category, predicted_confidence, corrected_category) "
            "VALUES (?,?,?,?,?,?)",
            (_now(), user_email, input, predicted_category,
             float(predicted_confidence), corrected_category),
        )
        return int(cur.lastrowid)


# ── Lecture ──────────────────────────────────────────────────────────────────
def feedback_examples() -> list[tuple[str, str]]:
    """Renvoie les corrections sous forme (libellé, catégorie corrigée) pour
    enrichir le jeu d'entraînement."""
    with _lock, _connect() as conn:
        rows = conn.execute(
            "SELECT input, corrected_category FROM ai_feedback"
        ).fetchall()
    return [(r["input"], r["corrected_category"]) for r in rows]


def mark_feedback_trained() -> int:
    with _lock, _connect() as conn:
        cur = conn.execute(
            "UPDATE ai_feedback SET used_for_training = 1 WHERE used_for_training = 0"
        )
        return cur.rowcount


def monitoring_summary(*, recent_buckets: int = 7) -> dict:
    """Agrège les métriques de surveillance du modèle en production."""
    with _lock, _connect() as conn:
        total = conn.execute("SELECT COUNT(*) c FROM ai_predictions").fetchone()["c"]
        if total == 0:
            base = {
                "total_predictions": 0, "review_count": 0, "review_rate": 0.0,
                "avg_confidence": None, "confidence_histogram": {},
                "per_category": [], "feedback_count": 0, "correction_count": 0,
                "correction_rate": None, "daily": [],
            }
        else:
            agg = conn.execute(
                "SELECT AVG(confidence) avg_c, "
                "SUM(CASE WHEN review=1 THEN 1 ELSE 0 END) reviews FROM ai_predictions"
            ).fetchone()
            # Histogramme de confiance par tranches de 10 %.
            hist = {f"{i}-{i+10}": 0 for i in range(0, 100, 10)}
            for r in conn.execute("SELECT confidence FROM ai_predictions"):
                b = min(int(r["confidence"] * 10) * 10, 90)
                hist[f"{b}-{b+10}"] += 1
            per_cat = [
                {"category": r["category"], "count": r["c"],
                 "avg_confidence": round(r["avg_c"], 4)}
                for r in conn.execute(
                    "SELECT category, COUNT(*) c, AVG(confidence) avg_c "
                    "FROM ai_predictions GROUP BY category ORDER BY c DESC"
                )
            ]
            daily = [
                {"day": r["d"], "count": r["c"], "avg_confidence": round(r["avg_c"], 4)}
                for r in conn.execute(
                    "SELECT substr(ts,1,10) d, COUNT(*) c, AVG(confidence) avg_c "
                    "FROM ai_predictions GROUP BY d ORDER BY d DESC LIMIT ?",
                    (recent_buckets,),
                )
            ]
            base = {
                "total_predictions": total,
                "review_count": int(agg["reviews"]),
                "review_rate": round(agg["reviews"] / total, 4),
                "avg_confidence": round(agg["avg_c"], 4),
                "confidence_histogram": hist,
                "per_category": per_cat,
                "daily": list(reversed(daily)),
            }
        fb_total = conn.execute("SELECT COUNT(*) c FROM ai_feedback").fetchone()["c"]
        corrections = conn.execute(
            "SELECT COUNT(*) c FROM ai_feedback "
            "WHERE corrected_category <> predicted_category AND predicted_category <> ''"
        ).fetchone()["c"]
    base["feedback_count"] = fb_total
    base["correction_count"] = corrections
    base["correction_rate"] = round(corrections / fb_total, 4) if fb_total else None
    return base

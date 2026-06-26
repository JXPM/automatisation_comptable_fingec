"""
Collecte des taux de change par **scraping** (source web : Banque centrale
européenne).

Besoin métier : les relevés TikTok/Shopify peuvent être libellés en devises
étrangères (USD, GBP…). Pour produire des écritures en euros, il faut un taux de
change daté et fiable. On le récupère en **téléchargeant la page HTML** des taux
de référence de la BCE, puis en **parsant** le tableau (devise → taux).

Cela ajoute au projet une source de type *scraping* (en plus des fichiers
TikTok/Shopify et des webhooks n8n) et une table relationnelle interrogée en SQL
— couvrant les compétences C1 (extraction multi-sources) et C2 (requêtes SQL).

Conception :
  - `parse_rates_html()` est une fonction **pure** (HTML → taux), donc testable
    sans réseau ;
  - `fetch_rates()` isole l'accès réseau (httpx) ;
  - persistance SQLite dans `app.db` (table `exchange_rates`), même style que le
    reste du projet (sqlite3 stdlib).
"""

from __future__ import annotations

import os
import re
import sqlite3
import threading
from datetime import date, datetime, timezone
from pathlib import Path

import httpx

# Page HTML publique des taux de référence quotidiens de la BCE (réutilisation
# explicitement autorisée par la BCE).
RATES_URL = (
    "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/"
    "euro_reference_exchange_rates/html/index.en.html"
)
_USER_AGENT = "FingecBot/1.0 (+https://app.fingec.fr) comptabilite e-commerce"

# Le tableau BCE : <td id="USD" class="currency">…</td> puis <span class="rate">1.1342</span>.
_CURRENCY_RE = re.compile(r'id="([A-Z]{3})"\s+class="currency"')
_RATE_RE = re.compile(r'<span class="rate">\s*([0-9]+\.[0-9]+)\s*</span>')

_BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("BACKEND_DATA_DIR", str(_BASE_DIR))).resolve()
DB_PATH = DATA_DIR / "app.db"
_lock = threading.Lock()


# ── Scraping (téléchargement + parsing) ──────────────────────────────────────
def parse_rates_html(html: str) -> dict[str, float]:
    """Extrait les taux EUR→devise du HTML de la BCE. Fonction pure (testable).

    L'euro est la base : `{"EUR": 1.0, "USD": 1.1342, ...}`.
    Lève `ValueError` si la structure attendue est absente (page modifiée).
    """
    currencies = _CURRENCY_RE.findall(html)
    rates = _RATE_RE.findall(html)
    if not currencies:
        raise ValueError("Scraping : aucune devise trouvée (structure de page inattendue).")
    if len(currencies) != len(rates):
        raise ValueError(
            f"Scraping : {len(currencies)} devises mais {len(rates)} taux — "
            "incohérence de parsing."
        )
    out: dict[str, float] = {"EUR": 1.0}
    for cur, rate in zip(currencies, rates):
        out[cur] = float(rate)
    return out


async def fetch_rates(url: str = RATES_URL) -> dict:
    """Télécharge la page HTML de la BCE et renvoie les taux parsés.

    Renvoie `{"date": "YYYY-MM-DD", "base": "EUR", "rates": {...}}`.
    """
    try:
        async with httpx.AsyncClient(timeout=20.0, headers={"User-Agent": _USER_AGENT}) as client:
            resp = await client.get(url)
    except httpx.RequestError as e:
        raise RuntimeError(f"Source de taux injoignable : {e}")
    if resp.status_code != 200:
        raise RuntimeError(f"Source de taux : réponse HTTP {resp.status_code}.")
    rates = parse_rates_html(resp.text)
    return {"date": date.today().isoformat(), "base": "EUR", "rates": rates}


# ── Persistance SQLite ───────────────────────────────────────────────────────
def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with _lock, _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS exchange_rates (
                rate_date   TEXT NOT NULL,
                currency    TEXT NOT NULL,
                rate        REAL NOT NULL,
                fetched_at  TEXT NOT NULL,
                PRIMARY KEY (rate_date, currency)
            )
            """
        )


def save_rates(payload: dict) -> int:
    """Stocke un lot de taux (upsert par date+devise). Renvoie le nombre de lignes."""
    rate_date = payload["date"]
    fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    rows = [(rate_date, cur, float(rate), fetched_at) for cur, rate in payload["rates"].items()]
    with _lock, _connect() as conn:
        conn.executemany(
            "INSERT INTO exchange_rates (rate_date, currency, rate, fetched_at) "
            "VALUES (?,?,?,?) "
            "ON CONFLICT(rate_date, currency) DO UPDATE SET rate=excluded.rate, fetched_at=excluded.fetched_at",
            rows,
        )
    return len(rows)


def latest_rates() -> dict:
    """Renvoie les taux de la date la plus récente stockée (SQL : sous-requête MAX)."""
    with _lock, _connect() as conn:
        row = conn.execute("SELECT MAX(rate_date) d FROM exchange_rates").fetchone()
        if not row or not row["d"]:
            return {"date": None, "base": "EUR", "rates": {}}
        latest = row["d"]
        cur = conn.execute(
            "SELECT currency, rate FROM exchange_rates WHERE rate_date = ? ORDER BY currency",
            (latest,),
        )
        rates = {r["currency"]: r["rate"] for r in cur}
    return {"date": latest, "base": "EUR", "rates": rates}


def convert(amount: float, currency: str) -> float | None:
    """Convertit un montant d'une devise vers l'euro au dernier taux connu.

    Renvoie `None` si la devise est inconnue (taux indisponible)."""
    currency = currency.strip().upper()
    if currency == "EUR":
        return round(float(amount), 2)
    rates = latest_rates()["rates"]
    rate = rates.get(currency)
    if not rate:
        return None
    return round(float(amount) / rate, 2)  # taux BCE = EUR→devise, donc on divise

"""Tests du scraping des taux de change (C1 extraction web, C2 SQL).

Le parsing est testé sur un **fragment HTML fixe** (pas de réseau) ; la
persistance et la conversion sur une base SQLite temporaire.
"""
from __future__ import annotations

from pathlib import Path

import pytest

# Fragment représentatif de la page BCE (structure réelle : td.currency + span.rate).
SAMPLE_HTML = """
<table><tbody>
  <tr><td id="USD" class="currency"><a href="x">USD</a></td>
      <td><span class="rate">1.1342</span></td></tr>
  <tr><td id="GBP" class="currency"><a href="x">GBP</a></td>
      <td><span class="rate">0.86183</span></td></tr>
  <tr><td id="JPY" class="currency"><a href="x">JPY</a></td>
      <td><span class="rate">183.57</span></td></tr>
</tbody></table>
"""


def test_parse_extracts_rates_with_eur_base():
    import scraper
    rates = scraper.parse_rates_html(SAMPLE_HTML)
    assert rates["EUR"] == 1.0
    assert rates["USD"] == 1.1342
    assert rates["GBP"] == 0.86183
    assert len(rates) == 4  # EUR + 3 devises


def test_parse_raises_on_unexpected_structure():
    import scraper
    with pytest.raises(ValueError):
        scraper.parse_rates_html("<html>aucune devise ici</html>")


def test_parse_raises_on_count_mismatch():
    import scraper
    bad = '<td id="USD" class="currency">USD</td><td id="GBP" class="currency">GBP</td>' \
          '<span class="rate">1.13</span>'
    with pytest.raises(ValueError):
        scraper.parse_rates_html(bad)


def test_store_and_convert(tmp_path: Path, monkeypatch):
    import scraper
    monkeypatch.setattr(scraper, "DATA_DIR", tmp_path)
    monkeypatch.setattr(scraper, "DB_PATH", tmp_path / "app.db")
    scraper.init_db()

    n = scraper.save_rates({"date": "2026-06-26", "base": "EUR",
                            "rates": {"EUR": 1.0, "USD": 1.1342, "GBP": 0.86183}})
    assert n == 3

    latest = scraper.latest_rates()
    assert latest["date"] == "2026-06-26"
    assert latest["rates"]["USD"] == 1.1342

    assert scraper.convert(100, "EUR") == 100.0
    assert scraper.convert(100, "USD") == round(100 / 1.1342, 2)
    assert scraper.convert(100, "XYZ") is None  # devise inconnue


def test_save_is_idempotent_upsert(tmp_path: Path, monkeypatch):
    import scraper
    monkeypatch.setattr(scraper, "DATA_DIR", tmp_path)
    monkeypatch.setattr(scraper, "DB_PATH", tmp_path / "app.db")
    scraper.init_db()
    scraper.save_rates({"date": "2026-06-26", "base": "EUR", "rates": {"USD": 1.10}})
    scraper.save_rates({"date": "2026-06-26", "base": "EUR", "rates": {"USD": 1.20}})
    # Même date+devise → mise à jour, pas de doublon.
    assert scraper.latest_rates()["rates"]["USD"] == 1.20


# ── API /api/rates ───────────────────────────────────────────────────────────
@pytest.fixture
def client(tmp_path: Path, monkeypatch):
    from fastapi.testclient import TestClient
    import auth
    import scraper
    import main

    monkeypatch.setattr(auth, "DATA_DIR", tmp_path)
    monkeypatch.setattr(auth, "DB_PATH", tmp_path / "app.db")
    monkeypatch.setattr(scraper, "DATA_DIR", tmp_path)
    monkeypatch.setattr(scraper, "DB_PATH", tmp_path / "app.db")
    monkeypatch.setenv("ADMIN_EMAIL", "admin@fingec.fr")
    monkeypatch.setenv("ADMIN_PASSWORD", "admin-password-1")
    monkeypatch.setenv("RATELIMIT_ENABLED", "0")
    monkeypatch.setenv("PWNED_CHECK_ENABLED", "0")
    monkeypatch.setenv("AUTH_COOKIE_SECURE", "0")
    monkeypatch.setenv("RATES_AUTOREFRESH_ENABLED", "0")  # pas de réseau
    with TestClient(main.app) as c:
        yield c


def _admin(client):
    tok = client.post("/auth/login", json={"email": "admin@fingec.fr", "password": "admin-password-1"}).json()["access_token"]
    return {"Authorization": f"Bearer {tok}"}


def test_rates_endpoint_requires_auth(client):
    assert client.get("/api/rates").status_code == 401


def test_rates_endpoint_returns_stored(client):
    import scraper
    scraper.save_rates({"date": "2026-06-26", "base": "EUR", "rates": {"USD": 1.1342}})
    r = client.get("/api/rates", headers=_admin(client))
    assert r.status_code == 200
    assert r.json()["rates"]["USD"] == 1.1342


def test_rates_refresh_is_admin_only(client):
    admin_h = _admin(client)
    client.post("/auth/users", headers=admin_h,
                json={"email": "compta@fingec.fr", "password": "Zk7-river-Maple-92"})
    tok = client.post("/auth/login", json={"email": "compta@fingec.fr", "password": "Zk7-river-Maple-92"}).json()["access_token"]
    # Le cloisonnement admin bloque AVANT tout appel réseau.
    assert client.post("/api/rates/refresh", headers={"Authorization": f"Bearer {tok}"}).status_code == 403

"""
Référentiel des catégories comptables cibles (le « label space » du modèle).

Chaque catégorie associe :
  - un identifiant stable (`key`) utilisé par le modèle ;
  - le **compte Quadra** par défaut (cohérent avec `backend/journal.py`) ;
  - un libellé lisible et une description pour l'interface comptable.

Garder ce fichier aligné avec `JOURNAL_CONFIG` de `journal.py` : le modèle
apprend à *ventiler* les composantes ; le journal sait ensuite *écrire* chaque
compte en partie double.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Category:
    key: str          # identifiant stable (label du modèle)
    account: str      # compte Quadra par défaut
    label: str        # libellé lisible (UI)
    description: str   # aide à la décision pour le comptable


# Ordre = ordre d'affichage. Les comptes reprennent ceux de journal.py quand ils
# existent ; les autres suivent le Plan Comptable Général (classe 6/7).
CATEGORIES: tuple[Category, ...] = (
    Category("ventes",          "70721000", "Ventes",
             "Chiffre d'affaires sur ventes de marchandises (produits vendus)."),
    Category("port",            "70800000", "Port & livraison",
             "Frais de port refacturés / produits annexes de livraison."),
    Category("commission",      "62220000", "Commission plateforme",
             "Commissions prélevées par la marketplace sur les ventes."),
    Category("publicite",       "62360000", "Publicité & affiliation",
             "Frais d'affiliation, ads, promotions et campagnes marketing."),
    Category("services",        "62280000", "Services & logistique",
             "Services divers de la plateforme (logistique, traitement, EPR…)."),
    Category("taxes",           "44571000", "Taxes & droits",
             "Taxes, droits de douane et prélèvements assimilés."),
    Category("remboursement",   "70900000", "Remboursements & avoirs",
             "Remboursements clients, retours et avoirs (RRR sur ventes)."),
    Category("ajustement",      "471000",   "Ajustement / à classer",
             "Écart ou ajustement non rapproché — à reclasser manuellement."),
)

_BY_KEY = {c.key: c for c in CATEGORIES}
CATEGORY_KEYS: tuple[str, ...] = tuple(c.key for c in CATEGORIES)


def account_for_category(key: str) -> str:
    """Compte Quadra par défaut d'une catégorie (lève si la clé est inconnue)."""
    return _BY_KEY[key].account


def category(key: str) -> Category:
    return _BY_KEY[key]

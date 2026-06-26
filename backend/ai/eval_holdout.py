"""
Jeu d'évaluation « réel » — libellés rédigés à la main, **absents** du
vocabulaire d'entraînement (aucune phrase-graine, aucune augmentation).

Il mesure la vraie capacité de généralisation du modèle à des intitulés
inédits, tels qu'en produiraient une nouvelle plateforme ou une mise à jour
du relevé. C'est l'indicateur de performance présenté au jury (et non
l'accuracy interne, gonflée par l'augmentation).
"""

from __future__ import annotations

# (libellé inédit, catégorie attendue)
HOLDOUT: tuple[tuple[str, str], ...] = (
    ("seller marketplace selling charge", "commission"),
    ("influencer partnership payout", "publicite"),
    ("creator marketing bonus", "publicite"),
    ("buyer refund issued", "remboursement"),
    ("parcel delivery charge", "port"),
    ("import customs levy", "taxes"),
    ("net product revenue", "ventes"),
    ("fulfilment center storage charge", "services"),
    ("manual balance correction", "ajustement"),
    ("returned item credit", "remboursement"),
    ("sponsored product placement cost", "publicite"),
    ("goods sold to customer", "ventes"),
    ("vat collected on sales", "taxes"),
    ("last-mile courier fee", "port"),
    ("platform service charge", "services"),
    ("misc reconciliation entry", "ajustement"),
)

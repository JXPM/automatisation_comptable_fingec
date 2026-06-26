"""
Construction du jeu d'entraînement par **weak supervision**.

Les relevés réels (TikTok/Shopify) ne fournissent pas d'étiquette « compte
comptable » : on la *dérive* d'un vocabulaire métier (les libellés réels des
colonnes du relevé `Order details`, enrichis de leurs équivalents Shopify et de
variantes de remboursement), puis on **augmente** ces graines avec du bruit
réaliste (préfixe plateforme, casse, ponctuation, fautes légères). Le modèle
apprend ainsi à généraliser à des libellés *inédits* — l'objectif même de la
brique IA, là où le mapping déterministe de `journal.py` s'arrête.

Le procédé est **déterministe** (graine fixe) : le jeu de données — et donc le
modèle — sont reproductibles, condition d'un pipeline MLOps sérieux.
"""

from __future__ import annotations

import random

import pandas as pd

from .categories import CATEGORY_KEYS, account_for_category

# ── Vocabulaire « graine » par catégorie ─────────────────────────────────────
# Tiré des 62 colonnes réelles de la feuille « Order details » d'un relevé TikTok
# Shop, complété des équivalents Shopify et de formulations métier courantes.
SEED_PHRASES: dict[str, list[str]] = {
    "ventes": [
        "net sales", "gross sales", "subtotal before discounts", "customer payment",
        "order amount", "product sales", "sale", "order", "vente de marchandises",
        "ventes nettes", "montant de la commande", "chiffre d'affaires",
        "seller discounts", "platform discounts", "co-funded voucher discount",
    ],
    "port": [
        "shipping", "customer shipping fee", "tiktok shop shipping fee",
        "fulfilled by tiktok shop shipping fee", "customer-paid shipping fee before discounts",
        "shipping subsidy", "shipping label", "shipping rate", "delivery fee",
        "frais de port", "frais de livraison", "shipping fee discount",
    ],
    "commission": [
        "tiktok shop commission fee", "commission fee", "marketplace commission",
        "platform commission", "transaction fee", "shopify payments fee",
        "selling fee", "commission plateforme", "commission marketplace",
    ],
    "publicite": [
        "affiliate commission", "affiliate partner commission",
        "affiliate shop ads commission", "affiliate partner shop ads commission",
        "smart promotion fee", "campaign service fee", "co-funded promotion seller funded",
        "shopify ads", "google ads", "meta ads", "creator ads fee", "sponsored ads",
        "frais d'affiliation", "frais de publicité", "promotion", "marketing fee",
    ],
    "services": [
        "epr pay on behalf service fee", "fulfilment service fee", "logistics fee",
        "handling fee", "warehouse fee", "processing fee", "service fee",
        "frais de service", "frais logistiques", "frais de traitement",
    ],
    "taxes": [
        "tax and duty", "smart promotion fee tax", "import duty", "customs duty",
        "vat", "sales tax", "tax", "tva", "taxe", "droits de douane", "duty",
    ],
    "remboursement": [
        "refund subtotal before seller discounts", "refund of seller discounts",
        "customer refund", "refunded customer shipping fee", "affiliate commission refund",
        "chargeback", "return", "refund", "remboursement", "avoir", "retour client",
        "actual return shipping fee",
    ],
    "ajustement": [
        "adjustment amount", "adjustment", "manual adjustment", "correction",
        "balance adjustment", "ajustement", "régularisation", "écart de relevé",
        "other", "divers", "à classer", "misc",
    ],
}

# Préfixes de plateforme et de contexte ajoutés aléatoirement (généralisation).
_PLATFORM_PREFIXES = ["", "", "tiktok shop ", "tiktok ", "shopify ", "platform "]
_REFUND_PREFIXES = ["", "", "", "refunded ", "reversal of ", "remboursement "]


def _typo(token: str, rng: random.Random) -> str:
    """Bruit léger : duplication/suppression d'un caractère (robustesse OCR/saisie)."""
    if len(token) < 4 or rng.random() > 0.15:
        return token
    i = rng.randrange(len(token))
    if rng.random() < 0.5:  # suppression
        return token[:i] + token[i + 1 :]
    return token[:i] + token[i] + token[i:]  # duplication


def _augment(phrase: str, key: str, rng: random.Random) -> str:
    text = phrase
    if rng.random() < 0.5:
        text = rng.choice(_PLATFORM_PREFIXES) + text
    if key == "remboursement" and rng.random() < 0.4:
        text = rng.choice(_REFUND_PREFIXES) + text
    # Casse aléatoire (les relevés mélangent Title Case, lower, UPPER).
    roll = rng.random()
    if roll < 0.33:
        text = text.title()
    elif roll < 0.5:
        text = text.upper()
    # Ponctuation parasite occasionnelle.
    if rng.random() < 0.2:
        text = text + rng.choice([" -", " (net)", " *", ":", " #1"])
    # Fautes de frappe légères sur un token.
    tokens = [_typo(t, rng) if rng.random() < 0.2 else t for t in text.split()]
    return " ".join(tokens).strip()


def build_dataset(samples_per_phrase: int = 12, seed: int = 42) -> pd.DataFrame:
    """Construit le corpus étiqueté (déterministe).

    Renvoie un DataFrame `[text, category, account]`. Chaque phrase-graine est
    déclinée en `samples_per_phrase` variantes augmentées, plus la graine brute.
    """
    rng = random.Random(seed)
    rows: list[dict] = []
    group = 0  # identifiant de la phrase-graine : évite les fuites train/test
    for key in CATEGORY_KEYS:
        account = account_for_category(key)
        for phrase in SEED_PHRASES[key]:
            rows.append({"text": phrase, "category": key, "account": account, "group": group})
            for _ in range(samples_per_phrase):
                rows.append({
                    "text": _augment(phrase, key, rng),
                    "category": key,
                    "account": account,
                    "group": group,
                })
            group += 1
    df = pd.DataFrame(rows).drop_duplicates(subset=["text", "category"]).reset_index(drop=True)
    # Mélange déterministe.
    return df.sample(frac=1.0, random_state=seed).reset_index(drop=True)


if __name__ == "__main__":  # python -m backend.ai.dataset
    df = build_dataset()
    print(f"{len(df)} exemples, {df['category'].nunique()} catégories")
    print(df["category"].value_counts())
    print(df.sample(10, random_state=0).to_string(index=False))

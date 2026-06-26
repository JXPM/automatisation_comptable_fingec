"""
Brique d'intelligence artificielle de Fingec.

Modèle de **catégorisation comptable** : à partir du libellé d'une composante
de transaction e-commerce (commission, frais d'affiliation, port, taxe,
ajustement…), il prédit le **compte comptable Quadra** sur lequel l'imputer,
avec un **score de confiance**. Les prédictions peu sûres sont renvoyées en
revue manuelle ; les corrections du comptable alimentent le réentraînement
(boucle de feedback).

Sous-modules :
  - `categories` : référentiel des comptes/catégories cibles (label space) ;
  - `dataset`    : construction du jeu d'entraînement par weak supervision ;
  - `train`      : entraînement, évaluation et sérialisation du modèle ;
  - `model`      : chargement du modèle et inférence (`categorize`).
"""

from .categories import CATEGORIES, account_for_category

__all__ = ["CATEGORIES", "account_for_category"]

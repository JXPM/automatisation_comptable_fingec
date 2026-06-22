# Évaluation de la nécessité d'une AIPD (analyse d'impact)

_Document interne — article 35 du RGPD. Dernière mise à jour : 2026-06-22._

Une **AIPD (Analyse d'Impact relative à la Protection des Données / DPIA)** est obligatoire lorsqu'un traitement est **susceptible d'engendrer un risque élevé** pour les droits et libertés des personnes. Ce document trace l'évaluation de cette nécessité (la trace de la décision fait partie de l'accountability, même quand l'AIPD n'est pas requise).

## Critères de risque élevé (lignes directrices CEPD — un traitement combinant ≥ 2 critères justifie en général une AIPD)

| Critère | Concerné ? | Commentaire |
|---|---|---|
| Évaluation / scoring de personnes | ❌ Non | Le « score de fiabilité » porte sur la **qualité des fichiers**, pas sur des personnes |
| Décision automatisée à effet juridique | ❌ Non | Aucune décision automatisée sur des personnes (contrôle humain) |
| Surveillance systématique | ❌ Non | — |
| Données sensibles ou hautement personnelles | ⚠️ À nuancer | Données financières de clients = sensibilité économique, mais pas « catégories particulières » au sens de l'art. 9 |
| Données à grande échelle | ❌ Non | Quelques dizaines d'utilisateurs, périmètre cabinet |
| Croisement de jeux de données | ❌ Non | — |
| Personnes vulnérables | ❌ Non | Contacts professionnels |
| Usage innovant / nouvelle technologie | ❌ Non | Pas d'IA décisionnelle en production aujourd'hui |
| Blocage d'un droit / d'un contrat | ❌ Non | — |

## Conclusion (au 2026-06-22)
Au regard des critères, le périmètre actuel **ne franchit pas** le seuil rendant une AIPD obligatoire (0–1 critère réellement coché). **Une AIPD n'est donc pas requise à ce stade.**

## À réévaluer si…
- Ajout d'une **IA décisionnelle** (ex. détection automatique du pays, catégorisation automatique d'écritures, intégration Dext avec décisions) → réévaluer immédiatement.
- Passage à une **grande échelle** (nombreux cabinets/clients, mutualisation SaaS multi-tenants).
- Traitement de **nouvelles catégories** de données plus sensibles.

> Conserver cette page à jour : toute évolution majeure de l'application doit déclencher une relecture de cette évaluation.

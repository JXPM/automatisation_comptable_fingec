# Procédure de gestion des violations de données

_Document interne — articles 33 et 34 du RGPD. Dernière mise à jour : 2026-06-22._

Une **violation de données** est une atteinte à la sécurité entraînant, de manière accidentelle ou illicite, la destruction, la perte, l'altération, la divulgation ou l'accès non autorisé à des données personnelles (ex. : fuite de `app.db`, accès non autorisé au Google Sheet, e-mail envoyé au mauvais destinataire, compromission du VPS).

## Étapes à suivre

### 1. Détecter et qualifier (immédiat)
- Identifier la nature de l'incident, les données et personnes concernées, la cause.
- Évaluer le **risque** pour les personnes (faible / élevé).

### 2. Contenir et corriger (immédiat)
- Stopper la fuite (révoquer des accès/identifiants, isoler le serveur, invalider les jetons/sessions, faire pivoter `AUTH_SECRET`, révoquer les credentials Google).
- Conserver les preuves (journaux) pour l'analyse.

### 3. Notifier la CNIL — **dans les 72 heures** (art. 33)
Obligatoire **sauf** si la violation est peu susceptible d'engendrer un risque pour les personnes.
- Téléservice de notification : https://www.cnil.fr/fr/notifier-une-violation-de-donnees-personnelles
- Contenu : nature de la violation, catégories et nombre approximatif de personnes/d'enregistrements, conséquences probables, mesures prises.

### 4. Informer les personnes concernées (art. 34)
Si le risque est **élevé**, informer les personnes concernées **sans délai**, en termes clairs : nature de la violation, conséquences probables, mesures prises, point de contact.

### 5. Documenter — **toujours** (registre des violations)
Toute violation est consignée ci-dessous, **même si elle n'est pas notifiée** à la CNIL (l'absence de notification doit être justifiée).

## Registre des violations

| Date | Description | Données / personnes concernées | Risque | CNIL notifiée ? | Personnes informées ? | Mesures |
|---|---|---|---|---|---|---|
| — | _(aucune violation à ce jour)_ | — | — | — | — | — |

## Contacts
- **Référent incident (technique)** : Johan — développement et exploitation de l'application.
- **Représentant légal** : Ohouo N'Katta, gérant de Fingec.
- **Contact RGPD** : [À COMPLÉTER, ex. rgpd@fingec.fr]

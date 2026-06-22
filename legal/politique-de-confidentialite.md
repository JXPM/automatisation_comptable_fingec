# Politique de confidentialité

_Dernière mise à jour : 2026-06-22_

La présente politique décrit la manière dont **Fingec** (« nous ») collecte et traite les données à caractère personnel dans le cadre de l'application **app.fingec.fr**, conformément au Règlement (UE) 2016/679 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée (« Informatique et Libertés »).

## 1. Responsable du traitement

- **Fingec**, EURL au capital de 1 000 €, SIRET 808 015 994 00037, dont le siège est 6 rue Frédéric Chopin, 67118 Geispolsheim, représentée par son gérant Ohouo N'Katta. Tél. : +33 (0)9 83 00 08 43.
- **Contact RGPD** : expert@fingec.fr
- **Délégué à la protection des données (DPO)** : non désigné. La désignation d'un DPO n'est pas obligatoire au regard de l'activité et de la taille de la structure (pas de suivi régulier et systématique à grande échelle, pas de traitement de données sensibles à grande échelle).

> **Qualification.** Fingec agit en **responsable de traitement autonome**, tant pour les données de ses **utilisateurs** (collaborateurs) que pour celles des **clients du cabinet** traitées dans le cadre de sa mission comptable : Fingec en détermine les finalités et les moyens et est soumis à ses propres obligations légales (voir `registre-des-traitements.md`).

## 2. Données collectées, finalités et bases légales

### 2.1 Comptes des utilisateurs de l'espace (comptables, administrateurs)
- **Données** : adresse e-mail, nom complet, mot de passe (stocké uniquement sous forme de **hash bcrypt**), rôle (`user`/`admin`), statut du compte, date de création, jetons de réinitialisation (stockés uniquement en **SHA-256**).
- **Finalité** : création et gestion des accès à l'espace de travail, authentification, sécurité.
- **Base légale** : exécution du contrat de travail/de prestation et **intérêt légitime** de l'éditeur à sécuriser l'accès à son outil.

### 2.2 Gestion des clients du cabinet et relances
- **Données** : nom et adresse e-mail du contact client, statut de collecte des pièces, dates d'envoi, nombre et date des relances, historique des envois.
- **Finalité** : suivi de la collecte des pièces comptables et envoi des relances par e-mail dans le cadre de la mission comptable.
- **Base légale** : exécution de la mission comptable et/ou **intérêt légitime** à assurer le suivi des dossiers ; respect d'**obligations légales** comptables et fiscales.

### 2.3 Traitement des fichiers comptables (TikTok / Shopify → Quadra)
- **Données** : fichiers de relevés de transactions e-commerce (dates, montants, TVA, frais). Les fichiers importés sont **supprimés immédiatement après traitement** ; seuls des **fichiers de sortie agrégés** (`.xlsx`) et des **métadonnées techniques** (nom de fichier, score de fiabilité, nombre de lignes) sont conservés.
- **Finalité** : production d'écritures comptables prêtes à importer.
- **Base légale** : exécution de la mission comptable / **obligation légale**.

## 3. Destinataires et sous-traitants

Les données sont accessibles aux **collaborateurs habilités** de Fingec, selon le principe du moindre privilège (un comptable n'accède qu'aux clients qui lui sont attribués).

Nous faisons appel aux **sous-traitants** suivants (détail et garanties dans `sous-traitants.md`) :

| Sous-traitant | Rôle | Donnée concernée | Localisation |
|---|---|---|---|
| **Hostinger** | Hébergement du serveur (VPS) | Comptes, attributions, fichiers de sortie | Paris, France (UE) |
| **Google (Google Workspace / Sheets / Gmail)** | Stockage des données clients (Sheets) et envoi des e-mails (Gmail) | Nom, e-mail, historique des relances | UE + transferts hors UE encadrés |

Le composant d'automatisation **n8n** est **auto-hébergé** sur notre propre serveur et ne constitue pas un sous-traitant tiers.

Nous ne **vendons ni ne louons** vos données. Aucune donnée n'est utilisée à des fins de profilage publicitaire.

## 4. Transferts hors Union européenne

Le recours à Google peut impliquer des transferts de données vers des pays tiers (notamment les États-Unis). Ces transferts sont encadrés par les **clauses contractuelles types** de la Commission européenne et l'adhésion du prestataire au **Data Privacy Framework** UE-États-Unis. [À VÉRIFIER selon la configuration Google Workspace retenue.]

## 5. Durées de conservation

Les durées sont détaillées dans `politique-de-conservation.md`. En synthèse :
- **Comptes utilisateurs** : pendant la durée de la relation, puis suppression/anonymisation après désactivation.
- **Données clients et historique des relances** : pendant la durée de la mission, puis archivage conformément aux obligations comptables.
- **Fichiers importés** : supprimés immédiatement après traitement.
- **Fichiers de sortie** : purgés automatiquement au-delà de 90 jours.
- **Journaux techniques** : purgés automatiquement au-delà de 365 jours.

## 6. Sécurité

Nous mettons en œuvre des mesures techniques et organisationnelles adaptées : chiffrement des échanges (HTTPS/TLS), hachage **bcrypt** des mots de passe, jetons d'accès **JWT** à durée limitée, jetons de réinitialisation à usage unique et expirants, accès à l'automatisation (n8n) **uniquement** via un proxy authentifié, et cloisonnement des accès par rôle et par attribution client.

## 7. Vos droits

Vous disposez des droits d'**accès**, de **rectification**, d'**effacement**, de **limitation**, d'**opposition** et de **portabilité**, ainsi que du droit de définir des directives relatives au sort de vos données après votre décès.

- **Pour les exercer** : écrire à expert@fingec.fr, en justifiant de votre identité si nécessaire. Nous répondons dans un délai d'**un mois**.
- **Réclamation** : vous pouvez introduire une réclamation auprès de la **CNIL** (3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 — www.cnil.fr).

## 8. Cookies et traceurs

L'application utilise uniquement des éléments **strictement nécessaires** à son fonctionnement (par exemple le stockage local du jeton de session pour vous maintenir connecté). Elle **n'utilise pas** de cookies publicitaires, de mesure d'audience tierce ou de traceurs de profilage. Aucun consentement préalable n'est donc requis pour ces éléments essentiels.

## 9. Modifications

La présente politique peut être mise à jour. La date de dernière mise à jour figure en tête de document.

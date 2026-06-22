---
type: system
tags: [fingec, automatisation-comptable, produit]
updated: 2026-06-17
---

# 01 — Vue d'ensemble

## Le quoi / pourquoi
**Automatisation Comptable Fingec** est née comme un outil pour **préparer les écritures comptables** à partir des fichiers de ventes **TikTok** (Excel, feuille `Statement`) et **Shopify** (CSV), et produire un **fichier Excel prêt à importer dans Quadra** (logiciel comptable). Objectif : réduire la saisie manuelle, diminuer les erreurs, rendre la prépa comptable scalable pour un cabinet e-commerce.

Le projet a grossi en une **application SaaS** pour le cabinet **Fingec**, accessible sur **`app.fingec.fr`**, avec deux grandes fonctions :

1. **Traitement comptable** (le cœur historique) — upload d'un fichier → nettoyage, calcul TVA, détection d'anomalies, score de fiabilité, export `.xlsx`. Voir [[13 - Traitement comptable (Quadra)]].
2. **Plateforme de relance clients** — le cabinet relance ses clients pour qu'ils transmettent leurs pièces comptables. Les clients vivent dans **Google Sheets**, les e-mails partent via **n8n** (Gmail), et l'app suit le statut (envoyé / reçu / relancé) par client. Voir [[30 - Workflow n8n « fingec automatisation »]] et [[32 - Relances clients (cycle de mails)]].

## Qui l'utilise
- **Administrateur** (le cabinet) : voit tout, crée les comptes des comptables, attribue les clients.
- **Comptables / collaborateurs** (rôle `user`, turnover type alternants/stagiaires) : ne voient et n'agissent que sur **leurs clients attribués**. Voir [[11 - Authentification & comptes]].

## Les fonctionnalités de l'app (pages frontend)
- **Accueil** (style SaaS, inspiration Pennylane), **Traitement** (upload comptable), **Clients** (liste + actions de relance), **Historique** (suivi des envois), **Nouveau mail** (composer/envoyer), **Logs** (traitements passés), **Admin** (utilisateurs), **Paramètres du compte**. Détail : [[20 - Frontend - structure & pages]].

## Ce qui rend le projet particulier
- **Google Sheets = base de données des clients** (pas de SQL pour les clients) ; n8n lit/écrit les feuilles et expose des **webhooks** que le backend relaie. La seule base SQL est **SQLite** côté backend pour les **utilisateurs** et l'**attribution clients→comptable** ([[11 - Authentification & comptes]]).
- L'app est un **proxy authentifié devant n8n** : n8n n'est jamais joignable sans JWT ([[10 - Backend FastAPI]]).

## Liens
- Architecture technique : [[02 - Architecture globale]].
- Écosystème et hébergement : [[Écosystème Fingec]].

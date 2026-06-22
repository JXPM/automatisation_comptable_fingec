---
type: system
tags: [fingec, automatisation-comptable, n8n, relances]
updated: 2026-06-17
---

# 32 — Relances clients (cycle de mails)

Le cabinet relance ses clients pour qu'ils transmettent leurs **pièces comptables**. Tout passe par le [[30 - Workflow n8n « fingec automatisation »|workflow n8n]] + la feuille **Clients** (Google Sheets).

## Statuts d'un client (feuille Clients)
Colonnes : `Statut`, `Date_envoi`, `Nb_relances`, `Date_derniere_relance`. Le cycle type :
1. **Envoi initial** — 1er mail « Transmission de vos documents comptables » (nœud `Send initial mail`). Met à jour `Statut = envoyé`, `Date_envoi`.
2. **Relance** — si pas de réponse, relance unitaire (`Send a message`) → incrémente `Nb_relances`, met `Date_derniere_relance`.
3. **Reçu** — quand le client a transmis : action « marquer reçu » (`webhook/marquer-recu`).

## Déclencheurs
- **Manuels** (depuis l'app, page Clients) → webhooks `envoi-initial`, `relance-client`, `marquer-recu`, `relance-historique`. Le backend **contrôle l'attribution** : un comptable ne peut agir que sur ses clients (`_CLIENT_ACTION_PATHS`, [[10 - Backend FastAPI]]).
- **Automatiques** (Schedule Triggers) :
  - **Envoi initial mensuel** (1er du mois) — campagne sur la feuille Clients.
  - **Reset mensuel** — `Get all clients → Append to Historique → Update row` : archive le mois dans **Historique** puis remet les compteurs à zéro.

## Contenu des mails
- **Mail initial / relances** : modèle HTML défini **dans les nœuds n8n** (`Send initial mail`, etc.). Signature « Christian NKATTA » + coordonnées cabinet (modèle plus ancien que la signature canonique).
- **Nouveau mail** (composer libre) : le HTML (corps + signature) est construit **côté frontend** (`MailPage.buildEmailHtml`, [[21 - Signature e-mail & charte Fingec]]) puis envoyé via `webhook/send-mail` → `Split recipients` → `Send composed mail`. Chaque destinataire reçoit un mail séparé.

## Suivi
- Page **Clients** : liste filtrée + actions conditionnelles selon le statut. Recharge après la fin du flux n8n (fix « statut figé », cf. commit).
- Page **Historique** : `webhook/get-historique` (feuille Historique).

> [!note] Dépendance Gmail
> Tous ces envois dépendent de la credential **Gmail account** → sujets aux coupures de [[31 - Credentials Google OAuth (Sheets & Gmail)|7 jours]].

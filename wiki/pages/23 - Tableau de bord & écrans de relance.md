---
type: system
tags: [fingec, automatisation-comptable, frontend, relances]
updated: 2026-06-22
---

# 23 — Tableau de bord & écrans de relance

Comportement réel des écrans **Dashboard**, **Clients** et **Historique** (côté frontend). Le cycle métier des mails est décrit dans [[32 - Relances clients (cycle de mails)]] ; ici on documente l'UI et **quels webhooks chaque bouton appelle**. Tout passe par le **proxy n8n authentifié** ([[10 - Backend FastAPI]]).

## DashboardPage (`/`)
Charge en parallèle `/api/clients` + `/logs`. Sections :
- **Salutation** selon l'heure (`Bonjour`/`Bonsoir`) + prénom (depuis `full_name`).
- **Chiffres clés · {mois}** (compteurs animés) : Clients suivis, Taux de réception (`reçu / total`, badge ≥80 %), Fichiers traités ce mois, Lignes générées ce mois (depuis les logs filtrés sur le mois courant).
- **Actions à faire** : Documents en attente (clients ≠ Reçu → `/clients`), Traitements à vérifier (logs `errors > 0` → `/logs`), Relances en cours (clients `Relancé`).
- **Activités récentes** : Derniers traitements (5, score colorisé) + Clients en attente (5, avatars).
- Raccourcis : Traiter un fichier, Relancer un client, Nouveau mail.

## ClientsPage (`/clients`)
- Source : `GET /api/clients` (déjà filtré serveur par attribution ; admin voit tout + colonne « Assigné à »).
- Recherche (nom/e-mail via `norm`) + filtre statut. Mini-stats Total / Reçus / En attente.
- **Statuts** : `En attente`, `Envoyé`, `Relancé`, `Reçu` (rendus par [[22 - Design system & stack frontend|StatusBadge]]).
- **Actions par ligne** (confirmation via `Modal`) :
  | Bouton | Condition | Webhook (`POST /n8n/webhook/...`) | Payload |
  |---|---|---|---|
  | « Envoyer le mail » | statut `En attente` | `envoi-initial` | `{email}` |
  | « Relancer » | statut ≠ `En attente` et ≠ `Reçu` | `relance-client` | `{email}` |
  | « ✓ Reçu » | statut ≠ `Reçu` | `marquer-recu` | `{email}` |
- **Attribution (admin)** : `<select>` par ligne → `PUT /api/assignments` `{client_email, user_id|null}`, mise à jour **optimiste** (rollback si erreur). Liste des comptables via `GET /auth/users`.
- Après chaque action : `load()` recharge la liste (toast de confirmation/erreur).

## HistoriquePage (`/historique`)
- Source : `GET /api/historique` (champs `Mois, Nom, Email, Statut_final, Nb_relances`), **groupé par mois** avec barre de taux de réception par mois.
- **Bandeau d'alerte** : clients non reçus du **dernier mois** → incitation à relancer.
- Filtres : recherche, mois, statut (`Reçu` / `Non reçu uniquement`).
- Action « Relancer » (lignes non reçues) → `POST /n8n/webhook/relance-historique` `{email, nom, mois}` (confirmation via `Modal`).

## Enforcement de sécurité
- Un **comptable** ne peut déclencher ces webhooks d'action que sur **ses** clients attribués : le backend revérifie l'attribution dans `n8n_proxy` (`_CLIENT_ACTION_PATHS`) — l'UI filtrée ne suffit pas, le serveur tranche. [[11 - Authentification & comptes]], `backend/main.py:469`.

> [!note] TraitementPage (`/traitement`)
> Orchestre `UploadForm` → `ValidationReport` + `ResultTable` + `AnomalyConsole` (panneau latéral sticky repliable). Le dernier résultat est mémorisé en `sessionStorage` (`fingec_traitement`). Sélectionner une anomalie surligne les lignes concernées du tableau. Détail métier : [[13 - Traitement comptable (Quadra)]].

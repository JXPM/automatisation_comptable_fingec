---
type: system
tags: [fingec, automatisation-comptable, n8n]
updated: 2026-06-17
sources: ["[[2026-06-17 - Session debug OAuth & refonte e-mail de compte]]"]
---

# 30 — Workflow n8n « fingec automatisation »

Workflow unique qui porte **toute l'automatisation** : lecture/écriture Google Sheets + envoi d'e-mails (relances clients + comptes).

- **ID** : `CtEh608Gl7o9N9HA` · **Nom** : `fingec automatisation` · **41 nœuds**, **10 triggers** · actif/publié.
- **URL éditeur** : `https://n8n.fingec.fr/workflow/CtEh608Gl7o9N9HA`.
- **Webhooks publics** : `https://app.fingec.fr/n8n/webhook/<path>` (relayés par le **proxy authentifié** du backend, [[10 - Backend FastAPI]]).
- Exports dépôt : `n8n/workflows/fingec-automatisation.json` (complet), `account-email-nodes.paste.json` (les 2 nœuds e-mail de compte).

> [!warning] Pas de CD pour n8n
> Le workflow **n'est pas déployé par le pipeline GitHub** — il vit dans l'instance n8n et s'édite à la main (UI ou via le MCP n8n). Les fichiers du dépôt sont des **références/exports**, pas la source déployée. [[40 - Déploiement (CI-CD & VPS)]].

## Données : Google Sheet
- Spreadsheet `1x4ngtRTG4VQKsnOv5vnol8QNhFEoeO9j_tPDq6JB3sU`.
- Feuille **`Clients`** (gid 0) — colonnes : `Nom, Email, Statut, Date_envoi, Nb_relances, Date_derniere_relance`.
- Feuille **`Historique`** (gid 1668609444) — log des envois.
- Credentials : [[31 - Credentials Google OAuth (Sheets & Gmail)]].

## Groupes de nœuds (branches)
| Branche | Trigger / webhook | Chaîne | Rôle |
|---|---|---|---|
| **GET Clients (Dashboard)** | `webhook/get-clients` (responseNode) | Get row(s) in sheet → Code → Respond | liste clients pour l'app |
| **GET Historique** | `webhook/get-historique` (responseNode) | onglet Historique → Code → Respond | historique pour l'app |
| **Relance client** | `webhook/relance-client` (POST) | Get client by email → Send a message → Update row | relance unitaire [[32 - Relances clients (cycle de mails)]] |
| **Marquer reçu** | `webhook/marquer-recu` (POST) | Update row in sheet3 | passe un client à « reçu » |
| **Relance historique** | `webhook/relance-historique` (POST) | Send a message1 | relance depuis l'historique |
| **Envoi initial** | `webhook/envoi-initial` (POST) | Get client initial → Send initial mail → Update statut envoye | 1er envoi unitaire |
| **Nouveau mail** | `webhook/send-mail` (POST) | Split recipients → Send composed mail | composer libre ([[21 - Signature e-mail & charte Fingec]]) |
| **E-mail de compte** | `webhook/send-account-email` (POST) | Send Account Email | invitations/reset ([[12 - E-mails de compte (emailer + n8n)]]) |
| **Envoi initial mensuel** | Schedule Trigger (1er du mois) | Get row(s) → Send a message2 → Update row | campagne automatique |
| **Reset mensuel** | Schedule Trigger1 | Get all clients → Append to Historique → Update row | archive + remise à zéro |

## Nœuds Gmail
Tous de type `n8n-nodes-base.gmail` (v2.2), `operation: send` implicite : `Send a message`, `Send a message1/2`, `Send initial mail`, `Send composed mail`, `Send Account Email`. Utilisent la credential **Gmail account**. [[31 - Credentials Google OAuth (Sheets & Gmail)]].

> [!note] Avertissements de validation
> Le MCP n8n signale « Missing discriminator operation » sur les nœuds Gmail et une couleur de Sticky Note — ce sont des **faux positifs préexistants** (les nœuds fonctionnent avec `send` implicite), sans rapport avec les modifications.

## Accès programmatique (MCP n8n)
- OAuth = lecture seule ; **écriture via Access token** (config `~/.claude.json`). Opérations : `get_execution`, `search_executions`, `update_workflow` (operations atomiques), `publish_workflow`. Cf. mémoire « Accès MCP n8n ».

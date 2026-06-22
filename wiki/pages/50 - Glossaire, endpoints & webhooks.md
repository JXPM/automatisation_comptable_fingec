---
type: reference
tags: [fingec, automatisation-comptable, reference]
updated: 2026-06-17
---

# 50 — Glossaire, endpoints & webhooks

## Endpoints backend (FastAPI)
| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| GET | `/health` | public | healthcheck Docker |
| POST | `/auth/login` | public | connexion → JWT |
| GET | `/auth/me` | user | profil courant |
| POST | `/auth/change-password` | user | changer mdp (exige l'actuel) |
| POST | `/auth/forgot-password` | public | demande de réinit (anti-énumération) |
| POST | `/auth/reset-password` | public | consomme le jeton, définit le mdp |
| GET | `/auth/users` | admin | liste utilisateurs |
| POST | `/auth/users` | admin | créer (mdp vide → invitation) |
| PATCH | `/auth/users/{id}` | admin | activer/rôle/mdp |
| DELETE | `/auth/users/{id}` | admin | supprimer |
| POST | `/process` | user | traiter un fichier → `.xlsx` Quadra |
| GET | `/download/{f}` | user | télécharger un export |
| GET | `/logs` | user | journal des traitements |
| DELETE | `/logs` | admin | vider le journal |
| GET | `/api/clients` | user | clients (filtrés par attribution) |
| GET | `/api/historique` | user | historique (filtré) |
| PUT | `/api/assignments` | admin | attribuer un client à un user |
| ANY | `/n8n/{path}` | user | proxy authentifié vers n8n |

## Webhooks n8n (`/n8n/webhook/<path>`)
| Path | Méthode | Branche |
|---|---|---|
| `get-clients` | GET | liste clients (Dashboard) |
| `get-historique` | GET | historique |
| `relance-client` | POST | relance unitaire ⚠️ attribution |
| `marquer-recu` | POST | marquer reçu ⚠️ attribution |
| `relance-historique` | POST | relance depuis historique ⚠️ attribution |
| `envoi-initial` | POST | 1er envoi ⚠️ attribution |
| `send-mail` | POST | nouveau mail (composer) |
| `send-account-email` | POST | e-mail de compte (invitation/reset) |

⚠️ attribution = soumis à l'enforcement `_CLIENT_ACTION_PATHS` ([[10 - Backend FastAPI]]).

## Glossaire
- **Quadra** — logiciel comptable cible de l'export `.xlsx`.
- **Statement** — la feuille Excel TikTok à traiter (les autres sont ignorées).
- **kind** (`setup`/`reset`/`changed`) — type d'e-mail de compte ([[12 - E-mails de compte (emailer + n8n)]]).
- **Attribution** — lien `client_email → user_id` (un comptable ne voit/agit que sur ses clients).
- **responseNode / lastNode / onReceived** — modes de réponse des webhooks n8n (le dernier renvoie tout de suite → cause d'« [[12 - E-mails de compte (emailer + n8n)|échec silencieux]] »).
- **ID workflow** : `CtEh608Gl7o9N9HA`. **Spreadsheet** : `1x4ngtRTG4VQKsnOv5vnol8QNhFEoeO9j_tPDq6JB3sU`.
- **Credentials** : Sheets `crZY7KiiHqBSnSgc`, Gmail `LTVmFBZ5J2Menx6c` ([[31 - Credentials Google OAuth (Sheets & Gmail)]]).

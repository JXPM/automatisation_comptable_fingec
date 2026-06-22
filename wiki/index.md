---
type: index
tags: [index, catalogue]
updated: 2026-06-22
---

# 📇 Index du Wiki

> Catalogue **exhaustif** auto-maintenu (orienté contenu). Pour une entrée narrative « par où commencer », voir [[00 - Index (MOC)]]. Pour la chronologie, voir [[log]]. Règles : [[CLAUDE|schéma]].

## 🧭 Fondations
| Page | Résumé | Type |
|---|---|---|
| [[00 - Index (MOC)]] | Carte narrative, faits clés en 10 s, pièges | moc |
| [[01 - Vue d'ensemble]] | Le quoi/pourquoi : outil compta → app SaaS de relances | system |
| [[02 - Architecture globale]] | Schéma des flux, responsabilités, dév vs prod | system |
| [[Écosystème Fingec]] | Services Fingec + hébergement mutualisé (renvoi pharmaclick) | entity |

## ⚙️ Backend & métier
| Page | Résumé |
|---|---|
| [[10 - Backend FastAPI]] | Endpoints, config env, upload sécurisé, **proxy n8n authentifié** |
| [[11 - Authentification & comptes]] | SQLite (users + attribution), bcrypt, JWT, jetons mdp, rôles |
| [[12 - E-mails de compte (emailer + n8n)]] | Webhook `send-account-email`, modèles, **échec silencieux**, expéditeur |
| [[13 - Traitement comptable (Quadra)]] | Pipeline pandas, TVA France/Non-France, 8 anomalies, score (= **vue contrôle**) |
| [[14 - Journal d'écritures Quadra]] | **Livrable** : écritures partie double (journal VTE), mapping comptes, équilibre, config `journal_config.json` |
| [[16 - Outils en ligne de commande (cli & manage)]] | `cli.py` (traitement hors UI) + `manage.py` (admin comptes : create-admin, list…) |

## 🖥️ Frontend
| Page | Résumé |
|---|---|
| [[20 - Frontend - structure & pages]] | React 19/Vite/TS, routes (dont `/mail`), shell (sidebar+topbar), `authFetch`, AdminPage |
| [[21 - Signature e-mail & charte Fingec]] | `signatureHtml`, couleurs (#A72231/#7d1c34), `cabinet.ts`, carnet d'adresses |
| [[22 - Design system & stack frontend]] | Tailwind v4 + framer-motion + jsPDF, tokens CSS, PageHeader/AuthShell, export PDF |
| [[23 - Tableau de bord & écrans de relance]] | Dashboard (KPIs), Clients/Historique : quels boutons → quels webhooks |
| [[24 - Catalogue des composants UI]] | Tous les composants `components/` (Layout, Topbar, AuthShell, ValidationReport, ResultTable, AnomalyConsole…) |
| [[25 - Utilitaires frontend (api, cabinet, clients, exportPdf)]] | `utils/` : `authFetch`/session, signature cabinet, helpers, export PDF, tokens |
| [[26 - Pages secondaires & flux d'authentification]] | Compte, Logs, Clients/Historique, login/oubli/réinit, `ProtectedRoute` |

## 🤖 n8n & automatisation
| Page | Résumé |
|---|---|
| [[30 - Workflow n8n « fingec automatisation »]] | 41 nœuds, branches, webhooks, Google Sheet, **pas de CD** |
| [[31 - Credentials Google OAuth (Sheets & Gmail)]] | 2 credentials séparées, **expiration 7 j (Testing)**, réparer |
| [[32 - Relances clients (cycle de mails)]] | Statuts clients, déclencheurs manuels/auto, contenu des mails |

## 🚀 Infra & livraison
| Page | Résumé |
|---|---|
| [[40 - Déploiement (CI-CD & VPS)]] | GitHub Actions CI/CD, VPS Hostinger, **ssh-keyscan flaky** |
| [[41 - Caddy & routage]] | Matcher `@api`, bind-mount obsolète, sous-domaines |
| [[42 - Conteneurs, images & exécution]] | 3 conteneurs Docker (backend/frontend/n8n), images, nginx, variables d'env |
| [[43 - Vestiges Render-Vercel & fichiers brouillons]] | ✅ render.yaml/vercel.json/Journal.sh/settings.json **supprimés** (trace de la migration Render→VPS) |

## 🔒 Conformité & légal
| Page | Résumé |
|---|---|
| [[Conformité RGPD & pack légal]] | Pack `legal/` (9 docs RGPD/LCEN), 3 traitements, sous-traitants, points à trancher |

## 📚 Référence
| Page | Résumé |
|---|---|
| [[50 - Glossaire, endpoints & webhooks]] | Tableaux endpoints backend + webhooks n8n + glossaire |
| [[51 - Tests automatisés]] | Suite pytest (71 tests) par fichier, fixtures, CI bloquante |
| [[60 - Outillage du dépôt (assistant, règles, skills)]] | `.claude`/agents/rules/skills/hooks/MCP ; scaffolding générique à nettoyer |

## 📥 Sources ingérées
| Source | Date | Résumé |
|---|---|---|
| [[2026-06-17 - Session debug OAuth & refonte e-mail de compte]] | 2026-06-17 | Diagnostic OAuth, refonte e-mail de compte, incident CI |

## Métriques (au 2026-06-22)
- Pages de synthèse : **28** (+ ingestion exhaustive du dépôt : [[16 - Outils en ligne de commande (cli & manage)]], [[24 - Catalogue des composants UI]], [[25 - Utilitaires frontend (api, cabinet, clients, exportPdf)]], [[26 - Pages secondaires & flux d'authentification]], [[42 - Conteneurs, images & exécution]], [[43 - Vestiges Render-Vercel & fichiers brouillons]], [[51 - Tests automatisés]], [[60 - Outillage du dépôt (assistant, règles, skills)]]) · Sources : **1** · Statut `a-verifier` : 3 ([[31 - Credentials Google OAuth (Sheets & Gmail)]], [[Écosystème Fingec]], [[60 - Outillage du dépôt (assistant, règles, skills)]] — secret à révoquer).
- Frontmatter `type:` sur toutes les pages (requêtable via Dataview).
- Commandes actives : `/ingest` · `/query` · `/save` · `/lint` (cf. [[CLAUDE]] §8).

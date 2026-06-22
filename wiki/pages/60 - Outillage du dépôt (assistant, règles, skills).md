---
type: reference
tags: [fingec, automatisation-comptable, outillage, meta]
updated: 2026-06-22
status: a-verifier
---

# 60 — Outillage du dépôt (assistant de code, règles, skills)

Fichiers de configuration destinés à **l'assistant de code (Claude Code)** et au workflow de dév — **pas** du code applicatif livré. À distinguer du [[CLAUDE|schéma du wiki]] et du `CLAUDE.md` racine (règles métier).

## Instructions projet
- **`CLAUDE.md`** (racine) — règles **métier** : sources TikTok/Shopify, feuille `Statement`, logique TVA France (TTC/1,20), structure de sortie, validations. Source primaire de [[13 - Traitement comptable (Quadra)]].
- **`CLAUDE.local.md`** — surcharges locales non commitées.
- **`.claude/settings.local.json`** — permissions Bash/outils locales de l'assistant. ⚠️ **Contient un mot de passe en clair** (`expert@fingec.fr`) dans d'anciennes commandes `curl` → **secret à révoquer/retirer** (voir [[procedure-violation-donnees|procédure violation]] dans `legal/`).
- **`.claude/skills/ui-ux-pro-max/`** — **skill de design réel** (67 styles, 96 palettes, 57 font pairings…) utilisé pour la refonte UI. Scripts Python (`core.py`, `design_system.py`, `search.py`). [[refonte-ui-references]].

## Scaffolding générique — ✅ supprimé le 2026-06-22
Plusieurs fichiers issus d'un **gabarit générique** (références à un faux `src/`+`ui/`, « publier un package ») **ne correspondaient pas** au projet réel (`backend/` FastAPI + `frontend/` React, Docker/VPS) → **retirés du dépôt** :
- **`agents/`** (`code-reviewer.md`, `security-auditor.md`), **`commands/`** (`fix-issue.md`, `review.md`), **`rules/`** (`api-conventions.md`, `code-style.md`, `testing.md`), **`skills/deploy/`** (`SKILL.md`, `deploy-config.md`), **`hooks/validate-bash.sh`**, **`settings.json`** (racine), **`.mcp.json`** — tous supprimés.
- Ces dossiers n'étaient de toute façon **pas** lus par l'assistant de code (qui utilise `.claude/`), d'où l'absence d'impact. La vraie config MCP vit dans `~/.claude.json` ([[n8n-mcp-acces]]).

## Exports n8n (`n8n/workflows/`)
- `fingec-automatisation.json`, `fingec-automatisation.import.json`, `account-email-nodes.paste.json` — **snapshots** du workflow. ⚠️ **Périmés** par rapport au n8n en ligne (sans `send-mail`/`envoi-initial`). Source de vérité = l'instance live `n8n.fingec.fr` ([[30 - Workflow n8n « fingec automatisation »]]).

> [!tip] Pourquoi le documenter
> Ces fichiers polluent la lecture du dépôt et peuvent induire en erreur (faux « src/ui », déploiement « package »). Les lister ici évite de les prendre pour la réalité du projet.

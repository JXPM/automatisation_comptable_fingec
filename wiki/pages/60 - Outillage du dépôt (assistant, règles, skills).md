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

## ⚠️ Scaffolding générique (non aligné avec le code réel)
Plusieurs fichiers semblent issus d'un **gabarit générique** : ils mentionnent une arborescence `src/` + `ui/` et un « package » CLI, qui **ne correspondent pas** au projet réel (`backend/` FastAPI + `frontend/` React, déploiement Docker/VPS). À nettoyer ou réécrire :
- **`agents/`** : `code-reviewer.md`, `security-auditor.md` (rôles d'agents — utiles mais génériques).
- **`commands/`** : `fix-issue.md`, `review.md`.
- **`rules/`** : `api-conventions.md` (référence `src/`/`ui/`), `code-style.md` (snake_case, pandas, 4 espaces), `testing.md`.
- **`skills/deploy/`** : `SKILL.md` + `deploy-config.md` (décrit « publier un package » — sans rapport avec le déploiement Docker réel de [[40 - Déploiement (CI-CD & VPS)]]).
- **`settings.json`** (racine), **`.mcp.json`** : configs génériques peu/pas utilisées. Détail : [[43 - Vestiges Render-Vercel & fichiers brouillons]].
- **`hooks/validate-bash.sh`** : stub de validation (echo « Python disponible »).

## Exports n8n (`n8n/workflows/`)
- `fingec-automatisation.json`, `fingec-automatisation.import.json`, `account-email-nodes.paste.json` — **snapshots** du workflow. ⚠️ **Périmés** par rapport au n8n en ligne (sans `send-mail`/`envoi-initial`). Source de vérité = l'instance live `n8n.fingec.fr` ([[30 - Workflow n8n « fingec automatisation »]]).

> [!tip] Pourquoi le documenter
> Ces fichiers polluent la lecture du dépôt et peuvent induire en erreur (faux « src/ui », déploiement « package »). Les lister ici évite de les prendre pour la réalité du projet.

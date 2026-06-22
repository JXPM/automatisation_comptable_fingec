# Schéma du Wiki — Cerveau « Automatisation Comptable Fingec »

> [!info] Ce fichier configure l'agent LLM comme **mainteneur du wiki**, pas comme chatbot générique.
> Toute session travaillant dans `wiki/` lit ce fichier en premier. Il décrit la structure, les conventions et les workflows (ingest / query / lint). Co-évolue avec Johan.

Ce wiki est le **second cerveau** du projet **Automatisation Comptable Fingec** : à l'origine un outil de préparation d'écritures (TikTok/Shopify → Quadra), devenu une **app SaaS** (`app.fingec.fr`) pour le cabinet **Fingec** — auth multi-comptables, gestion clients, relances e-mail automatisées via **n8n** + Google Sheets. Voir [[01 - Vue d'ensemble]]. Fait partie de l'[[Écosystème Fingec]] (cf. cerveau voisin `pharmaclick-ci/wiki`).

---

## 1. Les trois couches

1. **Sources brutes** (`wiki/assets/`, `wiki/sources/`) — documents curés : captures, transcripts de session, exports, PDF, articles. **Immuables** : on les lit, on ne les modifie jamais. Le **code du dépôt** (`backend/`, `frontend/`, `n8n/`, configs) est aussi une source primaire, référencée par son chemin (`backend/auth.py:299`).
2. **Le wiki** (`wiki/pages/`, `wiki/sources/`, `wiki/syntheses/`) — pages markdown **générées et maintenues par le LLM**. Synthèses, pages d'entités/concepts/systèmes, résumés de sources. Johan lit ; le LLM écrit.
3. **Le schéma** (ce fichier) — règles et workflows.

---

## 2. Structure des dossiers

```
wiki/
  CLAUDE.md          ← ce schéma
  index.md           ← catalogue de tout le wiki (orienté contenu)
  log.md             ← journal chronologique append-only
  sources/           ← une page par source ingérée (résumé + lien vers le brut)
  pages/             ← pages de synthèse (entités, concepts, systèmes, MOC)
  syntheses/         ← réponses substantielles filées (via /query → /save)
  assets/            ← fichiers BRUTS (PDF, images, exports) = le "raw"
  .claude/commands/  ← /ingest /query /save /lint
```

- `pages/00 - Index (MOC).md` = **carte narrative** « par où commencer » (curatée, liens thématiques).
- `index.md` = **catalogue exhaustif** auto-maintenu (chaque page + résumé d'une ligne + métadonnées). Différent du MOC : l'un raconte, l'autre liste.

### Conventions de nommage
- **Pages de systèmes/topics** : préfixe numérique stable — l'ordre encode des familles :
  - **0x** fondations · **1x** backend & métier · **2x** frontend · **3x** n8n & automatisation · **4x** infra/déploiement · **5x** référence.
- **Pages d'entités/concepts** : nom lisible sans numéro (ex. `Écosystème Fingec.md`).
- **Sources** : `AAAA-MM-JJ - Titre court.md` (date du document/événement, pas de l'ingest).

---

## 3. Frontmatter (YAML) — obligatoire sur chaque page

```yaml
---
type: source | entity | concept | system | reference | synthesis | moc | index | log
tags: [fingec, automatisation-comptable, ...]
updated: AAAA-MM-JJ          # date de dernière modif par le LLM
status: stable | draft | a-verifier   # optionnel
sources: ["[[AAAA-MM-JJ - Titre]]"]   # sources qui appuient la page (si pertinent)
---
```
- Permet à **Dataview** de générer des tables dynamiques.
- `updated` = date du jour de la modif. Convertir toute date relative en absolue.

---

## 4. Conventions d'écriture
- **Français**, ton dense et factuel.
- **Liens internes** `[[Nom de page]]` **partout** — c'est le cœur du wiki. Lier généreusement ; un `[[lien]]` vers une page pas encore créée est OK (marque un manque à combler).
- **Callouts Obsidian** : `> [!important]`, `> [!warning]`, `> [!note]`, `> [!tip]`, `> [!question]`.
- **Contradictions** : ne JAMAIS écraser silencieusement une info qui en contredit une autre. Créer un callout `> [!warning] Contradiction` ou `> [!question] À vérifier` exposant les deux versions + leur source + date. C'est une fonctionnalité, pas un défaut.
- Citer la source d'un fait non trivial : `([[2026-06-17 - Session debug OAuth & refonte e-mail de compte]])` ou chemin de fichier `backend/main.py:469`.
- Éviter la duplication : un fait vit dans **une** page canonique ; les autres y lient.

---

## 5. Workflows

### 5.1 Ingest (ajouter une source)
Quand Johan dépose une source et demande de l'ingérer :
1. **Lire** la source en entier (PDF via Read `pages`, image via vue, code via Read, URL via WebFetch).
2. **Discuter** 2–5 takeaways clés avec Johan (ce qui surprend, ce qui contredit l'existant).
3. **Créer** `wiki/sources/AAAA-MM-JJ - Titre.md` : métadonnées + résumé structuré + lien vers le brut dans `assets/` (si fichier) + section « Ce que ça change dans le wiki ».
4. **Propager** : mettre à jour les pages d'entités/concepts/systèmes concernées (une source touche souvent 5–15 pages). Ajouter/réviser les cross-références. **Flaguer les contradictions.**
5. **Mettre à jour** `index.md` (nouvelle entrée) et **`log.md`** (entrée `ingest`).
- Par défaut : ingest **une source à la fois**, en restant impliqué. Batch possible si Johan le demande.

### 5.2 Query (poser une question)
1. Lire `index.md` pour repérer les pages pertinentes, puis y entrer (pas de RAG embeddings : l'index suffit à cette échelle).
2. Synthétiser une réponse **avec citations** (liens internes + chemins de fichiers).
3. **Filer les bonnes réponses dans le wiki** : si la réponse produit une analyse/comparaison utile, en faire une **nouvelle page** `syntheses/` (ne pas la laisser mourir dans le chat). Mettre à jour `index.md` + `log.md` (entrée `query`).

### 5.3 Lint (santé du wiki)
Sur demande, passer en revue :
- **contradictions** entre pages, **affirmations périmées** (le code a évolué depuis).
- **pages orphelines** (aucun lien entrant), **concepts cités sans page dédiée**, **cross-références manquantes**.
- **trous de données** comblables par une lecture de code ou une recherche web.
- Proposer de **nouvelles questions à creuser** et **nouvelles sources** à chercher.
- Journaliser le passage (`log.md`, entrée `lint`).

---

## 6. Format du log (`log.md`)
Append-only. Chaque entrée commence par un préfixe **parsable** :
```
## [AAAA-MM-JJ] <ingest|query|lint|setup|maintenance> | <titre court>
- détail…
```
→ `grep "^## \[" wiki/log.md | tail -5` donne les 5 dernières actions.

---

## 7. Garde-fous
- **Ne pas committer** sans que Johan le demande. Le wiki est un repo git (sous le dépôt projet) → historique gratuit.
- **Ne pas toucher** le code applicatif depuis une session « wiki » sauf demande explicite : ici on documente, on ne refactore pas.
- Le `CLAUDE.md` **racine** du dépôt décrit le **logiciel** (règles métier TVA, etc.) ; **ce** fichier décrit le **wiki**. Ne pas les confondre.
- Vérifier qu'un fait issu d'une page reflète encore le code **avant** de s'en servir comme vérité (le code évolue ; les pages datent).

## 8. Commandes (slash) — installées
Quatre commandes (dans `.claude/commands/`, adaptées du repo BenBktech « Un-second-cerveau-Obsidian-Claude ») délèguent aux workflows du §5 :
- **`/ingest <source>`** — ingérer une source (workflow §5.1).
- **`/query <question>`** — répondre depuis le wiki (workflow §5.2).
- **`/save [slug]`** — filer la dernière réponse dans `wiki/syntheses/` (`type: synthesis`).
- **`/lint`** — santé du wiki (workflow §5.3).

---
type: concept
tags: [fingec, automatisation-comptable, rgpd, conformite, legal]
updated: 2026-06-22
status: draft
---

# Conformité RGPD & pack légal

État de la conformité « données personnelles » et « obligations légales web » de l'app **app.fingec.fr**. Pack documentaire créé le **2026-06-22** dans `legal/` (à la racine du dépôt).

> [!important] Idée reçue corrigée
> On **ne dépose plus** de dossier RGPD à la CNIL : la déclaration préalable a été **supprimée en mai 2018**. Régime actuel = **accountability** (documentation tenue en interne, présentée en cas de contrôle). On ne saisit la CNIL que pour une **violation** (72 h) ou la désignation d'un DPO.

## Le pack `legal/`
| Fichier | Nature | Obligatoire |
|---|---|---|
| `mentions-legales.md` | Public (LCEN) | ✅ |
| `politique-de-confidentialite.md` | Public (art. 13-14) + cookies | ✅ |
| `cgu.md` | Public | Recommandé |
| `registre-des-traitements.md` | Interne (art. 30) | ✅ |
| `sous-traitants.md` | Interne (art. 28) | ✅ |
| `politique-de-conservation.md` | Interne | ✅ |
| `procedure-violation-donnees.md` | Interne (art. 33-34) | ✅ |
| `dpa-modele-sous-traitance.md` | Modèle (art. 28) | Selon rôle |
| `evaluation-aipd.md` | Interne (art. 35) | Conditionnel |

## Données personnelles traitées (3 traitements)
1. **Comptes utilisateurs** — e-mail, nom, hash bcrypt, rôle ; SQLite `app.db` ([[11 - Authentification & comptes]]).
2. **Clients & relances** — nom, e-mail, statut, historique ; Google Sheets + Gmail ([[30 - Workflow n8n « fingec automatisation »]]).
3. **Fichiers comptables** — relevés e-commerce ; upload **supprimé après traitement**, sorties agrégées ([[13 - Traitement comptable (Quadra)]]).

## Identité du responsable de traitement (renseignée 2026-06-22)
**Fingec** — EURL au capital de **1 000 €**, SIRET **808 015 994 00037**, RCS 808 015 994 Strasbourg, TVA FR49808015994, siège **6 rue Frédéric Chopin, 67118 Geispolsheim**, gérant **Ohouo N'Katta**. Contact : **expert@fingec.fr** / **+33 (0)9 83 00 08 43**. Référent technique : Johan. **DPO : non désigné** (non obligatoire). Hébergement : Hostinger, datacenter **Paris (UE)**. **Seul reste à compléter : n° d'inscription à l'Ordre des experts-comptables (Alsace).**

## Sous-traitants (art. 28)
- **Hostinger** (hébergement VPS, **héberge tout** : back, front, SQLite, n8n) — ⬜ DPA à archiver, ⬜ **confirmer datacenter en UE** ([[40 - Déploiement (CI-CD & VPS)]], [[Écosystème Fingec]]).
- **Google** (Sheets + Gmail) — ✅ compte **Workspace pro** confirmé (couvert par le Cloud DPA) ; ⬜ DPA à archiver ([[31 - Credentials Google OAuth (Sheets & Gmail)]]).
- **n8n** auto-hébergé → **pas** un sous-traitant tiers ; frontend sur le même VPS → **pas de Vercel** ([[02 - Architecture globale]]).

> [!success] Rôle RGPD tranché (2026-06-22)
> Fingec agit en **responsable de traitement autonome** (pour les comptes utilisateurs ET les données clients de la mission comptable). Conséquences : Fingec informe lui-même les personnes (politique de confidentialité) ; pas d'accord de sous-traitance imposé aux clients. `dpa-modele-sous-traitance.md` conservé pour le cas résiduel d'une prestation strictement sur instruction d'un client.

## Trous techniques — ✅ comblés (2026-06-22)
- ✅ **Purge automatique** quotidienne (`_purge_loop`, `backend/main.py`) : exports `output/*.xlsx` > `OUTPUT_RETENTION_DAYS` (90 j), entrées `logs.json` > `LOGS_RETENTION_DAYS` (365 j), jetons `password_tokens` utilisés/expirés (`auth.purge_expired_tokens`). Configurable par env ; testé (`tests/test_retention.py`, 4 tests).
- ⬜ (organisationnel) Procédure de suppression de compte au départ d'un collaborateur — la suppression libère déjà les clients attribués (`backend/auth.py`).

## Lien avec le monitoring
La **détection** d'une violation de données suppose un minimum d'observabilité (suivi d'erreurs, accès, uptime) — aujourd'hui **absent**. Voir le chantier monitoring (à documenter). La procédure `procedure-violation-donnees.md` reste théorique tant qu'on ne sait pas détecter l'incident.

## AIPD
Non requise à ce stade (0–1 critère de risque élevé). **À réévaluer dès l'introduction d'une IA décisionnelle** (détection auto, Dext) ou d'un passage multi-tenants — cf. `evaluation-aipd.md`.

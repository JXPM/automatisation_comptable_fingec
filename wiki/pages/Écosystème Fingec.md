---
type: entity
tags: [fingec, ecosysteme, hebergement]
updated: 2026-06-17
status: a-verifier
---

# Écosystème Fingec

**Fingec** est un cabinet d'expertise comptable orienté e-commerce. Plusieurs services cohabitent ; ce cerveau couvre **Automatisation Comptable** (`app.fingec.fr`). Le cerveau voisin `pharmaclick-ci/wiki` couvre **Pharmaclick** et documente l'hébergement mutualisé.

## Services connus
| Service | Domaine | Statut ici |
|---|---|---|
| **Automatisation Comptable** (ce projet) | `app.fingec.fr` | ✅ documenté ([[01 - Vue d'ensemble]]) |
| **n8n** (automatisation) | `n8n.fingec.fr` | ✅ [[30 - Workflow n8n « fingec automatisation »]] |
| **Site vitrine Fingec** (Next.js) | `fingec.fr` | ↗ voir cerveau pharmaclick |
| **Pharmaclick CI** (Click & Collect Cagyl) | `cagylshop.com` | ↗ cerveau `pharmaclick-ci/wiki` |
| **Dolibarr** (ERP) | Hostinger Business | ↗ cerveau pharmaclick |

## Hébergement (rappel)
- Plusieurs services **dockerisés sur un même VPS Hostinger** (`srv1713887`), derrière un **Caddy partagé**. [[41 - Caddy & routage]] · [[40 - Déploiement (CI-CD & VPS)]].

> [!question] À vérifier / compléter
> La liste exacte des services et la cartographie d'hébergement sont mieux tenues dans le cerveau `pharmaclick-ci/wiki` ([[Écosystème Fingec & Hébergement]] là-bas). Ici on ne garde que ce qui touche l'Automatisation Comptable. Synchroniser si divergence.

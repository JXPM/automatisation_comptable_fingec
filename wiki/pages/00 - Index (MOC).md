---
type: moc
tags: [fingec, automatisation-comptable, moc]
updated: 2026-06-17
---

# 🧭 00 — Index (MOC) — Par où commencer

> Carte **narrative** du cerveau. Pour le catalogue exhaustif, voir [[index]]. Pour la chronologie, voir [[log]]. Règles : [[CLAUDE|schéma]].

## En 10 secondes
- **Quoi** : app SaaS du cabinet **Fingec** pour automatiser la compta e-commerce + la **relance des clients** par e-mail. Live sur **`app.fingec.fr`**.
- **Deux cœurs** : (1) un **moteur de traitement** TikTok/Shopify → export **Quadra** ([[13 - Traitement comptable (Quadra)]]) ; (2) une **plateforme de relances clients** pilotée par **n8n** + Google Sheets ([[30 - Workflow n8n « fingec automatisation »]]).
- **Stack** : FastAPI (backend) + React/Vite (frontend) + n8n (automatisation) + Google Sheets (données clients) + Docker/Caddy sur **VPS Hostinger**.

## Les chemins de lecture
1. **Comprendre le produit** → [[01 - Vue d'ensemble]] → [[02 - Architecture globale]].
2. **Le backend** → [[10 - Backend FastAPI]] → [[11 - Authentification & comptes]] → [[12 - E-mails de compte (emailer + n8n)]].
3. **Le métier comptable** → [[13 - Traitement comptable (Quadra)]].
4. **Le frontend** → [[20 - Frontend - structure & pages]] → [[21 - Signature e-mail & charte Fingec]].
5. **L'automatisation** → [[30 - Workflow n8n « fingec automatisation »]] → [[31 - Credentials Google OAuth (Sheets & Gmail)]] → [[32 - Relances clients (cycle de mails)]].
6. **Mettre en ligne** → [[40 - Déploiement (CI-CD & VPS)]] → [[41 - Caddy & routage]].
7. **Référence rapide** → [[50 - Glossaire, endpoints & webhooks]].

## ⚠️ Pièges à retenir
- Les credentials Google OAuth de n8n (**Sheets ET Gmail, séparées**) **expirent tous les 7 jours** en mode « Testing ». [[31 - Credentials Google OAuth (Sheets & Gmail)]].
- Le workflow n8n **n'est pas déployé par le CD** — il vit dans n8n, édité à la main. [[40 - Déploiement (CI-CD & VPS)]].
- Tout nouveau préfixe d'API backend doit être ajouté au **matcher `@api` du Caddyfile** partagé (sinon → SPA). [[41 - Caddy & routage]].

## Contexte plus large
- [[Écosystème Fingec]] — les services Fingec et l'hébergement mutualisé (voir aussi le cerveau `pharmaclick-ci/wiki`).

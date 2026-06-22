---
type: source
tags: [fingec, automatisation-comptable, session, n8n, email, ci-cd]
updated: 2026-06-17
---

# 2026-06-17 — Session : debug OAuth, refonte e-mail de compte, CI

> Source = transcript de la session de travail Johan ↔ Claude Code du 2026-06-17. Brut conservé ici ; faits propagés dans les pages liées.

## 1. Diagnostic des erreurs n8n (exécutions en erreur)
- Symptôme : exécutions du [[30 - Workflow n8n « fingec automatisation »|workflow]] en erreur (ex. #106, #113) — `NodeApiError` / `httpCode: EAUTH`, *« refresh token invalid/expired/revoked »* sur les nœuds Google Sheets.
- Cause : **credential Google OAuth expirée**. Diagnostic clé : **Sheets et Gmail sont deux credentials séparées**, et l'app OAuth en mode **Testing** voit ses refresh tokens révoqués **tous les 7 jours**. → [[31 - Credentials Google OAuth (Sheets & Gmail)]].
- Confusion « ancienne version » : levée — `versionId == activeVersionId` ; le workflow actif EST le dernier. Et **le CD ne déploie pas n8n**. → [[40 - Déploiement (CI-CD & VPS)]].
- Constat horaire : à 19:56 Sheets plantait encore (#113) ; à 20:04 Sheets OK (#130+) → **Sheets reconnecté entre les deux** par Johan. Gmail resté à reconnecter séparément.

## 2. Mail d'invitation non reçu
- En créant un utilisateur, pas de mail. Cause : même famille — le nœud `Send Account Email` (Gmail) échouait, et le webhook répondant `onReceived`, le backend croyait l'envoi réussi (**échec silencieux**). → [[12 - E-mails de compte (emailer + n8n)]].
- (Johan avait aussi rempli le champ mot de passe → pas d'invitation ce coup-là.)

## 3. Changements livrés
- **Frontend** (`AdminPage.tsx`) : **suppression du champ « Mot de passe »** à la création → invitation systématique. Commit `73bd777`. → [[11 - Authentification & comptes]] · [[20 - Frontend - structure & pages]].
- **n8n nœud `Send Account Email`** (publié, versions `5e6a4de2` puis `cf58e21b`) :
  - `senderName = "Cabinet Fingec"`, `replyTo = contact@fingec.fr`, `appendAttribution = false`.
  - Message refondu : **carte HTML** (fond gris, carte blanche, bandeau `#7d1c34`, logo) + **bienvenue chaleureux + emojis** (🎉✨🔐) pour `kind=setup` + **signature identique à « Nouveau message »**. → [[12 - E-mails de compte (emailer + n8n)]] · [[21 - Signature e-mail & charte Fingec]].
- **Backend** (`emailer.py`) : sujet `setup` → « Bienvenue chez Fingec 🎉 — définissez votre mot de passe ». Commit `46eba40`.
- **Fichier de référence** `n8n/workflows/account-email-nodes.paste.json` synchronisé avec le live (credential « Gmail account » `LTVmFBZ5J2Menx6c`).

## 4. Tests d'envoi
- Le webhook public `/n8n/webhook/send-account-email` renvoie **401** (proxy backend authentifié) → impossible de tester en POST direct. `execute_workflow` MCP écarté (risque de déclencher la mauvaise branche et mailer de vrais clients).
- Test réel via **`POST /auth/forgot-password`** (endpoint public, même nœud Gmail) → exécution **#136 success**, Gmail a renvoyé un message id (labels `SENT/INBOX`) → mail livré à `bilejohan04@gmail.com`. Variante `reset` (montre carte + signature + expéditeur, pas le texte de bienvenue `setup`).

## 5. Incident CI
- Le déploiement du commit `46eba40` a **échoué** : étape `ssh-keyscan` « Add VPS to known_hosts » — port 22 injoignable après 5 tentatives (**flaky**, pas un problème de code ; le commit précédent avait déployé). → **`gh run rerun --failed`** → **succès** (tests, rsync, build, healthcheck). → [[40 - Déploiement (CI-CD & VPS)]].

## 6. Expéditeur — décision ouverte
- L'adresse reste `bilejohan04@gmail.com` (compte connecté). Pour `contact@fingec.fr` : reconnecter la credential Gmail avec ce compte, ou alias « Envoyer en tant que ». → [[31 - Credentials Google OAuth (Sheets & Gmail)]].

## Ce que ça change dans le wiki
- Crée/alimente : [[31 - Credentials Google OAuth (Sheets & Gmail)]], [[12 - E-mails de compte (emailer + n8n)]], [[40 - Déploiement (CI-CD & VPS)]].
- Met à jour : [[11 - Authentification & comptes]] (champ mdp retiré), [[20 - Frontend - structure & pages]], [[30 - Workflow n8n « fingec automatisation »]].
- Questions ouvertes : publier l'app OAuth Google (Testing → Production) ; brancher `contact@fingec.fr`.

---
type: concept
tags: [fingec, automatisation-comptable, n8n, oauth, google]
updated: 2026-06-17
status: a-verifier
sources: ["[[2026-06-17 - Session debug OAuth & refonte e-mail de compte]]"]
---

# 31 — Credentials Google OAuth (Sheets & Gmail)

Le [[30 - Workflow n8n « fingec automatisation »|workflow n8n]] utilise **deux credentials OAuth Google distinctes** :

| Credential | ID | Type | Usage |
|---|---|---|---|
| **Google Sheets account** | `crZY7KiiHqBSnSgc` | `googleSheetsOAuth2Api` | lecture/écriture des feuilles (clients, historique) |
| **Gmail account** | `LTVmFBZ5J2Menx6c` | `gmailOAuth2` | tous les nœuds d'envoi de mail |

> [!warning] Expiration tous les 7 jours (mode « Testing »)
> Symptôme : `NodeApiError` / `httpCode: EAUTH` — *« refresh token is invalid, expired, revoked… »*. **Cause** : l'app OAuth Google est en mode **Testing**, donc Google révoque les refresh tokens **au bout de 7 jours**.
> - Les deux credentials sont **indépendantes** : reconnecter Sheets ne reconnecte pas Gmail. Vu le 2026-06-17 (Sheets reconnecté ~22:04 → dashboard OK ; Gmail à reconnecter séparément).
> - Conséquence trompeuse : le webhook `send-account-email` répond `onReceived`, donc le backend croit l'e-mail envoyé alors que Gmail échoue ([[12 - E-mails de compte (emailer + n8n)]]).

## Réparer
1. **Ponctuel** : n8n → Credentials → reconnecter « Gmail account » ET « Google Sheets account » (Reconnect / Connect my account).
2. **Définitif** : Google Cloud Console → *OAuth consent screen* → passer l'app de **Testing** à **In production** (Publish app). Les tokens cessent alors d'expirer tous les 7 jours.

## Changer l'adresse expéditrice
- L'adresse d'envoi = **le compte Google connecté** dans « Gmail account » (au 2026-06-17 : `bilejohan04@gmail.com`).
- Pour envoyer depuis **`contact@fingec.fr`** : soit reconnecter la credential avec ce compte, soit configurer un **alias Gmail « Envoyer en tant que »**. Le `senderName` (« Cabinet Fingec ») et le `replyTo` (`contact@fingec.fr`) sont déjà en place ([[12 - E-mails de compte (emailer + n8n)]]).

> [!question] À vérifier
> Statut OAuth « Testing » vs « In production » non confirmé côté Google Cloud Console. Si Johan publie l'app, lever le `status: a-verifier`.

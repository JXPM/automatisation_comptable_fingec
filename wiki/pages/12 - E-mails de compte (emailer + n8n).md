---
type: system
tags: [fingec, automatisation-comptable, backend, email, n8n]
updated: 2026-06-17
sources: ["[[2026-06-17 - Session debug OAuth & refonte e-mail de compte]]"]
---

# 12 — E-mails de compte (emailer + n8n)

E-mails **de compte** (création / mot de passe), **distincts** des relances clients ([[32 - Relances clients (cycle de mails)]]). Gérés par `backend/emailer.py` → webhook n8n dédié.

## Flux
```
backend (emailer.send_account_email)
   → POST {N8N_BASE_URL}/webhook/send-account-email
       { to, kind, subject, intro, full_name, link }
   → n8n: webhook "POST Account-Email" → nœud Gmail "Send Account Email"
   → e-mail HTML envoyé
```

## `emailer.py`
- 3 modèles (`_TEMPLATES`) par `kind` : **`setup`** (bienvenue / définir mdp), **`reset`** (oubli), **`changed`** (mdp modifié). Chaque modèle = `(sujet, intro)`.
  - Sujet `setup` (depuis 2026-06-17) : **« Bienvenue chez Fingec 🎉 — définissez votre mot de passe »**.
- `_post_webhook` : best-effort. Si `ACCOUNT_EMAIL_WEBHOOK_PATH` vide ou échec → **repli sur log stdout** (`📧 [repli e-mail]`), l'API ne casse jamais. `reset_link(token)` = `{APP_BASE_URL}/reset-password?token=…`.
- `send_account_email` ne **lève jamais** ; renvoie `True` si le webhook a accepté.

> [!warning] Échec silencieux
> Le webhook `send-account-email` répond **`onReceived`** (immédiatement), *avant* que le nœud Gmail tourne. Le backend renvoie donc `setup_email_sent: true` même si l'envoi Gmail échoue ensuite (credential expirée). L'UI affiche « e-mail envoyé » alors que rien n'est parti. Vu le 2026-06-17. Cause typique : [[31 - Credentials Google OAuth (Sheets & Gmail)]].

## Rendu HTML (côté n8n)
Le HTML final est **construit dans le nœud n8n** `Send Account Email` (expression JS), pas dans le backend — pour modifier le modèle sans redéployer. État au 2026-06-17 :
- **Carte HTML** : fond gris `#f4f4f5`, carte blanche encadrée (radius 14), **bandeau bordeaux `#7d1c34`** + logo 95px, pied de page disclaimer.
- **Corps `setup`** : message de **bienvenue chaleureux + emojis** (🎉 ✨ 🔐) ; sinon `b.intro`.
- **Bouton** « Définir / Réinitialiser mon mot de passe » + lien de secours (valable 1 h).
- **Signature** : reproduite **à l'identique** de l'onglet « Nouveau message » ([[21 - Signature e-mail & charte Fingec]]) — bord-haut `2px #A72231`, logo 88px, « Cabinet Fingec », adresse, mention de l'Ordre, `contact@fingec.fr | www.fingec.fr`.

## Expéditeur
- Options du nœud Gmail : `senderName = "Cabinet Fingec"`, `replyTo = contact@fingec.fr`, `appendAttribution = false` (retire « sent with n8n »).
- > [!note] L'**adresse réelle** reste celle du compte Google connecté dans la credential Gmail (`bilejohan04@gmail.com` au 2026-06-17). Pour qu'elle devienne `contact@fingec.fr` : connecter ce compte dans la credential, ou configurer un alias « Envoyer en tant que » Gmail. [[31 - Credentials Google OAuth (Sheets & Gmail)]].

## Fichier de référence
- `n8n/workflows/account-email-nodes.paste.json` — export des 2 nœuds (webhook + Gmail), synchronisé avec le live le 2026-06-17.

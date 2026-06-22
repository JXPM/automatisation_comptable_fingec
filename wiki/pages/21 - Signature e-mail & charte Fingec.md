---
type: concept
tags: [fingec, automatisation-comptable, frontend, email, charte]
updated: 2026-06-17
---

# 21 — Signature e-mail & charte Fingec

La signature de l'onglet **« Nouveau message »** ([[20 - Frontend - structure & pages]], `MailPage.tsx`) est la **référence canonique** réutilisée ailleurs (notamment les [[12 - E-mails de compte (emailer + n8n)|e-mails de compte]]).

## Couleurs (charte)
- **Rouge signature / Nouveau message** : `RED = #A72231` (`MailPage.tsx:27`) = `B` de [[22 - Design system & stack frontend|theme.ts]].
- **Bordeaux carte / e-mails de compte** : `#7d1c34`.
- **Logo** (hébergé publiquement, indispensable pour l'affichage e-mail), `CABINET_LOGO` dans `utils/cabinet.ts` :
  `https://raw.githubusercontent.com/fingec/fingec-assets/refs/heads/main/fing.png`

## Coordonnées du cabinet (`utils/cabinet.ts`)
- Persistées en **localStorage** (`fingec_cabinet`), **éditables en direct depuis MailPage** (bouton « Modifier les coordonnées » → adresse / téléphone / contact / mention ordre ; `saveCabinet` à chaque frappe).
- `DEFAULT_CABINET` :
  - adresse : `12 rue Exemple, 67000 Strasbourg`
  - téléphone : `` (vide → masqué)
  - ordre : `Cabinet membre de l'Ordre des Experts-Comptables d'Alsace`
  - contact : `contact@fingec.fr | www.fingec.fr`

> [!success] Adresse corrigée (2026-06-22) dans le code
> `DEFAULT_CABINET.adresse` = **6 rue Frédéric Chopin, 67118 Geispolsheim** (vraie adresse, [[Conformité RGPD & pack légal]]).
> [!warning] Mais 4 nœuds n8n EN LIGNE gardent le placeholder « 12 rue Exemple »
> Vérifié sur le live (2026-06-22) : l'adresse `12 rue Exemple, 67000 Strasbourg` est codée en dur dans **4 nœuds Gmail** : `Send a message`, `Send a message2`, `Send initial mail`, `Send Account Email`. Comme n8n n'a pas de CD, **à corriger directement dans l'instance `n8n.fingec.fr`** (et re-exporter ensuite) → mettre `6 rue Frédéric Chopin, 67118 Geispolsheim`. [[12 - E-mails de compte (emailer + n8n)]].

## Structure de la signature (`signatureHtml`)
Table compatible e-mail, **bord-haut `2px solid #A72231`** :
- **logo 88px** à gauche ;
- **nom** (`full_name` de l'expéditeur, ou « Cabinet Fingec ») en **18px gras** rouge ;
- sous-titre « Cabinet Fingec » (13px) ;
- téléphone (si renseigné) ;
- adresse (12px `#555`) ; mention de l'Ordre (12px `#444`) ; contact (12px rouge).

## `buildEmailHtml`
- Corps saisi (paragraphes échappés) + « Cordialement, » + `signatureHtml`. Envoi via `POST /n8n/webhook/send-mail`.
- **Payload réel** (`MailPage.send`) : `{ from: user.email, to: "<emails séparés par virgule>", subject, message: <HTML> }`. Le HTML voyage dans le champ **`message`**.

> [!success] Vérifié sur le n8n EN LIGNE (2026-06-22) — les deux étaient vrais
> Le flux `send-mail` (instance live `n8n.fingec.fr`, workflow `CtEh608Gl7o9N9HA`) :
> 1. Webhook `send-mail` reçoit `{from, to, subject, message}`.
> 2. Nœud Code **`Split recipients`** : découpe `to` (virgule/`;`/espace/retour) en e-mails et mappe **`html = body.message`** (`\n`→`<br>`) → un item par destinataire `{email, subject, html}`.
> 3. Nœud Gmail **`Send composed mail`** : `sendTo={{ $json.email }}`, `subject={{ $json.subject }}`, `message={{ $json.html }}`.
>
> Donc le frontend (`message`) **et** l'ancien `{{ $json.html }}` sont cohérents, reliés par `Split recipients`. ⚠️ L'**export du dépôt** `n8n/workflows/*.json` est **périmé** : il ne contient ni `send-mail` ni `envoi-initial` (présents en live). [[30 - Workflow n8n « fingec automatisation »]].

## Carnet d'adresses (MailPage)
- Destinataires en **autocomplétion** : annuaire fusionné **clients** (`/api/clients`) + **collaborateurs** (`/auth/users`, admin), dédoublonné par e-mail, navigable au clavier (↑/↓, Entrée/`,`/`;`, Backspace pour retirer). Chips par destinataire. Objets fréquents proposés en un clic (`SUBJECT_SUGGESTIONS`).

> [!note] Réutilisation
> Les e-mails de compte ([[12 - E-mails de compte (emailer + n8n)]]) reproduisent cette signature **à l'identique** dans le nœud n8n, car n8n ne peut pas lire le localStorage du navigateur — les valeurs `DEFAULT_CABINET` y sont donc codées en dur.

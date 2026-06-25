# 📘 Guide de prise en main — Application Fingec

> **À qui s'adresse ce guide ?** À toute personne qui utilise l'application Fingec (`https://app.fingec.fr`) : comptables (rôle **utilisateur**) et responsables du cabinet (rôle **admin**).
> **Objectif :** comprendre, écran par écran, à quoi sert chaque fonction, ce que signifie chaque **statut**, et comment éviter les pièges courants.
>
> 💡 Ce guide est relançable à tout moment dans Claude Code avec la commande **`/guide`**.

---

## 🧭 1. En un coup d'œil

Fingec fait **deux métiers** dans une seule app :

1. **Préparer la comptabilité** — on dépose un fichier TikTok ou Shopify, l'app calcule la TVA et génère un **journal d'écritures prêt à importer dans Quadra** (+ un rapport de contrôle qualité).
2. **Relancer les clients** — suivre quels clients ont envoyé leurs pièces comptables, leur envoyer des mails de relance, et tout historiser mois par mois.

Deux niveaux d'accès :

| Rôle | Ce qu'il voit / peut faire |
|---|---|
| **Utilisateur** (comptable) | Ses **propres** clients attribués, traiter des fichiers, envoyer des mails. |
| **Admin** (cabinet) | **Tout** : tous les clients, la gestion des comptes, l'attribution des clients aux comptables. |

---

## 🔑 2. Se connecter

### Première connexion (invitation)
Quand l'admin crée votre compte, **vous ne recevez pas de mot de passe**. Vous recevez un **e-mail d'invitation** « Bienvenue chez Fingec 🎉 — définissez votre mot de passe ». Cliquez sur le bouton → vous définissez votre mot de passe → vous pouvez vous connecter.

- Le lien d'invitation est valable **72 h**.
- Tant que le mot de passe n'est pas défini, la connexion est impossible.

### Connexion quotidienne (`/login`)
- E-mail + mot de passe.
- **« Se souvenir de moi »** : coché → vous restez connecté même après fermeture du navigateur ; décoché → la session dure le temps de l'onglet.
- La session expire automatiquement après **8 h**.

### Mot de passe oublié (`/forgot-password`)
- Saisissez votre e-mail → vous recevez un lien de réinitialisation (valable **2 h**).
- ⚠️ Le message affiché est **toujours le même** (« si un compte existe… »), même si l'e-mail est inconnu. C'est **volontaire** (sécurité : on n'indique pas à un attaquant si un e-mail existe).

> [!note] Sécurité anti-attaque
> Après **5 tentatives de connexion ratées en 15 min**, la connexion est temporairement bloquée. Idem pour la page « mot de passe oublié » (**5 demandes / heure**). C'est une protection automatique ; réessayez un peu plus tard.

---

## 🗺️ 3. Se repérer dans l'app

- **Barre latérale gauche** (bordeaux) = la navigation : **Accueil**, **Traitement**, **Clients**, **Historique**, **Nouveau mail**, **Logs**, et **Admin** (visible uniquement pour les admins).
- **En haut à droite** = votre **avatar** (vos initiales). Cliquez dessus pour : **Paramètres du compte** ou **Se déconnecter**.

---

## 🏠 4. Accueil (le tableau de bord)

Page d'arrivée. Elle résume l'activité du **mois en cours**.

**Chiffres clés :**
| Indicateur | Signification |
|---|---|
| **Clients suivis** | Nombre de clients que vous gérez. |
| **Taux de réception** | Part des clients ayant transmis leurs pièces (`reçus / total`). Badge vert si ≥ 80 %. |
| **Fichiers traités ce mois** | Nombre de fichiers passés dans « Traitement ». |
| **Lignes générées ce mois** | Total des lignes comptables produites. |

**Actions à faire** (raccourcis vers ce qui demande votre attention) :
- **Documents en attente** → clients qui n'ont pas encore le statut « Reçu ».
- **Traitements à vérifier** → fichiers traités avec des erreurs.
- **Relances en cours** → clients au statut « Relancé ».

Plus bas : les **derniers traitements** et les **clients en attente**, avec des raccourcis rapides (Traiter un fichier, Relancer un client, Nouveau mail).

---

## 📊 5. Traitement d'un fichier comptable

C'est le cœur comptable. Onglet **Traitement** (`/traitement`).

### Étapes
1. **Déposez le fichier** : Excel `.xlsx` (TikTok) ou CSV (Shopify).
2. **Choisissez le pays** : **France** ou **Non-France** (voir règle TVA ci-dessous).
3. **Société / dossier** (facultatif) : ce texte apparaît en en-tête du journal Quadra. Si vide → « Journal des ventes ».
4. Lancez → l'app affiche un **aperçu**, un **score de fiabilité** et la **liste des anomalies**.

### La règle de TVA (importante)
| Pays | Ce que fait l'app |
|---|---|
| **France** | Considère les montants comme **TTC** : calcule le HT (`montant ÷ 1,20`) et la TVA (20 %). |
| **Non-France** | Aucune TVA : les montants sont pris tels quels. |

### Les deux fichiers produits
- **🟢 Journal Quadra** (`journal_….xlsx`) = **le livrable**. Écritures en partie double (Débit = Crédit), prêtes à importer dans Cegid Quadra.
- **Synthèse** (`output_….xlsx`) = une **vue de contrôle** (1 ligne par jour) pour vérifier d'un coup d'œil. Ce n'est pas ce qu'on importe.
- **Exporter PDF** = le rapport de contrôle au format PDF.

> [!warning] Journal Quadra : TikTok seulement pour l'instant
> Le journal d'écritures n'est généré que pour les **fichiers TikTok (Excel)**. Pour un **CSV Shopify**, seule la synthèse est produite (le modèle de journal Shopify n'est pas encore défini).

### Le score de fiabilité et les anomalies
Le score part de 100 et **baisse** selon les problèmes détectés (−15 par erreur, −5 par avertissement). Les 8 contrôles :

| Anomalie | Gravité | Ce que ça veut dire |
|---|---|---|
| **Valeur manquante** | 🔴 erreur | Une case obligatoire est vide. |
| **Ventes négatives** | 🔴 erreur | `net_sales < 0` (remboursements ?). |
| **Frais/port négatifs** | 🟠 avert. | Frais ou livraison négatifs. |
| **Incohérence de total** | 🔴 erreur | Le total ne correspond pas à la somme des composants (tolérance 5 %). |
| **Incohérence de TVA** | 🟠 avert. | Le ratio TVA/HT n'est pas ~20 % (France). |
| **Montant aberrant** | 🟠 avert. | Une ligne très éloignée des autres. |
| **Doublon** | 🟠 avert. | Même date + même total qu'une autre ligne. |
| **Date future** | 🔵 info | Une date postérieure à aujourd'hui. |

Cliquer sur une anomalie **surligne** les lignes concernées dans le tableau.

---

## 👥 6. Clients — et **les statuts expliqués**

Onglet **Clients** (`/clients`). C'est ici qu'on suit qui a transmis ses pièces et qu'on déclenche les relances.

> Vous ne voyez que **vos** clients attribués (un admin voit tout, avec une colonne « Assigné à »).
> Recherche par nom/e-mail + filtre par statut. Mini-stats : Total / Reçus / En attente.

### 🟡 Les 4 statuts d'un client
C'est le point central du suivi. Un client passe typiquement par ces états dans l'ordre :

| Statut | Signification | Comment on y arrive |
|---|---|---|
| **En attente** | Aucun mail ne lui a encore été envoyé ce mois. | État de départ. |
| **Envoyé** | Le **premier mail** (« transmettez vos documents ») a été envoyé. | Bouton **« Envoyer le mail »**. |
| **Relancé** | Une **relance** a été envoyée car il n'a pas encore répondu. | Bouton **« Relancer »** (incrémente le nombre de relances). |
| **Reçu** | ✅ Le client a **transmis ses pièces**. Le cycle est terminé pour ce mois. | Bouton **« ✓ Reçu »**. |

### Les actions disponibles (selon le statut)
| Bouton | Apparaît quand… | Effet |
|---|---|---|
| **Envoyer le mail** | statut = **En attente** | Envoie le 1er mail → passe à **Envoyé**. |
| **Relancer** | statut ≠ En attente **et** ≠ Reçu | Envoie une relance → passe/reste à **Relancé**. |
| **✓ Reçu** | statut ≠ Reçu | Marque comme **Reçu** (clôt le suivi du mois). |

Chaque action demande une **confirmation**, puis la liste se recharge automatiquement avec un message de succès ou d'erreur.

> [!important] Sécurité d'attribution
> Un comptable ne peut déclencher une action **que sur ses clients attribués**. Même en contournant l'interface, le serveur revérifie et refuse les actions sur un client qui ne vous appartient pas.

### Réinitialisation mensuelle (automatique)
Le **1er de chaque mois**, le système **archive** le mois écoulé dans l'Historique puis **remet les compteurs à zéro** (les clients repassent « En attente » pour le nouveau mois). Il y a aussi un **envoi initial automatique** programmé en début de mois.

### Attribution (admin uniquement)
Sur chaque ligne, l'admin a un menu déroulant pour **attribuer le client à un comptable**. Le changement est immédiat (et annulé automatiquement en cas d'erreur réseau).

---

## 📅 7. Historique

Onglet **Historique** (`/historique`). Le suivi des envois **mois par mois** (une fois archivé par la réinitialisation mensuelle).

- Groupé par mois, avec un **taux de réception** par mois.
- Un **bandeau d'alerte** signale les clients **non reçus du dernier mois** pour inciter à relancer.
- Filtres : recherche, mois, statut (Reçu / Non reçu uniquement).
- Bouton **« Relancer »** sur les lignes non reçues.

---

## ✉️ 8. Nouveau mail

Onglet **Nouveau mail** (`/mail`). Pour composer et envoyer un e-mail libre (1 à N destinataires), avec la signature du cabinet.

### Choisir les destinataires
- Tapez un **nom** ou une **adresse**, ou choisissez dans le **carnet d'adresses** (vos clients + les collaborateurs).
- Touche **Entrée** (ou virgule) pour valider une adresse. **Retour arrière** retire la dernière.
- Panneau de droite « **Ajout rapide** » : `+ Tous les collaborateurs`, `+ Tous les clients`, `+ Tout le monde`, ou `Tout retirer`.

### Objet & message
- **Objet** : champ libre + des **suggestions** en un clic (Demande de documents, Relance des pièces manquantes…).
- **Message** : votre texte. « Cordialement, » et la **signature** (logo + coordonnées du cabinet) sont **ajoutés automatiquement**.
- ⚠️ **Chaque destinataire reçoit le mail séparément** (il ne voit pas les autres destinataires).

### L'expéditeur (le « De : »)
Vous choisissez le **nom affiché** :
| Option | Nom affiché |
|---|---|
| **Cabinet Fingec** | Expéditeur par défaut. |
| **No-reply Fingec** | Pour les annonces sans réponse attendue. |
| **Mon nom** | Votre nom de compte. |
| **Autre…** | Un nom personnalisé que vous saisissez. |

> [!note] L'adresse réelle ne change pas
> Vous changez seulement le **nom** affiché. L'**adresse d'envoi réelle** reste celle du compte Google connecté côté serveur (Gmail interdit d'envoyer depuis une adresse arbitraire sans alias). C'est indiqué sous le sélecteur d'expéditeur.

### Signature
- Aperçu en bas de la page.
- Bouton **« Modifier les coordonnées »** : adresse, téléphone, contact, mention légale. **Enregistré automatiquement** (sur votre navigateur).

---

## 🗂️ 9. Logs

Onglet **Logs** (`/logs`). L'historique des **traitements de fichiers** : date, fichier, pays, nombre de lignes, **score**, erreurs/avertissements. Vous pouvez **re-télécharger** un export passé.

- L'**effacement** des logs est **réservé aux admins**.

---

## ⚙️ 10. Paramètres du compte

Avatar (haut-droite) → **Paramètres du compte** (`/compte`).

- Voir votre identité (nom, e-mail).
- **Changer votre mot de passe** : il faut saisir l'**actuel**, puis le nouveau (deux fois).

### 🔒 Règles du mot de passe
Tout nouveau mot de passe doit respecter :
- **Au moins 12 caractères.**
- **Au moins 3 familles** parmi : minuscules, majuscules, chiffres, caractères spéciaux.
- **Ne pas contenir votre e-mail.**
- **Ne pas figurer dans une fuite connue** (vérifié automatiquement via la base « Have I Been Pwned », sans jamais transmettre votre mot de passe en clair).

Si l'un de ces critères n'est pas rempli, le changement est refusé avec un message explicatif.

---

## 🛠️ 11. Administration (admin uniquement)

Onglet **Admin** (`/admin`). Gestion des comptes du cabinet.

### Créer un utilisateur
- Renseignez **e-mail**, **nom**, **rôle** (utilisateur ou admin). **Pas de champ mot de passe** : la création envoie automatiquement l'**e-mail d'invitation**.
- Bouton **« Mot de passe »** sur une ligne = définir directement un mot de passe (sans e-mail), utile en dépannage.

### Gérer les comptes
- **Activer / désactiver** un compte, **changer le rôle**, **réinitialiser** le mot de passe, **supprimer**.
- Attribuer les clients aux comptables (depuis la page **Clients**).

### Garde-fous (impossibles par sécurité)
- ❌ Retirer/supprimer le **dernier administrateur actif**.
- ❌ **Supprimer son propre compte**.
- ℹ️ Supprimer un utilisateur **libère** ses clients (ils deviennent réattribuables).

---

## 🚧 12. Pièges à connaître (important)

> [!warning] « Mail envoyé » mais rien n'arrive
> L'app confirme l'envoi **dès que la demande est acceptée**, **avant** que Gmail n'envoie réellement. Si la connexion Google est expirée, le mail peut **ne jamais partir** alors que l'app affiche « envoyé ».

> [!warning] Connexion Google à renouveler (~tous les 7 jours)
> Les envois (relances, mails, invitations) passent par un compte Google. En mode actuel, cette connexion **expire périodiquement (≈ 7 jours)** et les envois **échouent silencieusement**. Si des clients ne reçoivent plus rien, c'est la première chose à vérifier (reconnecter les identifiants Google côté n8n / serveur).

> [!tip] Un statut « figé » ?
> Les pages se rechargent après chaque action. Si un statut semble bloqué, rafraîchissez la page : la liste est resynchronisée depuis le serveur.

---

## 📞 13. Récapitulatif des écrans

| Écran | À quoi ça sert |
|---|---|
| **Accueil** | Vue d'ensemble du mois (KPIs, à faire). |
| **Traitement** | Déposer un fichier → journal Quadra + contrôle qualité. |
| **Clients** | Suivre les statuts et relancer (Envoyé / Relancé / Reçu). |
| **Historique** | Suivi mois par mois, relances tardives. |
| **Nouveau mail** | Écrire un e-mail libre avec signature cabinet. |
| **Logs** | Historique des fichiers traités. |
| **Compte** | Identité + changement de mot de passe. |
| **Admin** | Créer/gérer les comptes, attribuer les clients. |

---

*Dernière mise à jour : 2026-06-25. Pour rouvrir ce guide : `/guide` dans Claude Code.*

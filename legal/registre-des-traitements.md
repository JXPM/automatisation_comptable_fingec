# Registre des activités de traitement

_Document interne — article 30 du RGPD. Dernière mise à jour : 2026-06-22._

Ce registre recense les traitements de données personnelles mis en œuvre dans le cadre de l'application **app.fingec.fr**. Il est tenu à jour et présenté à la CNIL sur demande. Il **ne se dépose pas** ; il matérialise la responsabilité (« accountability ») de l'éditeur.

## Coordonnées

- **Responsable de traitement** : Fingec (EURL), SIRET 808 015 994 00037, 6 rue Frédéric Chopin, 67118 Geispolsheim — représentée par Ohouo N'Katta (gérant).
- **Contact** : expert@fingec.fr — tél. +33 (0)9 83 00 08 43.
- **DPO** : non désigné (non obligatoire au regard de l'activité et de la taille).
- **Responsable informatique / référent technique** : Johan (développement et exploitation de l'application).

> ✅ **Qualification retenue (2026-06-22) : responsable de traitement autonome.** Conformément à la doctrine de l'Ordre des experts-comptables et de la CNIL, Fingec fixe les finalités et les moyens des traitements liés à sa mission comptable et est soumis à des obligations légales propres ; il agit donc en **responsable de traitement autonome**. Conséquences : (a) c'est Fingec qui informe les personnes concernées (via la politique de confidentialité) ; (b) aucun accord de sous-traitance n'est imposé à ses clients. Le modèle `dpa-modele-sous-traitance.md` est conservé uniquement pour le cas résiduel où un client exigerait une prestation strictement exécutée sur ses instructions.

---

## Traitement n° 1 — Gestion des comptes utilisateurs (espace SaaS)

| Champ | Contenu |
|---|---|
| **Finalité(s)** | Création/gestion des accès, authentification, sécurité de l'espace de travail |
| **Base légale** | Exécution du contrat (travail/prestation) ; intérêt légitime (sécurité des accès) |
| **Catégories de personnes** | Collaborateurs et administrateurs du cabinet (comptables, alternants, stagiaires) |
| **Catégories de données** | Identité (nom, prénom), e-mail, mot de passe (**hash bcrypt**), rôle, statut, date de création, jetons de réinitialisation (**SHA-256**) |
| **Données sensibles** | Aucune |
| **Destinataires** | Administrateurs habilités du cabinet |
| **Sous-traitants** | Hostinger (hébergement) — voir `sous-traitants.md` |
| **Transferts hors UE** | Aucun — hébergement Hostinger à Paris (UE) |
| **Durée de conservation** | Durée de la relation, puis suppression/anonymisation après désactivation du compte — voir `politique-de-conservation.md` |
| **Mesures de sécurité** | HTTPS/TLS, bcrypt, JWT 8 h, jetons usage unique expirants, accès par rôle |
| **Stockage** | Base SQLite `app.db` sur le VPS (`backend/auth.py`) |

## Traitement n° 2 — Gestion des clients du cabinet & relances e-mail

| Champ | Contenu |
|---|---|
| **Finalité(s)** | Suivi de la collecte des pièces comptables ; relances par e-mail ; historique des envois |
| **Base légale** | Exécution de la mission comptable ; intérêt légitime ; obligations légales comptables/fiscales |
| **Catégories de personnes** | Clients du cabinet et leurs contacts (dirigeants, interlocuteurs) — y compris contacts professionnels |
| **Catégories de données** | Nom, e-mail, statut de collecte, dates d'envoi, nombre/date de relances, historique |
| **Données sensibles** | Aucune (a priori) |
| **Destinataires** | Comptable attributaire du client ; administrateurs |
| **Sous-traitants** | Google (Sheets : stockage ; Gmail : envoi) — voir `sous-traitants.md` |
| **Transferts hors UE** | Possibles via Google — encadrés (CCT + Data Privacy Framework) [À VÉRIFIER] |
| **Durée de conservation** | Durée de la mission, puis archivage selon obligations comptables — voir `politique-de-conservation.md` |
| **Mesures de sécurité** | Accès via proxy authentifié ; filtrage par attribution ; OAuth Google |
| **Stockage** | Google Sheet `1x4ngtRTG4VQKsnOv5vnol8QNhFEoeO9j_tPDq6JB3sU` (feuilles `Clients`, `Historique`) |

## Traitement n° 3 — Traitement des fichiers comptables (TikTok/Shopify → Quadra)

| Champ | Contenu |
|---|---|
| **Finalité(s)** | Transformation de relevés e-commerce en écritures comptables importables |
| **Base légale** | Exécution de la mission comptable ; obligation légale |
| **Catégories de personnes** | Données transactionnelles agrégées ; pas d'identification directe de personnes physiques dans la sortie |
| **Catégories de données** | Dates, montants, TVA, frais (fichier importé) ; agrégats (fichier de sortie) ; métadonnées techniques (nom de fichier, score) |
| **Données sensibles** | Aucune |
| **Destinataires** | Utilisateur ayant lancé le traitement ; administrateurs |
| **Sous-traitants** | Hostinger (hébergement) |
| **Transferts hors UE** | Aucun |
| **Durée de conservation** | Fichier importé : **supprimé immédiatement après traitement** (`backend/main.py`). Fichier de sortie + journaux : [À DÉFINIR — purge à mettre en place] |
| **Mesures de sécurité** | Upload borné (50 Mo), noms de fichiers assainis, anti-traversée de chemin, traitement authentifié |
| **Stockage** | `output/*.xlsx` et `logs.json` sur le VPS |

---

## Suivi des révisions
| Date | Auteur | Modification |
|---|---|---|
| 2026-06-22 | Johan (JXPM) | Création initiale du registre |

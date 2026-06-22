# Registre des sous-traitants & accords de traitement (art. 28 RGPD)

_Document interne. Dernière mise à jour : 2026-06-22._

L'article 28 du RGPD impose qu'un **contrat de sous-traitance (DPA — Data Processing Agreement)** encadre chaque sous-traitant traitant des données personnelles pour notre compte. Les grands prestataires fournissent généralement un DPA standard à **accepter/archiver**. Ce registre suit l'état de ces accords.

## Sous-traitants actifs

### 1. Hostinger International Ltd — Hébergement (VPS)
- **Rôle** : hébergement du serveur unique exécutant **tout** (backend, frontend, base SQLite, fichiers de sortie, n8n).
- **Données traitées** : comptes utilisateurs, attributions clients, fichiers de sortie, journaux, données clients en transit via n8n.
- **Localisation des données** : **Paris, France (Union européenne)** ✅ — datacenter Hostinger en France. Pas de transfert hors UE pour l'hébergement.
- **DPA** : Addendum de traitement des données (DPA) Hostinger — [À RÉCUPÉRER ET ARCHIVER]. Disponible dans les pages légales Hostinger / sur demande au support.
- **Statut** : ✅ Localisation UE confirmée (Paris) — ⬜ DPA à archiver.

### 2. Google (Google Workspace : Sheets + Gmail)
- **Rôle** : stockage des données clients (Google Sheets) et envoi des e-mails (Gmail), via l'API et des identifiants OAuth.
- **Données traitées** : nom et e-mail des contacts clients, statut, historique des relances ; corps des e-mails.
- **Entité contractante** : Google Ireland Ltd (pour les clients UE) / Google LLC.
- **Type de compte** : ✅ **Google Workspace (professionnel)** — bénéficie du « Cloud Data Processing Addendum » de Google (garanties art. 28, contrairement à un compte gratuit).
- **Localisation / transferts** : UE avec transferts possibles hors UE, encadrés par les **clauses contractuelles types** et le **Data Privacy Framework**.
- **DPA** : « Cloud Data Processing Addendum » de Google, applicable aux comptes Workspace — [À ARCHIVER : exporter/sauvegarder la version acceptée depuis la console d'administration Google].
- **Statut** : ✅ Compte Workspace confirmé — ⬜ DPA à archiver.

## Composants NON considérés comme sous-traitants tiers
- **n8n** : **auto-hébergé** sur le VPS Fingec → composant interne, pas un tiers. (Si une bascule vers n8n Cloud était envisagée, un DPA deviendrait nécessaire.)
- **Frontend** : servi en statique depuis le **même VPS Hostinger** via Caddy. ✅ Confirmé : **tout est hébergé sur le VPS Hostinger** (backend, frontend, base SQLite, n8n) — pas de plateforme tierce type Vercel en production. Hostinger est donc le **seul** hébergeur (voir n° 1).

## Checklist par sous-traitant (à vérifier pour chacun)
- [ ] DPA signé / accepté et **archivé**.
- [ ] Garanties de sécurité documentées.
- [ ] Localisation des données connue ; transferts hors UE encadrés.
- [ ] Liste de ses propres sous-traitants ultérieurs connue.
- [ ] Procédure de notification de violation prévue au contrat.

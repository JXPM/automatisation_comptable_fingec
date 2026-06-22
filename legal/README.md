# 📂 Pack conformité RGPD & légal — Fingec

> Dossier de **conformité interne** pour l'application **app.fingec.fr** (espace SaaS du cabinet Fingec : traitement comptable TikTok/Shopify, gestion des clients et relances).
>
> **Rédigé le : 2026-06-22.** Édité par Johan (JXPM).

---

## ⚠️ À lire en premier — deux idées reçues à corriger

1. **On ne « dépose » plus de dossier RGPD à la CNIL.** La déclaration/autorisation préalable a été **supprimée le 25 mai 2018** avec l'entrée en application du RGPD. Le régime actuel est celui de **l'« accountability » (responsabilité) : on tient cette documentation en interne et on la présente en cas de contrôle.** On ne saisit la CNIL que dans deux cas : **violation de données** (notification sous 72 h — voir `procedure-violation-donnees.md`) et, le cas échéant, désignation d'un DPO.
2. **Le B2B est concerné.** Un e-mail / nom professionnel nominatif (`prenom.nom@entreprise.fr`) **est une donnée personnelle** au sens du RGPD. Le pack s'applique donc bien aux contacts « entreprises ».

---

## 📑 Composition du pack

| Fichier | Nature | Destinataire | Obligatoire |
|---|---|---|---|
| `mentions-legales.md` | Public (LCEN) | Visiteurs du site | ✅ Oui |
| `politique-de-confidentialite.md` | Public (art. 13-14 RGPD) + section cookies | Personnes concernées | ✅ Oui |
| `cgu.md` | Public | Utilisateurs de l'espace | Recommandé |
| `registre-des-traitements.md` | **Interne** (art. 30 RGPD) | CNIL en cas de contrôle | ✅ Oui |
| `sous-traitants.md` | **Interne** (art. 28 RGPD) | Audit / contrôle | ✅ Oui |
| `politique-de-conservation.md` | **Interne** (+ résumé public) | Audit / contrôle | ✅ Oui |
| `procedure-violation-donnees.md` | **Interne** (art. 33-34) | Équipe + CNIL si incident | ✅ Oui |
| `dpa-modele-sous-traitance.md` | Modèle contractuel (art. 28) | Clients / partenaires | Selon rôle |
| `evaluation-aipd.md` | **Interne** (art. 35) | Trace de décision | Conditionnel |

---

## 🧭 Statut actuel & prochaines étapes

**Renseigné (2026-06-22)** : identité (Fingec EURL, capital 1 000 €, SIRET 808 015 994 00037, siège Geispolsheim, gérant Ohouo N'Katta), contact **expert@fingec.fr** / **+33 (0)9 83 00 08 43**, hébergement Hostinger à **Paris (UE)**, Google Workspace pro, DPO non désigné.

- [ ] **Seul `[À COMPLÉTER]` restant** : n° d'inscription à l'Ordre des experts-comptables (conseil régional d'Alsace).
- [x] **Rôle RGPD tranché** : Fingec agit en **responsable de traitement autonome** (décision 2026-06-22 ; voir `registre-des-traitements.md` et `politique-de-confidentialite.md`).
- [x] **Datacenter Hostinger confirmé en UE** (Paris). Reste à **archiver les DPA** (Google Workspace, Hostinger) — voir `sous-traitants.md`.
- [x] **Documents publics publiés** dans le frontend : routes `/mentions-legales`, `/confidentialite`, `/cgu` (pages `src/pages/legal/`, coquille `LegalLayout`) + liens en pied de page de la connexion. _Reste à confirmer le n° d'Ordre dans les mentions légales._
- [x] **Purge de conservation mise en place** : `output/*.xlsx` (90 j) et `logs.json` (365 j) purgés automatiquement, jetons expirés nettoyés — voir `politique-de-conservation.md` et `backend/main.py`.

> Ces documents sont une base sérieuse et structurée, mais **ne constituent pas un conseil juridique**. Pour un cabinet d'expertise comptable, une relecture par un avocat/DPO et la cohérence avec la doctrine de l'Ordre des experts-comptables sont recommandées avant publication.

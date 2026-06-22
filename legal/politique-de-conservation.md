# Politique de conservation et de purge des données

_Document interne (avec résumé public dans la politique de confidentialité). Dernière mise à jour : 2026-06-22._

Principe RGPD : les données ne sont conservées que **le temps nécessaire** aux finalités, puis supprimées, anonymisées ou archivées selon les obligations légales.

## Durées par catégorie

| Donnée | Support | Durée d'utilisation active | Archivage / sort final |
|---|---|---|---|
| Compte utilisateur (e-mail, nom, hash, rôle) | SQLite `app.db` | Durée de la relation (collaborateur/prestataire) | Suppression ou anonymisation **dès désactivation** ; au plus tard [À DÉFINIR, ex. 1 mois après le départ] |
| Jetons de mot de passe (SHA-256) | SQLite `app.db` | Jusqu'à usage ou expiration (setup 72 h / reset 2 h) | Purge des jetons expirés [à automatiser] |
| Attribution client → utilisateur | SQLite `app.db` | Durée de la mission | Supprimée à la suppression du compte ou de la mission |
| Données clients & historique relances | Google Sheets | Durée de la mission | Archivage selon obligations comptables ([À PRÉCISER, souvent 10 ans pour les pièces comptables ; nettoyer les contacts non nécessaires] ) |
| **Fichier importé** (relevé brut) | VPS `tmp_upload/` | Le temps du traitement | **Supprimé immédiatement après traitement** ✅ (`backend/main.py`) |
| **Fichier de sortie** (`output/*.xlsx`) | VPS `output/` | **90 jours** (défaut) | ✅ **Purge automatique quotidienne** (`OUTPUT_RETENTION_DAYS`, défaut 90) |
| **Journaux techniques** (`logs.json`) | VPS | **365 jours** (défaut) + plafond 500 entrées | ✅ **Purge automatique quotidienne** (`LOGS_RETENTION_DAYS`, défaut 365) |
| **Jetons de mot de passe** (`password_tokens`) | SQLite | Jusqu'à usage/expiration | ✅ **Purge automatique** des jetons utilisés/expirés |

## Mise en œuvre technique (✅ en place depuis 2026-06-22)
Une tâche de fond s'exécute **au démarrage puis chaque jour** (`_purge_loop` dans `backend/main.py`) et supprime :
- les exports `output/*.xlsx` plus vieux que `OUTPUT_RETENTION_DAYS` (défaut **90 jours**) ;
- les entrées de `logs.json` plus vieilles que `LOGS_RETENTION_DAYS` (défaut **365 jours**) ;
- les jetons `password_tokens` utilisés ou expirés (`auth.purge_expired_tokens`).

Les durées sont **configurables par variable d'environnement** ; mettre `0` désactive la purge correspondante. Les exports sont régénérables depuis les fichiers sources du cabinet, ce qui justifie une rétention courte.

## Actions organisationnelles restantes
- [ ] **Procédure de suppression de compte** appliquée au départ d'un collaborateur (la suppression libère déjà les clients attribués — `backend/auth.py`).
- [ ] **Revue annuelle** des contacts clients dans Google Sheets (suppression des dossiers clos non soumis à obligation de conservation).
- [ ] Valider les durées (90 / 365 jours) avec l'expert-comptable au regard des obligations comptables.

> Les durées entre crochets doivent être validées avec l'expert-comptable responsable, en cohérence avec les obligations de conservation comptables et fiscales (généralement **10 ans** pour les documents comptables, **6 ans** en matière fiscale).

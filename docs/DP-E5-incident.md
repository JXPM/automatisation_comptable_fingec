# DP — Épreuve E5 : Résolution d'un incident technique (C21)

> ⚠️ Brouillon à reformuler (anti-plagiat + détecteur d'IA). Incident **réel**,
> survenu et résolu pendant le développement.

## 1. Contexte & dispositif de monitorage (C20, rappel)

L'application est surveillée à plusieurs niveaux : **CI** (tests à chaque push),
**Sentry** (erreurs runtime), **Uptime Kuma** (disponibilité), et la
**journalisation** applicative (`observability.py`). C'est la **CI** qui a
détecté l'incident décrit ici.

## 2. Description de l'incident

- **Symptôme :** après la refonte de la page de connexion, la suite de tests
  end-to-end (Playwright) signale **3 tests d'authentification en échec** sur 6.
- **Déclenchement :** introduit par la refonte UI du login (nouveau design
  « Bon retour ! », durcissement de la politique de mot de passe).
- **Périmètre impacté :** **les tests e2e uniquement** — l'application en
  production fonctionne (les pages s'affichent et se soumettent correctement).
  L'incident est donc une **régression de la couverture de tests**, pas une
  panne utilisateur — distinction importante à expliquer en soutenance.
- **Gravité :** moyenne — un *filet de sécurité* (les tests) est troué, ce qui
  laisserait passer de vraies régressions à l'avenir.

## 3. Diagnostic

Reproduit en local (`npx playwright test`). Lecture des trois échecs :

| Test | Attendu par le test | Réalité après refonte |
|---|---|---|
| Affichage page de connexion | titre **« Connexion »** | titre devenu **« Bon retour ! »** |
| Réinitialisation (lien valide) | champ *placeholder* **« Au moins 8 caractères »** | devenu **« Au moins 12 caractères »** |
| Réinitialisation (mdp différents) | idem placeholder « Au moins 8 » | idem « Au moins 12 » |

**Cause racine :** les **sélecteurs** des tests (titre, *placeholder*) pointaient
sur des libellés **modifiés** par la refonte. Le code applicatif est correct ;
ce sont les tests qui étaient **périmés**.

## 4. Résolution

- Mise à jour des sélecteurs dans `frontend/e2e/auth.spec.ts` :
  - titre : `"Connexion"` → expression `/bon retour/i` ;
  - *placeholder* : `"Au moins 8 caractères"` → `"Au moins 12 caractères"` (2 occurrences).
- Aucune modification du code applicatif (le comportement était conforme).

## 5. Vérification & versionnement

- `npx playwright test` → **6/6 tests au vert**.
- Correctif **versionné** (commit dédié) et **rejoué en CI**.

## 6. Enseignement (pour la soutenance)

Les tests e2e basés sur des **libellés visibles** sont fragiles aux refontes :
piste d'amélioration = ajouter des attributs stables (`data-testid`) sur les
éléments clés pour découpler les tests de la présentation. À mentionner comme
action corrective de fond.

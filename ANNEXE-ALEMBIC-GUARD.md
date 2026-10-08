# Annexe — Garde-fou Alembic Immobilier V2

Date : 2026-10-02. Portée : garde-fou opt-in de la mission Immobilier V2.

## Fonctionnement

`backend/alembic/env.py` active le contrôle uniquement lorsque la variable
`EGS_IMMO_V2_GUARD` vaut exactement `1`. Le contrôle est appelé sur la
connexion en ligne avant les précontrôles Alembic. La fonction isolée
`backend/app/core/alembic_guard.py` exécute alors uniquement
`SELECT current_database()`. La seule cible autorisée est `egs_test`; toute
autre cible lève exactement :

> IMMOBILIER V2 GUARD: base interdite — seule egs_test est autorisée

Quand la variable est absente ou différente de `1`, la fonction retourne sans
requête. Le comportement du garde-fou est donc inerte hors mission. Le contrôle
n’ajoute ni configuration permanente ni valeur par défaut activée.

## Preuves

Les contrôles ont été exécutés le 2026-10-02 avec une connexion PostgreSQL en
transaction `READ ONLY`; aucun ordre Alembic, upgrade, downgrade ou ordre
d’écriture n’a été lancé :

| Base vérifiée par `current_database()` | Garde actif | Résultat |
|---|---:|---|
| `egs_test` | oui | autorisée — PASS |
| `egs_local` | oui | refus avec le message exact — PASS |
| `egs_phase34_staging` | oui | refus avec le message exact — PASS |

Les quatre tests unitaires de `backend/tests/test_alembic_immo_guard.py`
passent également : trois cas actif (autorisation/refus) et un cas inactif.

## Régression générale

Le garde-fou ne bloque pas les autres bases quand il n’est pas activé. La
vérification observe seulement le nom de base et ne modifie pas la base. Le
fichier `env.py` contient par ailleurs des contrôles de capacité Alembic et
désactive les migrations hors ligne provenant de modifications antérieures;
ces comportements ne sont pas introduits par le garde-fou Immobilier V2 et ne
sont pas certifiés par cette annexe.

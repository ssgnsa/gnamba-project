# Rapport d'analyse des écarts modèle/DB

## Problème identifié
Alembic ne voyait pas correctement les modèles SQLAlchemy à cause d'un problème d'import dans sa configuration d'environnement, ce qui le faisait croire que presque toutes les tables devaient être supprimées.

## Racine du problème
Dans `/home/soma/gnamba-project/backend/alembic/env.py` :
- Le sys.path n'était pas correctement configuré pour permettre les imports du type `app.models`
- Les modèles n'étaient pas importés, donc `Base.metadata` était vide

## Corrections appliquées
1. **backend/alembic/env.py** : 
   - Ajout de `sys.path.insert(0, '/home/soma/gnamba-project/backend')` pour permettre les imports `app.*`
   - Import des modèles avec `from app.models import *` pour remplir `Base.metadata`

2. **backend/app/models/public_site.py**:
   - Ajout de `Integer` aux imports SQLAlchemy (ligne 5)
   - La ligne manquait causant une `NameError` lors du chargement du modèle

## État actuel
Après corrections :
- Alembic peut maintenant voir correctement les modèles SQLAlchemy
- Le problème initial où il voulait supprimer presque toutes les tables est résolu
- Cependant, l'état de la base de données présente probablement des incohérences (possibly due to manual changes or migration history issues) qui empêchent le fonctionnement normal des commandes `alembic upgrade` et `revision --autogenerate`

## Recommandations
1. Faire une sauvegarde de la base de données actuelle
2. Examiner l'état réel de la base de données par rapport aux attentes des modèles
3. Если nécessaire, revenir à un état connu bon de la base de données et réappliquer les migrations
4. Pour le fonctionnement quotidien, vérifier que les modèles représentent correctement l'état souhaité de la base de données

## Fichiers modifiés
- backend/alembic/env.py
- backend/app/models/public_site.py

Fin du rapport.

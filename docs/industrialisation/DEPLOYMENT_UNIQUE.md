# Chemins de déploiement EGS

## Production actuelle : publication frontend uniquement

Le workflow `Build and Deploy` publie une release frontend signée, sur demande,
depuis `main` ou `master`, après les contrôles et l'approbation de production.
Le contrôleur et le publisher restent volontairement limités au frontend. Ils
ne déploient pas l'API, ne migrent pas PostgreSQL et ne modifient aucun volume.

## Rôles des fichiers Compose

- `docker-compose.yml` est la définition canonique de la pile EGS complète
  (PostgreSQL, Redis, API FastAPI, web et Filebrowser) sur l'hôte provisionné.
- `docker-compose.new-host.yml` est la variante isolée, versionnée par SHA,
  réservée à l'initialisation contrôlée d'un nouvel hôte.
- `backend/docker-compose.yml` reste un scénario de développement backend
  local. Il ne constitue pas une cible de production et ne doit pas être
  utilisé par un script de publication.

## Nouvel hôte : pile Docker complète

Le provisionnement initial du nouvel hôte isolé est documenté dans
[DEPLOIEMENT_DOCKER_NOUVEL_HOTE.md](./DEPLOIEMENT_DOCKER_NOUVEL_HOTE.md). Il
utilise `docker-compose.new-host.yml`, un projet/volumes séparés, un rôle API
PostgreSQL non-superutilisateur et une approbation explicite des migrations
d'une base vérifiée vierge. Le bootstrap de schéma utilise temporairement le
rôle DBA `postgres`; ce rôle n'est jamais configuré dans l'API.

Ce parcours ne remplace pas le publisher actuel et ne doit pas être exécuté sur
le serveur ou la base de production existants.

## Contrôles de déploiement

- `scripts/validate-prod-deployment.sh` reste un préflight local en lecture
  seule du parcours de publication frontend existant.
- `scripts/deploy_new_host.py validate` valide statiquement la configuration
  de la pile isolée; `preflight` vérifie également le commit propre et l'hôte.
- Un échec d'un contrôle arrête le parcours. Ne pas supprimer de volumes,
  inventer des secrets, ni contourner les exigences de commit, backup,
  approbation ou santé.

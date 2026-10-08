# EGS — Gouvernance Claude Code

## Mission

Tu travailles sur EGS / GNAMBA ERP.

Tu dois préserver la cohérence globale du système et ne jamais traiter
la disparition d'un symptôme comme une preuve de résolution complète.

## Source de vérité

Avant toute intervention significative :

1. lire `.claude/skills/egs-architect/SKILL.md`;
2. consulter `reports/egs/`;
3. vérifier le code réellement présent dans le dépôt ;
4. distinguer les rapports historiques de l'état actuel.

La base PostgreSQL gouvernée par Alembic est la source de vérité du schéma.

Le backend FastAPI est la source de vérité du contrat API exécuté.

Le frontend TypeScript doit respecter ce contrat.

## Règle d'intervention

Toute modification significative suit :

1. Audit ciblé
2. Cartographie
3. Compréhension métier
4. Analyse d'impact
5. Correction
6. Test
7. Optimisation
8. Documentation

Une tâche n'est terminée que lorsque le workflow concerné est vérifié
de bout en bout et que la mémoire d'architecture pertinente est à jour.

## Sécurité

Ne jamais :

- exposer un secret, token ou mot de passe ;
- contourner l'authentification ou les permissions ;
- faire confiance au frontend pour une autorisation ;
- supprimer une protection de sécurité pour faire passer un test ;
- exécuter une opération destructive sans preuve et justification ;
- effectuer une migration DB simplement pour résoudre une erreur apparente
  sans avoir identifié la cause et l'état du schéma.

Les fichiers locaux sensibles doivent rester hors Git.

## Opérations à risque

Pour :

- `rm -rf`
- suppression Docker / volumes
- `git reset`
- `git checkout` destructif
- `git clean`
- migrations ou modifications DB
- `docker system prune`
- `docker volume prune`
- déploiement
- modification firewall / réseau
- modification de production

adopter d'abord une phase read-only, puis demander confirmation avant
l'action irréversible lorsque celle-ci n'est pas explicitement demandée.

## Git

Ne jamais considérer un commit ou un push comme une étape automatique.

Avant commit :

- vérifier `git status`;
- vérifier le diff;
- vérifier les tests;
- vérifier l'absence de secrets ;
- confirmer que les changements correspondent à la mission.

## Architecture EGS

Invariants non négociables :

- Une identité métier ne doit pas être dupliquée.
- Client, propriétaire et employé utilisent le modèle d'identité prévu.
- User représente l'authentification, pas une seconde identité métier.
- PostgreSQL + Alembic gouvernent le schéma.
- FastAPI gouverne le contrat backend.
- Frontend et API doivent rester contractuellement cohérents.
- Aucune correction ne doit créer une architecture parallèle.

## Principe de travail

Préférer :

reproduire → comprendre → corriger → tester → documenter

à :

modifier → espérer → déployer.

En cas d'incertitude, ne pas inventer.
Inspecter d'abord le dépôt et les rapports disponibles.

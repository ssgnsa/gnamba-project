# Cahier des charges final - Assistant Codex EGS

## Résumé

L’objectif est de transformer Codex en assistant de travail pour EGS, capable de:

- lire l’état réel du serveur et du dépôt
- détecter les conflits d’architecture
- guider une migration progressive vers une stack Supabase officielle
- générer de la documentation utile et à jour
- protéger la machine en restant sobre en ressources

Le besoin principal est simple: EGS tourne aujourd’hui sur un pseudo-stack fragmenté. L’assistant doit aider à sortir de cette situation sans casse, sans double logique durable, et sans dépendre d’opérations manuelles dispersées.

## Problème central

- Double API: PostgREST manuel + futur Supabase via Kong
- Double auth: Keycloak + GoTrue
- Hardware limité: 8 GB RAM, i3 ancien, Docker déjà chargé
- Documentation dispersée
- Restauration et rollback encore trop implicites

## Cible

L’assistant doit guider la migration vers un environnement séparé `supabase-core`, construit avec la stack officielle Supabase:

- Postgres
- Kong
- GoTrue
- Realtime
- Storage
- PostgREST intégré
- Studio
- Edge Functions

## Principes de conception

1. Migration progressive, jamais destructive par défaut
2. Contexte local permanent et relisible
3. Décisions explicites sur l’authentification
4. Validation avant coupure des anciens services
5. Génération de documentation au fil de l’eau
6. Sobriété mémoire et CPU

## Modules cœur

### 1. Context Manager

Rôle:

- conserver l’état serveur
- conserver l’état projet
- conserver l’état environnement
- suivre les phases de migration

Contenu logique:

- Docker: conteneurs, images, volumes, réseaux
- Supabase pseudo-stack: postgres, postgrest, keycloak, studio
- Supabase core cible: db, kong, auth, storage, realtime
- Ressources: RAM, CPU, disque
- Migration: phase courante, étapes, points de rollback

### 2. Diagnostic Engine

Rôle:

- contrôler la santé des services
- détecter les conflits de ports
- détecter les conflits d’authentification
- calculer un score de santé
- proposer des corrections

Exemples de conflits à repérer:

- PostgREST manuel encore actif alors que la stack officielle est introduite
- Keycloak et GoTrue actifs en parallèle
- Studio ou API qui ne répond plus
- pression mémoire trop forte sur la machine

### 3. Migration Assistant

Rôle:

- planifier les phases
- générer les scripts
- exécuter les étapes avec validation
- déclencher un rollback si une étape échoue

Phases proposées:

1. Préparation
2. Isolation
3. Migration des données
4. Bascule API
5. Nettoyage
6. Validation finale

### 4. Dashboard

Rôle:

- afficher le score de santé
- afficher les ressources
- afficher l’avancement de migration
- rendre l’état lisible en un coup d’oeil

### 5. Documentation Generator

Rôle:

- produire les guides de migration
- produire les schémas d’architecture
- produire les procédures de dépannage
- garder les docs alignées avec le runtime réel

## Commandes logiques à exposer

- `codex.status` pour l’état complet
- `codex.migrate` pour le plan ou l’exécution d’une phase
- `codex.optimize` pour les optimisations sûres
- `codex.rollback` pour restaurer le dernier snapshot
- `codex.docs` pour générer ou mettre à jour la documentation

## Flux de travail cible

1. Lire l’état du serveur
2. Lire l’état du dépôt
3. Identifier les conflits
4. Figer l’existant
5. Préparer `supabase-core`
6. Migrer les données
7. Basculer l’API
8. Retirer les anciens services
9. Valider
10. Documenter

## Contraintes non fonctionnelles

- TypeScript strict
- Tests obligatoires sur les changements sensibles
- Rollback disponible à chaque phase critique
- Documentation générée ou mise à jour à chaque jalon
- Consommation RAM maîtrisée
- Pas d’opération de coupure sans snapshot préalable

## Critères d’acceptation

### Fonctionnels

- `codex.status` retourne un état exploitable
- `codex.migrate` produit un plan de migration lisible
- la migration ne casse pas l’existant
- l’assistant explique clairement quel système d’auth est retenu
- la documentation est générée automatiquement

### Non fonctionnels

- RAM normale sous 6 GB
- CPU normale sous 70%
- réponse rapide sur les diagnostics
- rollback vérifiable
- documentation lisible et à jour

## Stratégie d’authentification

Option recommandée:

- abandonner Keycloak
- unifier sur Supabase Auth
- réduire les points de divergence JWT

Option alternative:

- garder Keycloak
- utiliser Supabase comme DB/API seulement
- accepter une architecture hybride plus complexe

## Priorités d’implémentation

### Sprint 1

- Context Manager
- Diagnostic Engine
- panneau de statut

### Sprint 2

- Migration Assistant
- génération des scripts
- rollback basique

### Sprint 3

- optimisation ressources
- surveillance
- alertes

### Sprint 4

- documentation auto-générée
- guides de migration
- dépannage

### Sprint 5

- validation finale
- tests de migration
- stabilisation

## Règle d’or

Ne pas chercher à "réparer" le pseudo-stack actuel comme s’il devait rester la cible finale. La cible est la stack Supabase officielle, séparée, reproductible et documentée.

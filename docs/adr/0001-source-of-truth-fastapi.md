# ADR 0001: Source de vérité unique — FastAPI + PostgreSQL

- Date: 2026-07-04
- Statut: Accepted

## Contexte

EGS doit devenir une plateforme souveraine, exploitable sur une infrastructure propre, avec une dépendance minimale aux services cloud. Aujourd'hui, l'application mélange encore :

- un frontend React qui appelle directement Supabase pour l'authentification, les RPC, les Edge Functions et le stockage ;
- un backend FastAPI encore à l'état de prototype, avec des structures internes mémoire et sans séparation claire entre API, services, repositories et modèles.

Cette situation crée une ambiguïté fonctionnelle : aucune couche ne peut aujourd'hui être considérée comme la source unique de vérité métier.

## Décision

L'architecture cible d'EGS est la suivante :

React
↓
FastAPI
↓
PostgreSQL
↓
MinIO
↓
Redis

Dans cette architecture :

- FastAPI est la couche métier et d'application ;
- PostgreSQL est la couche vérité des données ;
- MinIO devient le stockage de documents et médias ;
- Redis sert au cache, aux sessions et aux workflows asynchrones si nécessaire.

Supabase ne sera plus la source de vérité métier. Il pourra être conservé uniquement pendant la transition comme couche de compatibilité technique, mais jamais comme autorité principale du système.

## Pourquoi cette décision

1. Elle rétablit une séparation claire entre application, données et stockage.
2. Elle rend l'architecture réellement auto-hébergée et souveraine.
3. Elle permet un backend explicite, versionnable, testable et auditable.
4. Elle facilite l'usage de PostgreSQL comme système de vérité durable.
5. Elle prépare l'exploitation de EGS sur un propre socle d'infrastructure.

## Conséquences

### Positives

- Une seule source de vérité métier cohérente.
- Moins de dépendance au cloud.
- Meilleure traçabilité, sécurité et maintenabilité.
- Architecture plus stable pour les évolutions métier.

### Négatives

- Migration nécessaire sur les modules déjà branchés à Supabase.
- Refondation du backend FastAPI pour sortir du stade prototype.
- Nécessité de remplacer progressivement les appels directs à Supabase par des services métier et des repositories.

## Catégories de décision

### Conserver

- FastAPI comme couche applicative et métier.
- PostgreSQL comme base de vérité des données.
- MinIO comme stockage objet local.
- Redis comme couche cache/queue si besoin.

### Remplacer

- Supabase Auth → JWT FastAPI + RBAC.
- Supabase Storage → MinIO.
- Supabase RPC → services métier et repositories FastAPI.
- Supabase Edge Functions → API FastAPI et workers dédiés.

### Migrer

- [src/context/AuthContext.tsx](src/context/AuthContext.tsx)
- [src/pages/Utilisateurs.tsx](src/pages/Utilisateurs.tsx)
- [src/pages/Documents.tsx](src/pages/Documents.tsx)
- [src/components/media/MediaUploader.tsx](src/components/media/MediaUploader.tsx)
- [src/pages/Foncier.tsx](src/pages/Foncier.tsx)
- [src/data/clients.repository.ts](src/data/clients.repository.ts)
- [src/pages/Employes.tsx](src/pages/Employes.tsx)
- [src/pages/Projets.tsx](src/pages/Projets.tsx)
- [src/pages/Finances.tsx](src/pages/Finances.tsx)
- [src/pages/Fournitures.tsx](src/pages/Fournitures.tsx)
- [src/pages/Immobilier.tsx](src/pages/Immobilier.tsx)
- [src/pages/Leads.tsx](src/pages/Leads.tsx)

### Supprimer ou isoler

- [src/App.tsx](src/App.tsx) pour les dépendances externes non critiques.
- [src/pages/public/LoginPage.tsx](src/pages/public/LoginPage.tsx) pour les dépendances de vérification non indispensables en mode local.
- [src/lib/sentry.ts](src/lib/sentry.ts) en mode local.
- [src/lib/supabase.ts](src/lib/supabase.ts) une fois la migration terminée.

## Point important de clarification

Le fichier [backend/app/main.py](backend/app/main.py) ne doit plus être considéré comme le cœur métier de l'application. Il ne sera qu'un point d'entrée de l'application FastAPI.

Le cœur métier devra être refondu sous une structure interne claire, avec :

- API
- Core
- Auth
- Services
- Repositories
- Models
- Schemas

## Ordre de migration recommandé

### Sprint 1 — Authentification

Objectif : Supabase Auth → JWT FastAPI.

Modules concernés :

- AuthContext
- login
- session
- permissions
- rôles

### Sprint 2 — Utilisateurs

Objectif : remplacer les créations d'utilisateurs via RPC par un endpoint métier dédié.

Exemple :

POST /api/users

### Sprint 3 — CRM et Leads

Objectif : déplacer les opérations CRM/lead depuis Supabase vers FastAPI repositories.

### Sprint 4 — Documents et médias

Objectif : remplacer Supabase Storage par MinIO.

### Sprint 5 — Foncier

Objectif : supprimer les dépendances à supabase.rpc et supabase.functions.invoke.

### Sprint 6 — Finances, projets, employés, fournitures, immobilier

Objectif : convertir les modules métier restants vers FastAPI.

### Sprint 7 — Nettoyage final

Objectif : retirer définitivement le SDK Supabase du frontend et supprimer les adapters de compatibilité obsolètes.

## Résultat attendu

Une architecture où FastAPI devient la couche métier de référence, PostgreSQL devient la vérité des données, MinIO devient le stockage objet local, et le système peut être exploité de manière souveraine sur une infrastructure propre.

# ADR 0002: Architecture cible du backend FastAPI

- Date: 2026-07-04
- Statut: Proposed

## Contexte

L'ADR 0001 définit FastAPI comme couche métier et PostgreSQL comme vérité des données, mais le backend actuel reste un prototype. La structure présente dans [backend/app/main.py](backend/app/main.py) est encore trop simple pour supporter une plateforme ERP complète, avec authentification, RBAC, audits, stockage, workflows métier et tests automatisés.

## Décision

Le backend EGS sera restructuré selon une architecture interne professionnelle, orientée services, repositories et modèles, avec les composants suivants :

```text
backend/
├── app/
│   ├── api/
│   │   ├── deps/
│   │   ├── v1/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── clients/
│   │   │   ├── leads/
│   │   │   ├── documents/
│   │   │   ├── foncier/
│   │   │   └── health/
│   │   └── router.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── database.py
│   │   └── logging.py
│   ├── auth/
│   │   ├── jwt_handler.py
│   │   ├── oauth.py
│   │   └── permissions.py
│   ├── services/
│   │   ├── user_service.py
│   │   ├── auth_service.py
│   │   ├── document_service.py
│   │   └── foncier_service.py
│   ├── repositories/
│   │   ├── user_repository.py
│   │   ├── client_repository.py
│   │   └── document_repository.py
│   ├── models/
│   │   ├── user.py
│   │   ├── role.py
│   │   ├── client.py
│   │   └── document.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── client.py
│   │   └── document.py
│   └── main.py
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── alembic/
│   ├── versions/
│   └── env.py
├── pyproject.toml
├── pytest.ini
└── requirements.txt
```

## Composants retenus

### 1. SQLAlchemy 2

SQLAlchemy 2 sera utilisé comme ORM principal pour l'accès à PostgreSQL.

### 2. Alembic

Alembic sera utilisé pour gérer les migrations de schéma de manière versionnée.

### 3. JWT

L'authentification sera basée sur des JWT signés localement, avec un mécanisme d'accès et de rafraîchissement.

### 4. RBAC

Le système mettra en place des rôles et permissions explicites :

- admin
- gestionnaire
- employe
- guest

Les permissions seront définies centralement et vérifiées par les routes sensibles.

### 5. PostgreSQL

PostgreSQL sera la base de données principale et la source de vérité durable.

### 6. MinIO

MinIO sera utilisé pour le stockage des documents et médias.

### 7. Redis

Redis servira au cache, aux sessions temporaires et potentiellement aux files de tâches.

### 8. Pytest

Pytest sera utilisé pour les tests unitaires et d'intégration.

## Principes architecturaux

1. Les routes ne contiennent pas la logique métier.
2. La logique métier vit dans les services.
3. L'accès aux données vit dans les repositories.
4. Les modèles représentent la structure persistée.
5. Les schémas représentent les contrats API.
6. Les dépendances sont injectées via FastAPI.
7. Les tests couvrent les comportements métier essentiels.

## Conséquences

### Positives

- Backend plus robuste et maintenable.
- Meilleure séparation des responsabilités.
- Migration plus simple des modules métier.
- Base solide pour l'exploitation en production locale.

### Négatives

- Plus de travail d'initialisation au départ.
- Nécessité d'écrire et maintenir les migrations.
- Refactorisation importante du backend actuel.

## Backlog de migration sprint par sprint

### Sprint 1 — Fondation backend

- créer la structure [backend/app](backend/app)
- ajouter la configuration centralisée
- intégrer SQLAlchemy 2 et Alembic
- préparer la base PostgreSQL
- mettre en place les tests de base

### Sprint 2 — Authentification et RBAC

- remplacer la logique mémoire par un stockage persistant
- implémenter JWT d'accès et de rafraîchissement
- implémenter le modèle utilisateur et rôles
- créer les endpoints /api/auth/login, /api/auth/me, /api/auth/refresh
- ajouter les permissions par module

### Sprint 3 — Utilisateurs et profils

- créer les endpoints CRUD utilisateurs
- gérer la création de profils liés aux comptes
- ajouter les règles d'accès par rôle

### Sprint 4 — CRM et leads

- créer les repositories clients et leads
- déplacer les opérations métier depuis Supabase vers FastAPI
- écrire les tests métier associés

### Sprint 5 — Documents et médias

- intégrer MinIO
- créer les services upload/download
- associer les documents aux entités métier

### Sprint 6 — Foncier et workflows métier

- déplacer les attestations, lots et validations dans des services dédiés
- supprimer les dépendances à supabase.rpc et supabase.functions.invoke

### Sprint 7 — Finances, projets, employés, fournitures, immobilier

- convertir les modules métier restants
- aligner les Schémas API et la logique de permissions

### Sprint 8 — Production locale

- finaliser les migrations Alembic
- brancher la stack PostgreSQL/MinIO/Redis
- retirer les derniers adapters Supabase
- valider les parcours critiques en environnement local

## Résultat attendu

Un backend EGS structuré, testable, sécurisé et prêt à porter les modules métier complets sur une infrastructure auto-hébergée.

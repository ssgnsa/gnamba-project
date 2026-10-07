# Architecture Decision Records (ADR)

## ADR-001 : Mode de développement local avec Supabase + FastAPI
- **Date** : 2026-07-30
- **Statut** : Accepté
- **Contexte** : Le projet utilise Supabase Local pour l'authentification et un backend FastAPI pour l'API métier
- **Décision** : Configuration `.env` avec `VITE_API_MODE=local`, `VITE_API_URL=http://localhost:8000/api/v1`, connecté à PostgreSQL local via Docker
- **Conséquences** : Développement offline possible, déployment simplifié via Cloudflare Tunnel en production

## ADR-002 : Modèles SQLAluminescence pour tables d'authentification existantes
- **Date** : 2026-07-30
- **Statut** : Accepté
- **Contexte** : Migration alembic 004 a créé les tables `auth_sessions`, `auth_audit_logs`, `auth_login_failures` mais les modèles Python manquaient
- **Décision** : Ajouter les modèles correspondant exactement au schéma DB dans `app.models.user`
- **Conséquences** : Le dashboard service peut importer ces modèles ; cohérence code/DB restaurée

## ADR-003 : Pas de routeur React - Navigation par état
- **Date** : 2026-04-05 (architecture existante)
- **Statut** : Accepté
- **Contexte** : L'app utilise `AppView` (public/dashboard) et `dashPage`/`publicPage` pour la navigation
- **Décision** : Maintenir l'architecture sans React Router
- **Conséquences** : Tous les composants chargés au démarrage, bundle plus gros mais navigation instantanée
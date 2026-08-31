# Changelog

## [Unreleased] - 2026-07-30
### Corrigé
- **Backend Models** : Ajout des modèles `AuthSession`, `AuthAuditLog`, `AuthLoginFailure` dans `backend/app/models/user.py` pour correspondre aux tables créées par la migration alembic 004
- **Backend Models Export** : Mise à jour de `backend/app/models/__init__.py` pour exporter les nouveaux modèles auth
- **Configuration Frontend** : Correction `VITE_API_MODE=selfhosted` → `local` dans `.env` pour compatibilité avec `docker-entrypoint.sh`
- **Configuration Docker** : Recréation container `egs-web` avec nouvelle config

### Ajouté
- Documentation runtime dans docs/project/ (INCIDENTS.md, TODO.md, CURRENT_TASK.md, SESSION_STATE.md, NEXT_ACTION.md)

### Modifié
- Fichier `.env` : VITE_API_MODE=local
- backend/app/models/user.py : +3 modèles SQLAlchemy
- backend/app/models/__init__.py : export nouveaux modèles

## [0.1.0] - 2026-07-28
### Ajouté
- Architecture EGS unifiée (Frontend React + Backend FastAPI + PostgreSQL)
- Modules ERP : Dashboard, Foncier, Immobilier, Finances, Documents, RH, CRM, BTP, Médias
- Site vitrine avec Page Builder
- Auth Supabase + JWT local
- Migrations alembic (v001-v004)

### Modifié
- Migration vers architecture self-hosted (FastAPI + Cloudflare Tunnel)
- Consolidation configurations Docker

## [0.0.1] - 2026-03-01
### Ajouté
- Initial commit EGS ERP
- Structure projet React/TypeScript/Vite
- Configuration Supabase
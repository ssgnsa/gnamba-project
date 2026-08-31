# Mission en Cours

## Tâche actuelle
- **Description** : Cycle 1-2 : Inventaire complet du projet EGS ERP + correction blocages critiques (backend API import AuthSession, config frontend VITE_API_MODE)
- **Responsable** : Lead Software Architect / DevOps
- **Date de début** : 2026-07-30
- **Deadline** : ASAP
- **Statut** : En cours - Code corrigé localement, en attente rebuild Docker (blocage réseau Docker Hub)

## Contexte
Le projet EGS ERP présente deux blocages critiques empêchant le démarrage complet de la stack :
1. **Backend API** : ImportError `AuthSession` manquant dans `app.models.user` - la migration alembic 004 a créé les tables mais pas les modèles Python
2. **Frontend Web** : Configuration `VITE_API_MODE=selfhosted` incompatible avec `docker-entrypoint.sh` qui exige `local`
3. **Infrastructure** : Docker Hub / PyPI inaccessibles (TLS handshake timeout) empêchant rebuild des images

## Critères de succès
- [x] Modèles AuthSession, AuthAuditLog, AuthLoginFailure ajoutés dans backend/app/models/user.py
- [x] Export des modèles mis à jour dans backend/app/models/__init__.py
- [x] Configuration .env corrigée : VITE_API_MODE=local
- [ ] Image Docker egs-api rebuildée avec les corrections
- [ ] Stack Docker complète démarrée sans erreur
- [ ] API répond sur /health et endpoints principaux
- [ ] Frontend accessible sur port 8080
- [ ] Base PostgreSQL accessible et cohérente
- [ ] Authentification fonctionnelle (login/logout/refresh)
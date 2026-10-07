# Incidents et Problèmes

## INC-2026-07-30-001 : Docker Hub / PyPI inaccessibles
- **Date** : 2026-07-30
- **Gravité** : Critique (bloque rebuild Docker)
- **Description** : Docker Hub (registry-1.docker.io) et PyPI inaccessibles (TLS handshake timeout, 100% packet loss)
- **Impact** : Impossible de reconstruire l'image egs-api avec les corrections ; impossible d'installer dépendances Python en local
- **Cause** : Problème réseau externe (FAI / routage / pare-feu)
- **Statut** : En attente de résolution externe
- **Workaround** : Attendre la résolution réseau ; utiliser images cached si disponibles
- **Résolution** : Aucune pour le moment (dépend de l'infrastructure réseau)

## INC-2026-07-30-002 : Backend API - ImportError AuthSession
- **Date** : 2026-07-30
- **Gravité** : Critique (API ne démarre pas)
- **Description** : `ImportError: cannot import name 'AuthSession' from 'app.models.user'`
- **Cause** : Migration alembic 004 a créé les tables auth_sessions, auth_audit_logs, auth_login_failures mais les modèles Python n'existaient pas dans `app.models.user`
- **Correction appliquée** : Ajout des trois modèles dans `backend/app/models/user.py` et export dans `backend/app/models/__init__.py`
- **Statut** : Code corrigé localement, en attente de rebuild image Docker
- **Résolution** : Rebuild image egs-api une fois Docker Hub accessible

## INC-2026-07-28-001 : Configuration VITE_API_MODE incohérente
- **Date** : 2026-07-28
- **Gravité** : Majeure (frontend ne démarre pas)
- **Description** : `.env` avait `VITE_API_MODE=selfhosted` mais `docker-entrypoint.sh` exige `local` ou `cloud`
- **Correction** : Changé vers `VITE_API_MODE=local` dans `.env`
- **Statut** : Corrigé
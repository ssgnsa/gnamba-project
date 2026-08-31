# Prochaine Action Immédiate

## Action Prioritaire
**Rebuild image Docker egs-api avec corrections modèles auth**

### Commandes à exécuter (quand réseau rétabli)
```bash
cd /home/soma/gnamba-project
docker-compose build egs-api --no-cache
docker-compose up -d
```

### Validation post-rebuild
```bash
# Vérifier santé containers
docker-compose ps

# Logs API
docker logs egs-api --tail 50

# Test endpoint health
curl http://localhost:8000/health

# Test endpoint dashboard
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/dashboard/stats

# Test frontend
curl -I http://localhost:8080
```

## Actions Secondaires (après API up)
1. Test authentification complète (login, me, refresh, logout)
2. Valider tous les endpoints API v1 par module
3. Lancer tests frontend (typecheck, lint, build)
4. Vérifier RLS PostgreSQL sur tables critiques
5. Documenter résultats dans CERTIFICATION.md modules

## Prérequis
- Connectivité Docker Hub / PyPI rétablie
- Variables d'environnement .env valides
- Base PostgreSQL healthy
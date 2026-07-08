# EGS — Architecture unifiée

## Démarrage rapide

```bash
git clone <repo>
cd gnamba-project
PYTHONPATH=/home/soma/gnamba-project /home/soma/gnamba-project/.venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

## Authentification

- Identifiant par défaut : admin@egs.local
- Mot de passe par défaut : deadsoulja28@

## Points d’entrée

- API legacy : /api/auth/\*
- API unifiée : /api/v1/auth/\* et /api/v1/users

#!/bin/sh
set -e

echo "⏳ Application des migrations de la base de données..."
alembic upgrade head

echo "🚀 Démarrage de l'API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

# PostgreSQL Local - Setup Guide

**Date**: 2026-05-15  
**Objectif**: Remplacer Supabase Local par PostgreSQL Docker

---

## 🚀 Démarrage Rapide

### 1. Démarrer PostgreSQL Local

```bash
# Via npm
npm run db:local:start

# Ou directement
bash scripts/database/postgres-local.sh start
```

### 2. Vérifier le Statut

```bash
npm run db:local:status
```

### 3. Arrêter PostgreSQL

```bash
npm run db:local:stop
```

---

## 📋 Commandes Disponibles

| Commande | Description |
|----------|-------------|
| `npm run db:local:start` | Démarrer PostgreSQL |
| `npm run db:local:stop` | Arrêter PostgreSQL |
| `npm run db:local:status` | Voir le statut |
| `npm run db:local:logs` | Voir les logs |
| `npm run db:local:shell` | Connexion psql interactive |
| `npm run db:local:reset` | ⚠️ Reset complet (perte données) |

---

## 🔧 Configuration

### Paramètres de Connexion

```
Host: localhost
Port: 54322
Database: postgres
Username: postgres
Password: postgres
URL: postgresql://postgres:postgres@localhost:54322/postgres
```

### Pour EGS

Modifier `.env` si nécessaire:
```env
VITE_SUPABASE_MODE=local
VITE_SUPABASE_LOCAL_URL=http://localhost:54322
POSTGRES_PASSWORD=postgres
```

**Note**: EGS utilise Supabase client qui se connecte via l'API Supabase. Avec PostgreSQL pur, vous devrez adapter la couche de connexion si vous voulez développer complètement offline.

---

## 🐳 Gestion Docker Manuelle

### Commandes Utiles

```bash
# Voir les logs
docker logs egs-postgres-local --tail 50

# Connexion psql
docker exec -it egs-postgres-local psql -U postgres

# Backup manuel
docker exec egs-postgres-local pg_dump -U postgres postgres > backup.sql

# Restore manuel
cat backup.sql | docker exec -i egs-postgres-local psql -U postgres

# Stats base
docker exec egs-postgres-local psql -U postgres -c "\dt"
```

---

## ⚠️ Limitations vs Supabase Cloud

| Fonctionnalité | PostgreSQL Local | Supabase Cloud |
|----------------|------------------|----------------|
| PostgreSQL 15 | ✅ | ✅ |
| Auth (login) | ❌ | ✅ |
| Storage (fichiers) | ❌ | ✅ |
| Realtime (websocket) | ❌ | ✅ |
| Edge Functions | ❌ | ✅ |

**Pour EGS**: Utiliser PostgreSQL local pour les données métier, mais basculer sur le cloud pour Auth et Storage.

---

## 🔄 Workflow Développement

### Option A: PostgreSQL Local (Données Uniquement)

```bash
# 1. Démarrer PostgreSQL
npm run db:local:start

# 2. Développer avec connexion directe PostgreSQL
# (nécessite adaptation code pour connexion directe)

# 3. Synchroniser avec cloud quand nécessaire
npm run sync:dev-to-prod
```

### Option B: Mode Cloud (Recommandé pour EGS)

```bash
# Utiliser directement Supabase Cloud
# Pas besoin de PostgreSQL local
# Les données sont persistées sur le cloud
```

### Option C: Hybride

```bash
# PostgreSQL local pour données métier
# Supabase Cloud pour Auth et Storage
# Configuration avancée requise
```

---

## 🆘 Dépannage

### Problème: Port 54322 déjà utilisé

```bash
# Trouver le processus
sudo lsof -i :54322

# Ou changer le port dans le script
# Éditer scripts/database/postgres-local.sh
# Modifier: PORT="54323"
```

### Problème: Conteneur ne démarre pas

```bash
# Voir les logs
docker logs egs-postgres-local

# Reset complet
npm run db:local:reset
npm run db:local:start
```

### Problème: Connexion refusée

```bash
# Vérifier que PostgreSQL est prêt
docker exec egs-postgres-local pg_isready -U postgres

# Attendre 10 secondes après démarrage
```

---

## 📊 Monitoring

### Espace Disque

```bash
# Taille du volume
docker volume ls | grep egs_postgres_data

# Nettoyer si nécessaire
docker volume prune
```

### Performance

```bash
# Connexion active ?
docker exec egs-postgres-local psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 🎯 Cas d'Usage

### ✅ Utiliser PostgreSQL Local quand:
- Vous voulez tester des migrations SQL
- Vous avez besoin d'une base locale rapide
- Vous développez sans connexion internet
- Vous voulez tester des requêtes complexes

### ❌ Ne PAS utiliser quand:
- Vous avez besoin d'Auth Supabase
- Vous avez besoin de Storage
- Vous voulez tester les Edge Functions
- Vous voulez tester Realtime

---

## 📚 Ressources

- [Documentation PostgreSQL](https://www.postgresql.org/docs/15/index.html)
- [Docker Postgres Image](https://hub.docker.com/_/postgres)
- [Supabase vs PostgreSQL pur](https://supabase.com/docs/guides/database)

---

**Setup créé**: 2026-05-15  
**Dernière mise à jour**: 2026-05-15

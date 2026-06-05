# SOLUTION SUPABASE LOCAL - Approche Alternative

## 🎯 Problème Identifié

**Symptôme**: Supabase Local (v2.75.0) ne démarre pas - timeout TLS handshake  
**Cause**: Bug connu dans CLI v2.75.0 + problème de pull image PostgreSQL  
**Mise à jour CLI**: Difficile (installation via symlink personnalisé)

---

## ✅ SOLUTION RECOMMANDÉE : PostgreSQL Docker Manuel

Cette solution contourne complètement Supabase CLI pour la base de données locale.

### 1. Démarrer PostgreSQL 15

```bash
# Arrêter tout conteneur existant
docker stop egs-postgres-local 2>/dev/null
docker rm egs-postgres-local 2>/dev/null

# Démarrer PostgreSQL 15
docker run -d \
  --name egs-postgres-local \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=postgres \
  -p 54322:5432 \
  -v egs_postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine

# Attendre le démarrage
sleep 10

# Vérifier
docker ps --filter "name=egs-postgres-local"
```

### 2. Utiliser les Scripts NPM (Recommandé)

Des scripts de gestion ont été créés:

```bash
# Démarrer PostgreSQL
npm run db:local:start

# Vérifier le statut
npm run db:local:status

# Voir les logs
npm run db:local:logs

# Connexion shell
npm run db:local:shell

# Arrêter
npm run db:local:stop

# Reset complet (perte données)
npm run db:local:reset
```

### 3. Configurer EGS pour PostgreSQL Local

Modifier `.env`:
```env
# Mode local activé
SUPABASE_MODE=local
VITE_SUPABASE_MODE=local

# PostgreSQL Local (Docker)
VITE_SUPABASE_LOCAL_URL=http://localhost:54322
VITE_SUPABASE_LOCAL_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Connexion directe PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

### 3. Initialiser la Base

```bash
# Installer les migrations
npx prisma migrate dev  # ou utiliser vos migrations SQL

# OU créer les tables manuellement
docker exec -i egs-postgres-local psql -U postgres -c "
  CREATE SCHEMA IF NOT EXISTS public;
  -- Ajouter vos tables ici
"
```

### 4. Démarrer l'Application

```bash
npm run dev
# L'application se connectera à PostgreSQL local sur le port 54322
```

---

## 🔄 Workflow de Développement

### Avec PostgreSQL Docker:

```bash
# 1. Démarrer PostgreSQL (si pas déjà running)
docker start egs-postgres-local

# 2. Développer avec hot reload
npm run dev

# 3. Synchroniser avec le cloud (optionnel)
npm run sync:dev-to-prod

# 4. Arrêter PostgreSQL
docker stop egs-postgres-local
```

---

## 📊 Comparaison des Approches

| Aspect | Supabase CLI | PostgreSQL Docker |
|--------|-------------|-------------------|
| Installation | Complexe | Simple |
| Démarrage | Buggy | Fiable |
| Fonctionnalités | Auth, Storage, Realtime | Juste PostgreSQL |
| Pour EGS | ⚠️ Problématique | ✅ Recommandé |
| Migration cloud | Via CLI | Via dump/restore |

---

## 🚀 COMMANDES PRATIQUES

```bash
# Gestion du conteneur
docker start egs-postgres-local    # Démarrer
docker stop egs-postgres-local     # Arrêter
docker logs egs-postgres-local     # Voir les logs

# Backup/Restore
docker exec egs-postgres-local pg_dump -U postgres postgres > backup.sql
cat backup.sql | docker exec -i egs-postgres-local psql -U postgres

# Reset complet
docker rm -f egs-postgres-local
docker volume rm egs_postgres_data
docker run -d --name egs-postgres-local ...
```

---

## ✅ AVANTAGES DE CETTE SOLUTION

1. **Fiable**: Pas de bug CLI
2. **Rapide**: Démarrage en 5 secondes
3. **Simple**: Juste PostgreSQL, pas de services inutiles
4. **Compatible**: Fonctionne avec EGS existant
5. **Léger**: Un seul conteneur vs 10+ avec Supabase CLI

---

## ⚠️ LIMITATIONS

- Pas d'Auth Supabase (utiliser mode cloud pour auth)
- Pas de Storage Supabase (utiliser mode cloud pour storage)
- Pas de Realtime (fonctionnalité EGS ne l'utilise pas)

**Pour EGS**: Ces limitations sont acceptables car l'app utilise principalement PostgreSQL pour les données métier.

---

## 🎯 RECOMMANDATION FINALE

**Adopter la solution PostgreSQL Docker** pour le développement local.

Le mode cloud reste disponible pour les fonctionnalités avancées (Auth, Storage).

**Prochaine étape**: Implémenter cette solution ?

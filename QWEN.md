# 📋 Configuration EGS - Cohérence et Concordance

## ✅ État de la configuration

Ce document garantit que **tous les fichiers de configuration** utilisent les **mêmes variables d'environnement** de manière cohérente.

---

## 🔑 Variables d'environnement principales

| Variable                 | Fichier `.env`                             | Description                         |
| ------------------------ | ------------------------------------------ | ----------------------------------- |
| `VITE_SUPABASE_URL`      | `https://thykrnoqgylrbfupophs.supabase.co` | URL Supabase Cloud                  |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`  | Clé anonyme Supabase                |
| `WEB_PORT`               | `80`                                       | Port HTTP pour le container egs-web |
| `POSTGRES_PASSWORD`      | _(défini localement)_                      | Mot de passe PostgreSQL             |
| `JWT_SECRET`             | _(défini localement)_                      | Secret JWT pour Supabase            |

---

## 🐳 Fichiers Docker Compose

### 1. `docker-compose.yml` (Développement local)

```yaml
egs-frontend:
  build:
    args:
      VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}
      VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY}
  container_name: egs-frontend
  ports:
    - "5173:80"
```

**Statut** : ✅ **Correct** - Utilise les variables du `.env` via `args`

---

### 2. `docker-compose.server.yml` (Serveur production)

```yaml
egs-web:
  build:
    args:
      VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}
      VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY}
  image: egs-web:latest
  container_name: egs-web
  ports:
    - "${WEB_PORT:-80}:80"
```

**Statut** : ✅ **Correct** - Utilise les variables du `.env` via `args`

---

### 3. `docker-compose.prod.yml` (Production avec SSL)

```yaml
egs-frontend:
  build:
    args:
      VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}
      VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY}
  container_name: egs-frontend
  expose:
    - "80"
```

**Statut** : ✅ **Correct** - Utilise les variables du `.env` via `args`

---

## 📦 Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build-time env vars (required for Vite)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Build
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Statut** : ✅ **Correct** - Les `ARG` sont utilisés uniquement au build

---

## ⚠️ Points importants

### ❌ NE JAMAIS FAIRE

```yaml
# MAUVAIS : environment ne sert à rien pour Vite (build-time)
environment:
  VITE_SUPABASE_URL: http://localhost:54321 # ❌ INUTILE
  VITE_SUPABASE_ANON_KEY: "..." # ❌ INUTILE
```

### ✅ TOUJOURS FAIRE

```yaml
# BON : args pour le build Vite
build:
  args:
    VITE_SUPABASE_URL: ${VITE_SUPABASE_URL} # ✅ Utilise .env
    VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY} # ✅ Utilise .env
```

---

## 🔄 Commandes de déploiement

### Développement local (avec Supabase local)

```bash
# Modifier .env pour Supabase local
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Démarrer
docker-compose up -d
```

### Serveur production (192.168.1.58)

```bash
# .env avec Supabase Cloud
VITE_SUPABASE_URL=https://thykrnoqgylrbfupophs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
WEB_PORT=80

# Reconstruire et redémarrer
docker-compose -f docker-compose.server.yml down
docker-compose -f docker-compose.server.yml build --no-cache egs-web
docker-compose -f docker-compose.server.yml up -d
```

### Production avec SSL

```bash
# Utiliser docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🧪 Vérification

### Vérifier le build dans le container

```bash
# Vérifier l'URL Supabase dans le JS buildé
docker exec egs-web cat /usr/share/nginx/html/assets/*.js | grep -o 'https://[^"]*supabase.co' | head -1

# Doit afficher : https://thykrnoqgylrbfupophs.supabase.co
```

### Vérifier les variables d'environnement du build

```bash
# Voir les args utilisés pendant le build
docker inspect egs-web --format '{{json .Config.Labels}}' | jq
```

---

## 📊 Tableau de concordance

| Composant | Fichier                     | Variable                 | Source | Statut |
| --------- | --------------------------- | ------------------------ | ------ | ------ |
| Dev Local | `docker-compose.yml`        | `VITE_SUPABASE_URL`      | `.env` | ✅     |
| Dev Local | `docker-compose.yml`        | `VITE_SUPABASE_ANON_KEY` | `.env` | ✅     |
| Server    | `docker-compose.server.yml` | `VITE_SUPABASE_URL`      | `.env` | ✅     |
| Server    | `docker-compose.server.yml` | `VITE_SUPABASE_ANON_KEY` | `.env` | ✅     |
| Prod SSL  | `docker-compose.prod.yml`   | `VITE_SUPABASE_URL`      | `.env` | ✅     |
| Prod SSL  | `docker-compose.prod.yml`   | `VITE_SUPABASE_ANON_KEY` | `.env` | ✅     |
| Build     | `Dockerfile`                | `VITE_SUPABASE_URL`      | `ARG`  | ✅     |
| Build     | `Dockerfile`                | `VITE_SUPABASE_ANON_KEY` | `ARG`  | ✅     |

---

## 🎯 Checklist de validation

- [x] Tous les `docker-compose.yml` utilisent `args` (pas `environment`)
- [x] Les variables `args` référencent `${VITE_SUPABASE_URL}` et `${VITE_SUPABASE_ANON_KEY}`
- [x] Le `.env` contient les valeurs cloud (thykrnoqgylrbfupophs.supabase.co)
- [x] Le `Dockerfile` déclare les `ARG` requis
- [x] Aucun `environment` avec valeurs hardcoded localhost
- [x] Les builds reconstruits utilisent les bonnes variables

---

**Dernière mise à jour** : 2026-03-18  
**Statut** : ✅ **Configuration cohérente et concordante**

## Qwen Added Memories

- EGS Security & Workflow Rules (NON-NÉGOCIABLES):

1. RLS must ALWAYS be verified before any modification. Use current_user_role() helper. Filter by auth.uid() in USING/WITH CHECK.
2. CRITICAL tables needing RLS ASAP: user_profiles (role-based read/write), finances (verify ENABLE RLS + apply existing policies), app_settings (RLS + admin-only INSERT/UPDATE).
3. NEVER commit .env, .env.cloud, .env.server. Only import.meta.env.VITE\_\* for public vars. Supabase service keys server-side only.
4. Migrations: timestamp naming (YYYYMMDDHHMMSS_action_table.sql), idempotent (IF NOT EXISTS), ENABLE RLS on new sensitive tables, comment the "why", test local with supabase db push first.
5. Never modify migration history — always create corrective migrations.
6. Foncier tables have village scoping via user_village_access — respect this logic.
7. tenants → locataires rename caused FK conflicts — always verify FKs after rename.
8. Complex subquery migrations may timeout via db push — mark RUN MANUALLY.
9. No automatic backups active for Supabase Cloud — export schema manually before major migrations.
10. Error handling: use ErrorBoundary, console.error with context, supabase error objects surfaced to user.
11. Pre-deployment checklist: npm run build, npm run typecheck, verify RLS on new tables, test with non-admin account.
12. Priority order: RLS activation > Backup automation > Sentry monitoring > MIGRATIONS.md > Staging environment.

# EGS

EGS (Enterprise Gnamba System) est l'ERP de Gnamba Services. Le frontend est une SPA React/Vite en francais qui consomme Supabase local expose via Cloudflare Tunnel.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase

## Commandes

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Supabase

Le depot utilise maintenant la structure standard Supabase :

- `supabase/config.toml`
- `supabase/migrations/`
- `supabase/seed.sql`

Le dossier `supabase-migrations/` est conserve comme source legacy pendant la remise en coherence du schema. La commande `npm run supabase:migrations:sync` regenere les fichiers standard dans `supabase/migrations/`.

Commandes utiles :

```bash
supabase start
supabase stop
supabase status
supabase db push
npm run supabase:migrations:sync
```

## Workspace EGS

EGS est le seul projet actif dans ce dépôt. Le frontend React/Vite consomme le stack Supabase local expose via tunnel Cloudflare.

Propriété des migrations :

- `EGS` : [supabase/migrations](/home/soma/gnamba-project/supabase/migrations)
- `supabase-migrations/egs` reste une source legacy archivée pendant la remise en cohérence du schéma

Règles de cohérence :

- on n'utilise jamais `supabase db push` sans cibler explicitement EGS
- on bascule le mode via le fichier d'environnement, pas en recopiant des exemples à l'aveugle
- `README.md` et `scripts/workspace-stack.sh` sont la source de vérité opérationnelle

Commandes utiles :

```bash
# Etat global
bash scripts/workspace-stack.sh status

# Diagnostic de coherence complet
bash scripts/workspace-doctor.sh

# Audit statique du schema EGS versionne vs tables utilisees par le frontend
bash scripts/egs-schema-audit.sh

# Regenerer le snapshot du schema EGS
bash scripts/refresh-egs-schema.sh

# Voir les ports reserves
bash scripts/workspace-stack.sh ports

# Demarrer EGS local
bash scripts/workspace-stack.sh egs start-local

# Simuler une application de migrations EGS sans rien ecrire
bash scripts/workspace-stack.sh egs db-push --dry-run

# Appliquer reelement les migrations EGS sur sa base locale
bash scripts/workspace-stack.sh egs db-push --apply

# Basculer EGS vers Supabase local
bash scripts/workspace-stack.sh egs set-mode local

# Arreter EGS local
bash scripts/workspace-stack.sh egs stop-local
```

Les scripts `npm run ops:*` exposent les memes actions via `package.json`.

## Mode Unique

Le frontend et les scripts utilisent uniquement le mode local expose via tunnel Cloudflare :

- `VITE_SUPABASE_MODE=local`
- `VITE_SUPABASE_LOCAL_URL=https://api.gnambaservices.ci`
- `VITE_SUPABASE_LOCAL_ANON_KEY`

Fichiers d'exemple :

- `.env.example`
- `.env.local.example`
- `.env.server.example`

## Configuration

Le fichier `.env` est la source de vérité pour le build frontend local/tunnel. Copiez un des exemples vers `.env` ou `.env.server` puis remplissez les valeurs secrètes avant de lancer l'application.

Pour le développement local :

- `VITE_SUPABASE_MODE=local`
- `VITE_SUPABASE_LOCAL_URL=https://api.gnambaservices.ci`
- `VITE_SUPABASE_LOCAL_ANON_KEY` doit être défini
- `POSTGRES_PASSWORD` et `JWT_SECRET` doivent exister

Pour démarrer Supabase localement :

```bash
supabase start
```

Pour vérifier `.env` :

```bash
bash scripts/validate-env.sh .env
```

## Docker

`docker-compose.yml` ne demarre plus un faux stack Supabase incomplet. Il sert uniquement a builder/servir le frontend EGS.

Pour la base locale :

```bash
supabase start
```

Pour le frontend en conteneur :

```bash
docker-compose up -d
```

Pour la production nginx :

```bash
bash scripts/deploy-production.sh
```

## Etat du schema

Le depot contient la version rejouable localement du schema EGS dans `supabase/migrations/`.

Les anciens snapshots historiques restent dans le dépôt pour reference, mais le chemin supporte et documente est maintenant le flux local expose via tunnel Cloudflare.

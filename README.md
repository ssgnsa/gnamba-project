# EGS

EGS (Enterprise Gnamba System) est l'ERP de Gnamba Services. Le frontend est une SPA React/Vite en francais qui consomme Supabase Cloud en production, avec un mode local optionnel pour le developpement.

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

## Coexistence EGS / SomAgro

Ce workspace heberge deux applications distinctes qui ne doivent pas partager la meme base locale :

- `EGS` : projet Supabase `gnamba-project`, ports `54321/54322/54323/54324`, frontend `8080`
- `SomAgro` : projet Supabase `somagro-erp`, ports `55321/55322/55323/55324`, frontend `8082`

Propriete des migrations :

- `EGS` : [supabase/migrations](/home/soma/gnamba-project/supabase/migrations)
- `SomAgro` : [somagro-erp/supabase/migrations](/home/soma/gnamba-project/somagro-erp/supabase/migrations)
- `supabase-migrations/egs` et `supabase-migrations/somagro` ne sont plus que des sources legacy archivees

La regle de coherence est simple :

- on ne fusionne pas les schemas metier
- on n'utilise jamais `supabase db push` sans cibler explicitement le bon projet
- on bascule le mode de chaque app via son fichier d'environnement, pas en recopiant des exemples a l'aveugle
- `README.md` et `scripts/workspace-stack.sh` sont la source de verite operatoire; les rapports d'audit ne sont que des instantanes

Commandes exactes :

```bash
# Etat global
bash scripts/workspace-stack.sh status

# Diagnostic de coherence complet
bash scripts/workspace-doctor.sh

# Audit statique du schema EGS versionne vs tables utilisees par le frontend
bash scripts/egs-schema-audit.sh

# Regenerer le snapshot du schema cloud EGS
bash scripts/refresh-egs-cloud-schema.sh

# Voir les ports reserves
bash scripts/workspace-stack.sh ports

# Demarrer EGS local
bash scripts/workspace-stack.sh egs start-local

# Demarrer SomAgro local
bash scripts/workspace-stack.sh somagro start-local

# Demarrer les deux stacks locaux
bash scripts/workspace-stack.sh dual start-local

# Simuler une application de migrations EGS sans rien ecrire
bash scripts/workspace-stack.sh egs db-push --dry-run

# Appliquer reelement les migrations EGS sur sa base locale
bash scripts/workspace-stack.sh egs db-push --apply

# Basculer EGS vers Supabase local
bash scripts/workspace-stack.sh egs set-mode local

# Basculer EGS vers Supabase cloud
bash scripts/workspace-stack.sh egs set-mode cloud

# Basculer SomAgro vers Supabase local
bash scripts/workspace-stack.sh somagro set-mode local

# Basculer SomAgro vers Supabase cloud
bash scripts/workspace-stack.sh somagro set-mode cloud

# Arreter chaque stack sans toucher l'autre
bash scripts/workspace-stack.sh egs stop-local
bash scripts/workspace-stack.sh somagro stop-local
```

Les scripts `npm run ops:*` exposent les memes actions via `package.json`.

## Modes Cloud / Local

Le frontend choisit son endpoint avec `VITE_SUPABASE_MODE` :

- `cloud` : utilise `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
- `local` : utilise `VITE_SUPABASE_LOCAL_URL` et `VITE_SUPABASE_LOCAL_ANON_KEY`
- `auto` : prefere cloud, sinon local

Fichiers d'exemple :

- `.env.example`
- `.env.local.example`
- `.env.cloud`

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
docker compose -f docker-compose.server.yml up -d egs-web
```

## Etat du schema

Le depot contient maintenant deux verites complementaires pour EGS :

- `supabase/migrations/` : ce qui est rejouable localement aujourd'hui
- `supabase/generated/egs-cloud.types.ts` et `supabase/generated/egs-cloud-schema.json` : snapshot du schema cloud reel, regenere via `bash scripts/refresh-egs-cloud-schema.sh`

Le schema Cloud historique d'EGS n'est pas encore retroporte completement dans Git sous forme de migrations SQL rejouables. Le snapshot cloud permet toutefois de verifier les derives et d'eliminer les confusions sur les objets existants avant la formalisation SQL complete.

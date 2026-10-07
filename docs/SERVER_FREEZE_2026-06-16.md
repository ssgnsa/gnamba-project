# Freeze Serveur - 2026-06-16

## Objectif

Conserver un point de restauration minimal avant la refonte Supabase officielle.

## Ce qui a été figé

- Base PostgreSQL locale
- Migrations Supabase du dépôt
- Données persistantes de Keycloak et Supabase Studio
- Manifeste du runtime Docker

## Artefacts créés

- `backups/freeze-20260616/postgres_dump.sql.gz`
- `backups/freeze-20260616/supabase_migrations.tar.gz`
- `backups/freeze-20260616/runtime-data.tar.gz`
- `backups/freeze-20260616/runtime-manifest.txt`

## Vérifications faites

- `egs-postgres-local` est actif.
- `egs-postgrest` est actif.
- `egs-keycloak` est actif.
- `egs-supabase-studio` est actif mais `unhealthy`.
- Aucun volume Docker nommé n’est utilisé.
- La base locale contient `0` table applicative hors schémas système.

## Lecture du dump PostgreSQL

Le dump `postgres_dump.sql.gz` est volontairement petit car la base locale ne contient aucune table métier au moment de la sauvegarde. Il reste utile comme preuve de l’état du conteneur et de la structure minimale de la base.

## Données persistantes capturées

- `/mnt/data/keycloak/data`
- `/mnt/data/supabase/studio`

## Conclusion

Le socle actuel est maintenant documenté et sauvegardé. La suite peut se faire dans un dossier Supabase officiel séparé, sans risquer ce pseudo-stack.

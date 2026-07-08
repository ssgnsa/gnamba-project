# Inventaire Serveur - 2026-06-16

## Objectif

Figer l’existant avant toute refonte Supabase, sans arrêter ni modifier les services en cours.

## État Docker actuel

| Conteneur | Image | Statut | Ports exposés | Montage persistant |
| --- | --- | --- | --- | --- |
| `egs-adminer` | `adminer:latest` | `running` | `8081 -> 8080` | aucun |
| `egs-postgres-local` | `postgres:15-alpine` | `running` | `54322 -> 5432` | `/mnt/data/postgres` -> `/var/lib/postgresql/data` |
| `egs-postgrest` | `postgrest/postgrest:v12.0.2` | `running` | `3001 -> 3000` | aucun |
| `egs-keycloak` | `quay.io/keycloak/keycloak:latest` | `running` | `8080 -> 8080` | `/mnt/data/keycloak/data` -> `/opt/keycloak/data` |
| `egs-supabase-studio` | `supabase/studio:latest` | `running` | `3000 -> 3000` | `/mnt/data/supabase/studio` -> `/app/.temp` |

## Santé observée

- `egs-supabase-studio` est `unhealthy`.
- Les autres conteneurs sont `running`.
- Aucun conteneur Supabase officiel complet n’est présent.
- `egs-adminer` est un outil d’inspection additionnel, pas une brique Supabase.

## Ce qui existe réellement

- PostgreSQL local dédié
- PostgREST manuel
- Keycloak séparé
- Supabase Studio séparé

## Ce qui manque pour une stack Supabase officielle

- `GoTrue`
- `Realtime`
- `Storage`
- `Kong`
- orchestration `supabase start`

## Réseau et stockage

- Réseau observé: `bridge`
- Volumes Docker nommés: aucun
- Persistance actuelle: uniquement des bind mounts vers `/mnt/data/*`

## Données à préserver

- Base PostgreSQL locale: `/mnt/data/postgres`
- Données Keycloak: `/mnt/data/keycloak/data`
- État local Studio: `/mnt/data/supabase/studio`

## Taille des montages

- `/mnt/data/postgres` : `4.0K`
- `/mnt/data/keycloak/data` : `1.3M`
- `/mnt/data/supabase/studio` : `4.0K`

## Conclusion

Le serveur héberge un pseudo-stack Supabase artisanal, fonctionnel mais fragmenté. La phase suivante doit créer une stack officielle séparée avant toute migration.

---
document: SUPABASE_CLOUD_RECOVERY.md
phase: "11"
session: 2
generated_at: "2026-06-17T12:56:00Z"
status: draft
inputs_used:
  - supabase/.temp/project-ref
  - supabase/.temp/linked-project.json
  - scripts/recover-supabase-cloud.sh
absent_services: []
---

# Supabase Cloud Recovery

## État connu

- Projet Cloud actif: `gnamba-erp`
- Project ref: `thykrnoqgylrbfupophs`
- Région: `eu-north-1`
- Email administrateur métier indiqué: `ssgnsa@gmail.com`
- Projet historique vu par la CLI: `SOMa AgroBio`, inactif
- Health Auth Cloud: `200`
- Lecture anon `user_profiles` pour `ssgnsa@gmail.com`: vide, probablement masquée par RLS ou profil absent de cette table

## Ce qui est possible

La récupération complète est possible si l’on dispose du mot de passe PostgreSQL du projet Cloud ou de la connection string Cloud. Le token Supabase CLI voit le projet, mais Postgres exige encore son mot de passe DB pour créer un dump complet.

## Commande de dump

```bash
export SUPABASE_DB_PASSWORD='mot_de_passe_postgres_cloud'
bash scripts/recover-supabase-cloud.sh
```

Alternative avec connection string:

```bash
export SUPABASE_CLOUD_DB_URL='postgresql://postgres.thykrnoqgylrbfupophs:***@aws-0-eu-north-1.pooler.supabase.com:5432/postgres'
bash scripts/recover-supabase-cloud.sh
```

Si le mot de passe contient des caractères spéciaux, utiliser de préférence `SUPABASE_DB_PASSWORD` ou encoder le mot de passe dans l’URL.

## Fichiers attendus

- `backups/supabase-cloud-*/roles.sql`
- `backups/supabase-cloud-*/schema.sql`
- `backups/supabase-cloud-*/data.sql`
- `backups/supabase-cloud-*/manifest.txt`

## Restauration locale

La restauration locale n’est pas automatique. Elle demande une confirmation explicite:

```bash
export SUPABASE_DB_PASSWORD='mot_de_passe_postgres_cloud'
export CONFIRM_RESTORE_LOCAL=YES
bash scripts/recover-supabase-cloud.sh
```

Le script crée d’abord un snapshot local `local-before-restore.sql`.

## Storage

Le dump SQL récupère la base et les métadonnées. Les objets Storage doivent être migrés séparément avec une clé `service_role` Cloud et une clé `service_role` cible locale ou via un script dédié.

## Attention sécurité

Ne jamais committer:

- `SUPABASE_DB_PASSWORD`
- `SUPABASE_CLOUD_DB_URL`
- `service_role`
- dumps contenant des données personnelles

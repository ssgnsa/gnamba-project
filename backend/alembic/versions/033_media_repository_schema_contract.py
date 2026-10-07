"""Align legacy media tables with the active repository contract.

Revision ID: 033_media_repository_schema_contract
Revises: 032_immobilier_v2_contract
"""

from alembic import op
import sqlalchemy as sa


revision = "033_media_repository_schema_contract"
down_revision = "032_immobilier_v2_contract"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'media_files'
                  AND column_name = 'file_name'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'media_files'
                  AND column_name = 'filename'
            ) THEN
                ALTER TABLE public.media_files RENAME COLUMN file_name TO filename;
            ELSIF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'media_files'
                  AND column_name = 'filename'
            ) THEN
                ALTER TABLE public.media_files ADD COLUMN filename TEXT;
            END IF;
        END
        $$
        """
    )
    op.execute(
        """
        ALTER TABLE public.media_files
            ADD COLUMN IF NOT EXISTS storage_key TEXT,
            ADD COLUMN IF NOT EXISTS url TEXT NOT NULL DEFAULT '',
            ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
            ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'autre',
            ADD COLUMN IF NOT EXISTS uploaded_by TEXT,
            ADD COLUMN IF NOT EXISTS upload_date TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS size BIGINT NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT '',
            ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'media_files'
                  AND column_name = 'file_name'
            ) THEN
                UPDATE public.media_files
                SET filename = COALESCE(NULLIF(filename, ''), NULLIF(file_name, ''), original_name, id::TEXT)
                WHERE filename IS NULL OR filename = '';
                ALTER TABLE public.media_files
                    ALTER COLUMN file_name SET DEFAULT '',
                    ALTER COLUMN file_name DROP NOT NULL;

                EXECUTE $ddl$
                    CREATE OR REPLACE FUNCTION public.eg_media_filename_sync()
                    RETURNS trigger LANGUAGE plpgsql AS $function$
                    BEGIN
                        IF TG_OP = 'UPDATE' THEN
                            IF NEW.filename IS DISTINCT FROM OLD.filename
                               AND NEW.file_name IS NOT DISTINCT FROM OLD.file_name THEN
                                NEW.file_name := NEW.filename;
                            ELSIF NEW.file_name IS DISTINCT FROM OLD.file_name
                               AND NEW.filename IS NOT DISTINCT FROM OLD.filename THEN
                                NEW.filename := NEW.file_name;
                            END IF;
                        END IF;
                        IF NEW.filename IS NULL OR NEW.filename = '' THEN
                            NEW.filename := NEW.file_name;
                        END IF;
                        IF NEW.file_name IS NULL OR NEW.file_name = '' THEN
                            NEW.file_name := NEW.filename;
                        END IF;
                        RETURN NEW;
                    END
                    $function$;
                $ddl$;

                EXECUTE 'DROP TRIGGER IF EXISTS trg_media_filename_sync ON public.media_files';
                EXECUTE '
                    CREATE TRIGGER trg_media_filename_sync
                    BEFORE INSERT OR UPDATE OF filename, file_name
                    ON public.media_files
                    FOR EACH ROW EXECUTE FUNCTION public.eg_media_filename_sync()
                ';
            ELSE
                UPDATE public.media_files
                SET filename = COALESCE(NULLIF(filename, ''), original_name, id::TEXT)
                WHERE filename IS NULL OR filename = '';
            END IF;
        END
        $$
        """
    )
    op.execute(
        """
        UPDATE public.media_files
        SET storage_key = COALESCE(NULLIF(storage_key, ''), NULLIF(storage_path, ''), NULLIF(file_path, ''), filename),
            url = COALESCE(NULLIF(url, ''), NULLIF(cdn_url, ''), NULLIF(file_path, ''), ''),
            thumbnail_url = COALESCE(NULLIF(thumbnail_url, ''), NULLIF(thumbnail_path, '')),
            uploaded_by = COALESCE(uploaded_by, created_by::TEXT),
            upload_date = COALESCE(upload_date, created_at),
            size = CASE WHEN size = 0 THEN COALESCE(file_size, 0) ELSE size END,
            type = CASE WHEN type = '' THEN COALESCE(mime_type, '') ELSE type END,
            description = CASE WHEN description = '' THEN COALESCE(caption, '') ELSE description END
        """
    )
    op.execute(
        """
        ALTER TABLE public.media_files
            ALTER COLUMN filename SET NOT NULL,
            ALTER COLUMN upload_date SET DEFAULT now(),
            ALTER COLUMN upload_date SET NOT NULL,
            ALTER COLUMN file_path SET DEFAULT '',
            ALTER COLUMN mime_type SET DEFAULT '',
            ALTER COLUMN file_size SET DEFAULT 0
        """
    )

    op.execute(
        """
        ALTER TABLE public.media_versions
            ADD COLUMN IF NOT EXISTS old_url TEXT,
            ADD COLUMN IF NOT EXISTS old_filename TEXT,
            ADD COLUMN IF NOT EXISTS replaced_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS replaced_by TEXT
        """
    )
    op.execute(
        """
        UPDATE public.media_versions
        SET old_url = COALESCE(old_url, file_path, ''),
            old_filename = COALESCE(old_filename, file_name, ''),
            replaced_at = COALESCE(replaced_at, created_at),
            replaced_by = COALESCE(replaced_by, created_by::TEXT)
        """
    )
    op.execute(
        """
        ALTER TABLE public.media_versions
            ALTER COLUMN old_url SET DEFAULT '',
            ALTER COLUMN old_url SET NOT NULL,
            ALTER COLUMN old_filename SET DEFAULT '',
            ALTER COLUMN old_filename SET NOT NULL,
            ALTER COLUMN replaced_at SET DEFAULT now(),
            ALTER COLUMN replaced_at SET NOT NULL,
            ALTER COLUMN file_name SET DEFAULT '',
            ALTER COLUMN file_path SET DEFAULT '',
            ALTER COLUMN file_size SET DEFAULT 0
        """
    )

    op.execute(
        """
        ALTER TABLE public.media_usage
            ADD COLUMN IF NOT EXISTS usage_type TEXT NOT NULL DEFAULT 'legacy',
            ADD COLUMN IF NOT EXISTS label TEXT NOT NULL DEFAULT ''
        """
    )
    op.execute(
        """
        UPDATE public.media_usage
        SET usage_type = COALESCE(NULLIF(usage_context, ''), 'legacy')
        WHERE usage_type = 'legacy'
        """
    )
    op.execute(
        """
        ALTER TABLE public.media_usage
            ALTER COLUMN entity_id TYPE TEXT USING entity_id::TEXT,
            ALTER COLUMN entity_id DROP NOT NULL
        """
    )

    op.execute(
        """
        ALTER TABLE public.media_audit_logs
            ADD COLUMN IF NOT EXISTS actor_id TEXT,
            ADD COLUMN IF NOT EXISTS metadata JSONB
        """
    )
    op.execute(
        """
        UPDATE public.media_audit_logs
        SET actor_id = COALESCE(actor_id, user_id::TEXT),
            metadata = COALESCE(metadata, metadata_json::JSONB, '{}'::JSONB)
        """
    )
    op.execute(
        """
        ALTER TABLE public.media_audit_logs
            ALTER COLUMN media_id DROP NOT NULL,
            ALTER COLUMN metadata SET DEFAULT '{}'::JSONB
        """
    )
    op.execute(
        """
        ALTER TABLE public.media_files
            DROP CONSTRAINT IF EXISTS media_files_deleted_by_fkey
        """
    )
    op.execute(
        """
        ALTER TABLE public.media_files
            ALTER COLUMN deleted_by TYPE TEXT USING deleted_by::TEXT
        """
    )

    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_media_category ON public.media_files (category)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON public.media_files (uploaded_by)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_media_brand_asset ON public.media_files (is_brand_asset, brand_asset_type)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_media_usage_type ON public.media_usage (usage_type)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_media_version_number ON public.media_versions (media_id, version_number)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_media_audit_actor ON public.media_audit_logs (actor_id)"
    )


def downgrade() -> None:
    raise RuntimeError(
        "The media contract migration is forward-only; restore from a verified "
        "backup rather than dropping fields that may now contain application data."
    )

"""Fix settings_audit changed_by column to accept string user IDs.

Revision ID: 020_fix_settings_audit_changed_by
Revises: 019_settings_audit
Create Date: 2025-08-06 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '020_fix_settings_audit'
down_revision = '019_settings_audit'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Change changed_by from UUID to TEXT to accept string user IDs like 'admin-local'
    op.alter_column('settings_audit', 'changed_by',
                    type_=sa.Text(),
                    existing_type=postgresql.UUID(as_uuid=False),
                    existing_nullable=True,
                    postgresql_using='changed_by::text')
    
    # Update the trigger function to accept TEXT instead of UUID cast
    op.execute("""
        CREATE OR REPLACE FUNCTION log_settings_change()
        RETURNS trigger AS $$
        BEGIN
            IF TG_OP = 'INSERT' THEN
                INSERT INTO settings_audit (setting_key, old_value, new_value, changed_by, action)
                VALUES (NEW.key, NULL, NEW.value, current_setting('app.current_user_id', true), 'INSERT');
                RETURN NEW;
            ELSIF TG_OP = 'UPDATE' THEN
                IF OLD.value IS DISTINCT FROM NEW.value THEN
                    INSERT INTO settings_audit (setting_key, old_value, new_value, changed_by, action)
                    VALUES (NEW.key, OLD.value, NEW.value, current_setting('app.current_user_id', true), 'UPDATE');
                END IF;
                RETURN NEW;
            ELSIF TG_OP = 'DELETE' THEN
                INSERT INTO settings_audit (setting_key, old_value, new_value, changed_by, action)
                VALUES (OLD.key, OLD.value, NULL, current_setting('app.current_user_id', true), 'DELETE');
                RETURN OLD;
            END IF;
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    """)


def downgrade() -> None:
    # Revert changed_by back to UUID
    op.alter_column('settings_audit', 'changed_by',
                    type_=postgresql.UUID(as_uuid=False),
                    existing_type=sa.Text(),
                    existing_nullable=True)
    
    # Restore the original trigger function with UUID cast
    op.execute("""
        CREATE OR REPLACE FUNCTION log_settings_change()
        RETURNS trigger AS $$
        BEGIN
            IF TG_OP = 'INSERT' THEN
                INSERT INTO settings_audit (setting_key, old_value, new_value, changed_by, action)
                VALUES (NEW.key, NULL, NEW.value, current_setting('app.current_user_id', true)::uuid, 'INSERT');
                RETURN NEW;
            ELSIF TG_OP = 'UPDATE' THEN
                IF OLD.value IS DISTINCT FROM NEW.value THEN
                    INSERT INTO settings_audit (setting_key, old_value, new_value, changed_by, action)
                    VALUES (NEW.key, OLD.value, NEW.value, current_setting('app.current_user_id', true)::uuid, 'UPDATE');
                END IF;
                RETURN NEW;
            ELSIF TG_OP = 'DELETE' THEN
                INSERT INTO settings_audit (setting_key, old_value, new_value, changed_by, action)
                VALUES (OLD.key, OLD.value, NULL, current_setting('app.current_user_id', true)::uuid, 'DELETE');
                RETURN OLD;
            END IF;
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    """)
"""Create settings_audit table with automatic trigger.

Revision ID: 019_settings_audit
Revises: 018_add_entity_id_to_foncier
Create Date: 2025-08-06 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '019_settings_audit'
down_revision = '018_add_entity_id_to_foncier'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # SETTINGS_AUDIT
    op.create_table(
        'settings_audit',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('setting_key', sa.String(100), nullable=False),
        sa.Column('old_value', postgresql.JSON(), nullable=True),
        sa.Column('new_value', postgresql.JSON(), nullable=True),
        sa.Column('changed_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('changed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('action', sa.String(10), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_settings_audit_key', 'settings_audit', ['setting_key'])
    op.create_index('idx_settings_audit_changed_at', 'settings_audit', ['changed_at'])
    op.create_index('idx_settings_audit_changed_by', 'settings_audit', ['changed_by'])

    # Create trigger function for automatic audit logging
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

    # Create trigger on app_settings table
    op.execute("""
        CREATE TRIGGER trigger_log_settings_change
        AFTER INSERT OR UPDATE OR DELETE ON app_settings
        FOR EACH ROW EXECUTE FUNCTION log_settings_change();
    """)

    # Grant execute permission on the function
    # Note: No application role exists yet, function is SECURITY DEFINER so it runs as table owner


def downgrade() -> None:
    # Drop trigger
    op.execute("DROP TRIGGER IF EXISTS trigger_log_settings_change ON app_settings;")
    
    # Drop function
    op.execute("DROP FUNCTION IF EXISTS log_settings_change();")
    
    # Drop indexes
    op.drop_index('idx_settings_audit_changed_by', table_name='settings_audit')
    op.drop_index('idx_settings_audit_changed_at', table_name='settings_audit')
    op.drop_index('idx_settings_audit_key', table_name='settings_audit')
    
    # Drop table
    op.drop_table('settings_audit')
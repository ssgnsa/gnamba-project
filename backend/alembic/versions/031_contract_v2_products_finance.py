"""Add server generated product references and canonical finance fields.

Revision ID: 031_contract_v2_products_finance
Revises: 030_restore_property_orm_compat_columns

This migration is additive. Legacy finance columns remain available during
the API compatibility period. Rows without a proven direction are retained as
INCONNU/HOLD and are never inferred from their status.
"""

from alembic import op
import sqlalchemy as sa


revision = "031_contract_v2_products_finance"
down_revision = "030_restore_property_orm_compat_columns"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    # The initial finance schema has only the legacy `type` column. Create the
    # compatibility column before validating it so fresh installs and live
    # databases follow the same path.
    op.execute("ALTER TABLE public.finances ADD COLUMN IF NOT EXISTS type_transaction VARCHAR(20)")
    unsupported = bind.execute(sa.text("""
        SELECT type_transaction, count(*)
        FROM public.finances
        WHERE type_transaction IS NOT NULL
          AND type_transaction NOT IN ('recette', 'depense')
        GROUP BY type_transaction
    """)).all()
    if unsupported:
        raise RuntimeError(
            "Finance: type_transaction contient des valeurs non documentées; "
            "aucune conversion automatique: "
            f"{unsupported!r}"
        )

    op.execute("""
        CREATE TABLE IF NOT EXISTS public.ref_counters (
            namespace TEXT NOT NULL,
            ref_year INTEGER NOT NULL,
            last_value BIGINT NOT NULL CHECK (last_value > 0),
            PRIMARY KEY (namespace, ref_year)
        )
    """)
    op.execute("""
        CREATE OR REPLACE FUNCTION public.eg_next_reference(p_namespace TEXT, p_year INTEGER)
        RETURNS BIGINT LANGUAGE plpgsql AS $$
        DECLARE v_value BIGINT;
        BEGIN
            INSERT INTO public.ref_counters(namespace, ref_year, last_value)
            VALUES (p_namespace, p_year, 1)
            ON CONFLICT (namespace, ref_year)
            DO UPDATE SET last_value = public.ref_counters.last_value + 1
            RETURNING last_value INTO v_value;
            RETURN v_value;
        END;
        $$
    """)
    op.execute("""
        INSERT INTO public.ref_counters(namespace, ref_year, last_value)
        SELECT 'PRD', EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
               COALESCE(MAX(substring(reference FROM 9 FOR 6)::BIGINT), 0)
        FROM public.products
        WHERE reference ~ ('^PRD-' || EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER || '-[0-9]{6}$')
        HAVING COALESCE(MAX(substring(reference FROM 9 FOR 6)::BIGINT), 0) > 0
        ON CONFLICT (namespace, ref_year) DO UPDATE
        SET last_value = GREATEST(public.ref_counters.last_value, EXCLUDED.last_value)
    """)
    op.execute("""
        CREATE OR REPLACE FUNCTION public.eg_product_reference_guard()
        RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE v_year INTEGER; v_seq BIGINT;
        BEGIN
            IF TG_OP = 'UPDATE' THEN
                IF NEW.reference IS DISTINCT FROM OLD.reference THEN
                    RAISE EXCEPTION 'Product reference is immutable';
                END IF;
                RETURN NEW;
            END IF;
            v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
            v_seq := public.eg_next_reference('PRD', v_year);
            IF v_seq > 999999 THEN
                RAISE EXCEPTION 'Product reference sequence exhausted for %', v_year;
            END IF;
            NEW.reference := format('PRD-%s-%s', v_year, lpad(v_seq::TEXT, 6, '0'));
            RETURN NEW;
        END;
        $$
    """)
    op.execute("""
        DROP TRIGGER IF EXISTS trg_products_contract_reference ON public.products;
        CREATE TRIGGER trg_products_contract_reference
        BEFORE INSERT OR UPDATE OF reference ON public.products
        FOR EACH ROW EXECUTE FUNCTION public.eg_product_reference_guard()
    """)

    op.execute("ALTER TABLE public.finances ADD COLUMN IF NOT EXISTS type_operation VARCHAR(20)")
    op.execute("ALTER TABLE public.finances ADD COLUMN IF NOT EXISTS taux_source TEXT")
    op.execute("ALTER TABLE public.finances ADD COLUMN IF NOT EXISTS date_transaction DATE")
    op.execute("ALTER TABLE public.finances ADD COLUMN IF NOT EXISTS date_operation DATE")
    op.execute("ALTER TABLE public.finances ADD COLUMN IF NOT EXISTS montant_xof NUMERIC(18,2)")
    op.execute("ALTER TABLE public.finances ADD COLUMN IF NOT EXISTS taux_change NUMERIC(18,8)")
    op.execute("ALTER TABLE public.finances ADD COLUMN IF NOT EXISTS devise VARCHAR(4)")
    op.execute("ALTER TABLE public.finances ALTER COLUMN montant TYPE NUMERIC(18,2)")
    op.execute("ALTER TABLE public.finances ALTER COLUMN montant_xof TYPE NUMERIC(18,2)")
    op.execute("ALTER TABLE public.finances ALTER COLUMN devise TYPE VARCHAR(4)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS public.finance_exchange_rates (
            devise VARCHAR(3) NOT NULL CHECK (devise ~ '^[A-Z]{3}$'),
            date_taux DATE NOT NULL,
            taux_xof NUMERIC(18,8) NOT NULL CHECK (taux_xof > 0),
            source TEXT NOT NULL CHECK (length(trim(source)) > 0),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (devise, date_taux)
        )
    """)
    op.execute("""
        UPDATE public.finances
        SET type_operation = CASE type_transaction
                WHEN 'recette' THEN 'ENCAISSEMENT'
                WHEN 'depense' THEN 'DECAISSEMENT'
                ELSE 'INCONNU'
            END,
            date_operation = COALESCE(date_operation, date_transaction::DATE),
            montant_xof = COALESCE(
                montant_xof,
                CASE WHEN upper(COALESCE(devise, '')) IN ('XOF', 'FCFA')
                     THEN round(montant, 0) END
            ),
            taux_change = COALESCE(
                taux_change,
                CASE WHEN upper(COALESCE(devise, '')) IN ('XOF', 'FCFA') THEN 1 END
            ),
            taux_source = COALESCE(
                taux_source,
                CASE WHEN upper(COALESCE(devise, '')) IN ('XOF', 'FCFA')
                     THEN 'Valeur historique FCFA/XOF (parité 1:1)' END
            )
        WHERE type_operation IS NULL
    """)
    op.execute("ALTER TABLE public.finances ALTER COLUMN type_operation SET NOT NULL")

    op.execute("""
        CREATE OR REPLACE FUNCTION public.eg_finance_contract_guard()
        RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE v_rate NUMERIC(18,8); v_source TEXT;
        BEGIN
            IF NEW.type_operation IS NULL THEN
                NEW.type_operation := CASE NEW.type_transaction
                    WHEN 'recette' THEN 'ENCAISSEMENT'
                    WHEN 'depense' THEN 'DECAISSEMENT'
                    ELSE NULL
                END;
            END IF;
            IF NEW.type_operation = 'INCONNU' THEN
                IF TG_OP = 'INSERT' THEN
                    RAISE EXCEPTION 'Une nouvelle opération doit avoir une direction justifiée';
                END IF;
                IF to_jsonb(NEW) IS DISTINCT FROM to_jsonb(OLD) THEN
                    RAISE EXCEPTION 'Opération INCONNU/HOLD verrouillée jusqu’à justification';
                END IF;
                RETURN NEW;
            END IF;
            IF NEW.type_operation IS NULL OR
               NEW.type_operation NOT IN ('ENCAISSEMENT', 'DECAISSEMENT') THEN
                RAISE EXCEPTION 'type_operation doit être ENCAISSEMENT ou DECAISSEMENT';
            END IF;
            IF NEW.montant IS NULL OR NEW.montant <= 0 THEN
                RAISE EXCEPTION 'montant doit être strictement positif';
            END IF;
            IF NEW.date_operation IS NULL THEN
                IF NEW.date_transaction IS NULL THEN
                    RAISE EXCEPTION 'date_operation est obligatoire';
                END IF;
                NEW.date_operation := NEW.date_transaction;
            END IF;
            NEW.devise := upper(coalesce(NEW.devise, 'XOF'));
            IF NEW.devise !~ '^[A-Z]{3}$' AND NEW.devise <> 'FCFA' THEN
                RAISE EXCEPTION 'devise doit être ISO 4217; FCFA est toléré uniquement comme alias historique';
            END IF;
            IF NEW.devise IN ('XOF', 'FCFA') THEN
                v_rate := 1;
                v_source := 'Valeur historique FCFA/XOF (parité 1:1)';
            ELSIF NEW.devise = 'EUR' THEN
                v_rate := 655.957;
                v_source := 'Parité fixe EUR/XOF';
            ELSE
                SELECT taux_xof, source INTO v_rate, v_source
                FROM public.finance_exchange_rates
                WHERE devise = NEW.devise AND date_taux = NEW.date_operation;
                IF v_rate IS NULL THEN
                    RAISE EXCEPTION 'Aucun taux de change % vers XOF pour le %', NEW.devise, NEW.date_operation;
                END IF;
            END IF;
            NEW.taux_change := v_rate;
            NEW.taux_source := v_source;
            NEW.montant_xof := round(NEW.montant * v_rate, 0);
            NEW.type := CASE NEW.type_operation
                WHEN 'ENCAISSEMENT' THEN 'recette'
                WHEN 'DECAISSEMENT' THEN 'depense'
            END;
            NEW.type_transaction := NEW.type;
            NEW.date_transaction := NEW.date_operation;
            RETURN NEW;
        END;
        $$
    """)
    op.execute("""
        DROP TRIGGER IF EXISTS trg_finances_contract_guard ON public.finances;
        CREATE TRIGGER trg_finances_contract_guard
        BEFORE INSERT OR UPDATE
        ON public.finances FOR EACH ROW EXECUTE FUNCTION public.eg_finance_contract_guard()
    """)
    # NOT VALID preserves legacy rows while enforcing the contract for every
    # newly inserted or updated row. Unknown historical records are locked by
    # the trigger above until supporting documents justify their direction.
    op.execute("""
        ALTER TABLE public.finances
        ADD CONSTRAINT ck_finance_type_operation_v2
        CHECK (type_operation IN ('ENCAISSEMENT', 'DECAISSEMENT', 'INCONNU')) NOT VALID
    """)
    op.execute("""
        ALTER TABLE public.finances
        ADD CONSTRAINT ck_finance_montant_positive_v2 CHECK (montant > 0) NOT VALID
    """)
    op.execute("""
        ALTER TABLE public.finances
        ADD CONSTRAINT ck_finance_devise_v2 CHECK (devise ~ '^[A-Z]{3}$' OR devise = 'FCFA') NOT VALID
    """)


def downgrade() -> None:
    op.drop_constraint("ck_finance_devise_v2", "finances", type_="check")
    op.drop_constraint("ck_finance_montant_positive_v2", "finances", type_="check")
    op.drop_constraint("ck_finance_type_operation_v2", "finances", type_="check")
    op.execute("DROP TRIGGER IF EXISTS trg_finances_contract_guard ON public.finances")
    op.execute("DROP FUNCTION IF EXISTS public.eg_finance_contract_guard()")
    # Keep widened and added columns. A downgrade must not remove columns that
    # may have acquired data since the upgrade.
    op.execute("DROP TRIGGER IF EXISTS trg_products_contract_reference ON public.products")
    op.execute("DROP FUNCTION IF EXISTS public.eg_product_reference_guard()")
    op.execute("DROP FUNCTION IF EXISTS public.eg_next_reference(TEXT, INTEGER)")

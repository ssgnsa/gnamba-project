-- Add metadata columns for attestation PDF generation and RPC to attach metadata
BEGIN;

ALTER TABLE IF EXISTS public.foncier_attestations
  ADD COLUMN IF NOT EXISTS hash_sha256 text,
  ADD COLUMN IF NOT EXISTS verify_url text,
  ADD COLUMN IF NOT EXISTS pdf_path text,
  ADD COLUMN IF NOT EXISTS pdf_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS printed_by uuid,
  ADD COLUMN IF NOT EXISTS printed_at timestamptz,
  ADD COLUMN IF NOT EXISTS print_count integer DEFAULT 0;

-- RPC to allow server-side jobs to attach PDF metadata atomically
CREATE OR REPLACE FUNCTION public.attach_foncier_attestation_pdf_metadata(
  p_attestation_id uuid,
  p_hash_sha256 text,
  p_verify_url text,
  p_pdf_path text,
  p_pdf_generated_at timestamptz,
  p_printed_by uuid
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.foncier_attestations SET
    hash_sha256 = COALESCE(p_hash_sha256, hash_sha256),
    verify_url = COALESCE(p_verify_url, verify_url),
    pdf_path = COALESCE(p_pdf_path, pdf_path),
    pdf_generated_at = COALESCE(p_pdf_generated_at, pdf_generated_at),
    printed_by = COALESCE(p_printed_by, printed_by),
    printed_at = COALESCE(p_pdf_generated_at, printed_at),
    print_count = COALESCE(print_count,0) + 1,
    updated_at = now()
  WHERE id = p_attestation_id;
END;
$$;

COMMIT;

import { createClient } from "@supabase/supabase-js";

export async function attachPdfMetadataToAttestation(options: {
  attestation_id?: string | null;
  ref?: string | null;
  pdf_path: string;
  hash_sha256: string;
  verify_url: string;
  printed_by?: string | null;
}) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return { error: 'Missing supabase config' };
  const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const res = await client.rpc("attach_foncier_attestation_pdf_metadata", {
      p_attestation_id: options.attestation_id,
      p_hash_sha256: options.hash_sha256,
      p_verify_url: options.verify_url,
      p_pdf_path: options.pdf_path,
      p_pdf_generated_at: new Date().toISOString(),
      p_printed_by: options.printed_by || null,
    });
    return res;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { error: errorMessage };
  }
}

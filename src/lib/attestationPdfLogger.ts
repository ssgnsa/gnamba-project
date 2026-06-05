import { supabaseService } from "./supabase.service";

export async function attachPdfMetadataToAttestation(options: {
  attestation_id?: string | null;
  ref?: string | null;
  pdf_path: string;
  hash_sha256: string;
  verify_url: string;
  printed_by?: string | null;
}) {
  return supabaseService.attachAttestationPdfMetadata({
    attestation_id: options.attestation_id ?? '',
    pdf_metadata: {
      ref: options.ref ?? null,
      pdf_path: options.pdf_path,
      hash_sha256: options.hash_sha256,
      verify_url: options.verify_url,
      pdf_generated_at: new Date().toISOString(),
      printed_by: options.printed_by ?? null,
    },
  });
}

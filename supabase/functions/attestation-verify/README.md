This folder contains the attestation-verify Edge Function. The function computes and verifies payload hashes and signatures.

Changes applied by the agent:
- No changes to runtime logic; the function already checks data.hash_sha256 and signature.
- Ensure the DB migration adds hash_sha256 column so verify endpoint can compare data.hash_sha256 with stored column.

Deployment:
- Deploy with `supabase functions deploy attestation-verify` after running migrations.
- Ensure ATTESTATION_PUBLIC_KEY env var is set in function settings.

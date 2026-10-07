-- Phase 3 dry-run report for parties migration
-- Run this script in psql to produce the report.

\set ON_ERROR_STOP on
BEGIN;

CREATE TEMP TABLE tmp_source_rows AS
WITH source_rows AS (
  SELECT id, trim(lower(coalesce(email, ''))) AS normalized_email, trim(lower(coalesce(telephone, ''))) AS normalized_phone,
         trim(coalesce(nom, '')) AS nom, trim(coalesce(prenom, '')) AS prenom,
         trim(coalesce(email, '')) AS email, trim(coalesce(telephone, '')) AS telephone,
         trim(coalesce(adresse, '')) AS adresse,
         'clients' AS source_table, id AS source_id, 'client' AS role_name
  FROM public.clients
  WHERE coalesce(email, '') <> '' OR coalesce(telephone, '') <> ''
  UNION ALL
  SELECT id, trim(lower(coalesce(email, ''))) AS normalized_email, trim(lower(coalesce(phone, ''))) AS normalized_phone,
         trim(coalesce(coalesce(nom, first_name || ' ' || last_name), '')) AS nom,
         trim(coalesce(prenom, '')) AS prenom,
         trim(coalesce(email, '')) AS email, trim(coalesce(phone, '')) AS telephone,
         '' AS adresse,
         'leads' AS source_table, id AS source_id, 'lead' AS role_name
  FROM public.leads
  WHERE coalesce(email, '') <> '' OR coalesce(phone, '') <> ''
  UNION ALL
  SELECT id, trim(lower(coalesce(email, ''))) AS normalized_email, trim(lower(coalesce(telephone, ''))) AS normalized_phone,
         trim(coalesce(nom, '')) AS nom, trim(coalesce(prenom, '')) AS prenom,
         trim(coalesce(email, '')) AS email, trim(coalesce(telephone, '')) AS telephone,
         '' AS adresse,
         'locataires' AS source_table, id AS source_id, 'locataire' AS role_name
  FROM public.locataires
  WHERE coalesce(email, '') <> '' OR coalesce(telephone, '') <> ''
)
SELECT * FROM source_rows;

CREATE TEMP TABLE tmp_source_counts AS
SELECT 'clients_source' AS metric, count(*) AS value FROM public.clients
UNION ALL
SELECT 'leads_source', count(*) FROM public.leads
UNION ALL
SELECT 'locataires_source', count(*) FROM public.locataires
UNION ALL
SELECT 'source_rows_with_contact', count(*) FROM tmp_source_rows;

CREATE TEMP TABLE tmp_party_creation_candidates AS
SELECT sr.source_table, sr.source_id, sr.normalized_email, sr.normalized_phone, sr.email, sr.telephone
FROM tmp_source_rows sr
LEFT JOIN public.parties p
  ON ((sr.normalized_email <> '' AND p.email IS NOT NULL AND lower(trim(p.email)) = sr.normalized_email)
      OR (sr.normalized_phone <> '' AND p.telephone IS NOT NULL AND lower(trim(p.telephone)) = sr.normalized_phone))
WHERE p.id IS NULL;

CREATE TEMP TABLE tmp_party_merge_candidates AS
SELECT sr.source_table, sr.source_id, sr.normalized_email, sr.normalized_phone, sr.email, sr.telephone
FROM tmp_source_rows sr
JOIN public.parties p
  ON ((sr.normalized_email <> '' AND p.email IS NOT NULL AND lower(trim(p.email)) = sr.normalized_email)
      OR (sr.normalized_phone <> '' AND p.telephone IS NOT NULL AND lower(trim(p.telephone)) = sr.normalized_phone));

-- Counts before migration
SELECT '*** SOURCE COUNTS ***'::text AS note;
SELECT * FROM tmp_source_counts;

-- Counts for dry-run
SELECT '*** PARTY CREATION CANDIDATES ***'::text AS note;
SELECT count(*) AS party_creation_candidates FROM tmp_party_creation_candidates;
SELECT '*** PARTY MERGE CANDIDATES ***'::text AS note;
SELECT count(*) AS party_merge_candidates FROM tmp_party_merge_candidates;

-- Sample rows that would create new parties
SELECT '*** CREATION CANDIDATES SAMPLE ***'::text AS note;
SELECT source_table, source_id, normalized_email, normalized_phone, email, telephone
FROM tmp_party_creation_candidates
ORDER BY source_table, source_id
LIMIT 50;

ROLLBACK;

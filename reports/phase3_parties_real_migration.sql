BEGIN;

CREATE TEMP TABLE tmp_source_rows AS
SELECT id,
       trim(lower(coalesce(email, ''))) AS normalized_email,
       trim(lower(coalesce(telephone, ''))) AS normalized_phone,
       trim(coalesce(nom, '')) AS nom,
       trim(coalesce(prenom, '')) AS prenom,
       trim(coalesce(email, '')) AS email,
       trim(coalesce(telephone, '')) AS telephone,
       trim(coalesce(adresse, '')) AS adresse,
       'clients' AS source_table,
       id AS source_id,
       'client' AS role_name,
       type_client,
       NULL::text AS source,
       NULL::text AS source_page,
       NULL::text AS source_form,
       NULL::integer AS score,
       NULL::text AS status,
       NULL::text AS ip_address,
       NULL::timestamptz AS consent_timestamp,
       NULL::text AS consent_text,
       NULL::jsonb AS channels_optin,
       NULL::text[] AS tags,
       NULL::text AS notes,
       NULL::uuid AS created_by,
       NULL::uuid AS agent_id,
       NULL::uuid AS user_id,
       NULL::timestamptz AS last_interaction_at
FROM public.clients
WHERE coalesce(email, '') <> '' OR coalesce(telephone, '') <> ''
UNION ALL
SELECT id,
       trim(lower(coalesce(email, ''))) AS normalized_email,
       trim(lower(coalesce(phone, ''))) AS normalized_phone,
       trim(coalesce(coalesce(nom, first_name || ' ' || last_name), '')) AS nom,
       trim(coalesce(prenom, '')) AS prenom,
       trim(coalesce(email, '')) AS email,
       trim(coalesce(phone, '')) AS telephone,
       '' AS adresse,
       'leads' AS source_table,
       id AS source_id,
       'lead' AS role_name,
       NULL::text AS type_client,
       source,
       source_page,
       source_form,
       score,
       status,
       ip_address,
       consent_timestamp,
       consent_text,
       channels_optin,
       tags,
       notes,
       created_by,
       agent_id,
       user_id,
       last_interaction_at
FROM public.leads
WHERE coalesce(email, '') <> '' OR coalesce(phone, '') <> ''
UNION ALL
SELECT id,
       trim(lower(coalesce(email, ''))) AS normalized_email,
       trim(lower(coalesce(telephone, ''))) AS normalized_phone,
       trim(coalesce(nom, '')) AS nom,
       trim(coalesce(prenom, '')) AS prenom,
       trim(coalesce(email, '')) AS email,
       trim(coalesce(telephone, '')) AS telephone,
       '' AS adresse,
       'locataires' AS source_table,
       id AS source_id,
       'locataire' AS role_name,
       NULL::text AS type_client,
       NULL::text AS source,
       NULL::text AS source_page,
       NULL::text AS source_form,
       NULL::integer AS score,
       NULL::text AS status,
       NULL::text AS ip_address,
       NULL::timestamptz AS consent_timestamp,
       NULL::text AS consent_text,
       NULL::jsonb AS channels_optin,
       NULL::text[] AS tags,
       NULL::text AS notes,
       NULL::uuid AS created_by,
       NULL::uuid AS agent_id,
       NULL::uuid AS user_id,
       NULL::timestamptz AS last_interaction_at
FROM public.locataires
WHERE coalesce(email, '') <> '' OR coalesce(telephone, '') <> '';

CREATE TEMP TABLE tmp_source_keyed AS
SELECT *,
  CASE WHEN normalized_email <> '' THEN 'email:' || normalized_email
       WHEN normalized_phone <> '' THEN 'phone:' || normalized_phone
       ELSE NULL END AS merge_key,
  CASE source_table WHEN 'clients' THEN 1 WHEN 'locataires' THEN 2 WHEN 'leads' THEN 3 END AS source_priority
FROM tmp_source_rows;

CREATE TEMP TABLE tmp_ranked AS
SELECT *,
  ROW_NUMBER() OVER (PARTITION BY merge_key ORDER BY source_priority, source_id) AS rn,
  COUNT(*) OVER (PARTITION BY merge_key) AS group_size
FROM tmp_source_keyed
WHERE merge_key IS NOT NULL;

CREATE TEMP TABLE tmp_party_candidates AS
SELECT *, NULL::integer AS rn, NULL::integer AS group_size
FROM tmp_source_keyed
WHERE merge_key IS NULL
UNION ALL
SELECT *
FROM tmp_ranked
WHERE rn = 1;

INSERT INTO public.parties (id, party_type, nom, prenom, raison_sociale, email, telephone, adresse, source_table, source_id)
SELECT gen_random_uuid(),
       CASE WHEN source_table = 'clients' AND lower(coalesce(type_client, '')) = 'entreprise' THEN 'entreprise' ELSE 'personne_physique' END,
       nom,
       prenom,
       NULL,
       email,
       telephone,
       adresse,
       source_table,
       source_id
FROM tmp_party_candidates;

CREATE TEMP TABLE tmp_party_started AS
SELECT p.id AS party_id, c.*
FROM public.parties p
JOIN tmp_party_candidates c ON p.source_table = c.source_table AND p.source_id = c.source_id;

CREATE TEMP TABLE tmp_party_assignments AS
SELECT k.source_table,
       k.source_id,
       COALESCE(m.party_id, m2.party_id) AS party_id
FROM tmp_source_keyed k
LEFT JOIN tmp_party_started m ON k.source_table = m.source_table AND k.source_id = m.source_id
LEFT JOIN tmp_party_started m2 ON k.merge_key IS NOT NULL AND k.merge_key = m2.merge_key;

INSERT INTO public.party_roles (id, party_id, role, status, started_at)
SELECT gen_random_uuid(),
       a.party_id,
       CASE source_table WHEN 'clients' THEN 'client' WHEN 'leads' THEN 'lead' WHEN 'locataires' THEN 'locataire' END,
       'actif',
       now()
FROM tmp_party_assignments a;

INSERT INTO public.party_lead_details (party_id, source, source_page, source_form, score, status, ip_address, consent_timestamp, consent_text, channels_optin, tags, notes, created_by, agent_id, user_id, last_interaction_at, created_at, updated_at)
SELECT ps.party_id,
       ps.source,
       ps.source_page,
       ps.source_form,
       ps.score,
       ps.status,
       ps.ip_address,
       ps.consent_timestamp,
       ps.consent_text,
       ps.channels_optin,
       ps.tags,
       ps.notes,
       ps.created_by,
       ps.agent_id,
       ps.user_id,
       ps.last_interaction_at,
       now(),
       now()
FROM tmp_party_started ps
JOIN public.leads l ON ps.source_table = 'leads' AND ps.source_id = l.id;

COMMIT;

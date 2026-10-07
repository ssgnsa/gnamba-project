# Modele d'acces Foncier

Ce document resume le modele d'acces reel du module Foncier tel qu'il est implante dans le code et les migrations actuelles.

## Principes

- Les parcours internes continuent de lire et d'ecrire directement les tables Foncier.
- La verification publique passe par l'Edge Function `attestation-verify`.
- La surface publique ne doit exposer que les donnees strictement necessaires a la verification.
- Les decisions d'acces ne reposent pas sur `user_metadata`.
- Le filtrage par village s'appuie sur `user_village_access`.

## Roles applicatifs

### `admin`

- Acces complet aux donnees Foncier.
- Peut gerer les lots, les attestations, les temoins et les configurations.
- Peut voir les journaux et les impressions completes.

### `gestionnaire`

- Acces operationnel au module Foncier.
- Peut lire et modifier les donnees du village ou des villages autorises.
- Peut generer et imprimer les attestations selon les regles en vigueur.

### `employe`

- Acces limite.
- Peut consulter uniquement les parcours autorises par l'application.
- Ne doit pas acceder a la verification publique minimale en lecture directe des tables.

## Tables et vues utiles

### `foncier_lots`

- Contient les lots, les proprietaires de reference et les champs d'exploitation interne.
- La lecture est bornee par les politiques RLS et les acces de village.

### `foncier_attestations`

- Contient les attestations, les signatures, les hashes et les metadonnees d'audit.
- Les parcours internes peuvent lire les champs complets.
- La verification publique ne doit pas interroger cette table directement.

### `foncier_attestation_temoins`

- Contient les temoins rattaches a une attestation.
- Les temoins complets restent reserves aux parcours internes et a l'impression.

### `user_village_access`

- Lie un utilisateur a un ou plusieurs villages.
- Sert de base a la plupart des policies Foncier de lecture et d'edition.

### `public.v_foncier_attestation_verification`

- Vue minimale utilisee par l'Edge Function.
- Expose uniquement les champs de verification et le resume du lot.
- La vue est declaree avec `security_invoker = true`.

## Surface publique de verification

La verification publique est volontairement reduite:

- `reference`
- `date_etablissement`
- `control_number`
- `statut`
- `qr_payload`
- `hash_sha256`
- `signature_numerique`
- `created_at`
- `version`
- `deleted_at`
- resume du lot (`reference`, `numero_lot`, `nom_lotissement`, `village`, `superficie`, `quartier`, `commune`, `departement`, `region`)

Le frontend public masque les donnees privees lorsque la reponse ne les contient pas.

## Donnees privees maintenues en interne

- Identite complete du titulaire.
- Champs biometriques et preuves associees.
- Liste detaillee des temoins.
- Historique d'audit et donnees d'impression completes.

## Migrations Foncier a garder en tete

Ces fichiers forment la base active du module:

- `20260324000000_create_foncier_base_tables_and_rpc.sql`
- `20260326000000_create_foncier_attestations_tables.sql`
- `20260404080000_fix_rls_policies_foncier_attestations.sql`
- `20260508110000_fix_foncier_rpc_security.sql`
- `20260608171419_foncier_phase1_critical_rls.sql`
- `20260609102844_foncier_village_normalization.sql`
- `20260609105850_foncier_public_verification_hardening.sql`

## Candidats a consolidation

Ces migrations ou scripts sont conserves comme historique ou secours, mais doivent etre revus avant toute suppression:

- `supabase/manual-migrations/20260407030000_foncier_rls_manual.sql`
- `supabase/migrations/20260508100000_fix_foncier_standalone.sql`
- `supabase/migrations/20260510100000_fix_foncier_functions_rls.sql`

Ils ne doivent pas etre supprimes tant qu'une verification complete n'a pas confirme que leurs effets sont couverts par une migration plus recente.

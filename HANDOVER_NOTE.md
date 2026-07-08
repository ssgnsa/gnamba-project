---
document: HANDOVER_NOTE.md
phase: 0
session: 1
generated_at: "2026-06-17T12:11:00Z"
status: draft
inputs_used: ["PROGRESS_STATE.json", "supabase/seed/create_local_admin.sql"]
absent_services: []
---

Action: Création d'un administrateur local.

- admin email: ssgnabia@gmail.com
- nom: Souley Gnamba
- rôle: admin
- motif: passage en mode local (administration unique)

Notes opérationnelles:
- Seed SQL créé: `supabase/seed/create_local_admin_auth.sql`
- Crée et met à jour l'utilisateur dans `auth.users` puis son profil dans `public.user_profiles`.
- Les anciens comptes `ssgnsa@gmail.com` et `ssgnsa@outlook.com` sont supprimés par le seed.

Validation requise:
- Soma doit confirmer la création et fournir la preuve (entrée VAL-XXX dans `validation_trail`).

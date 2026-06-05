-- Activer Supabase Realtime pour la table rent_payments
-- Ceci permet les notifications en temps réel pour les paiements de loyers

-- Activer la replication Realtime pour la table rent_payments
alter publication supabase_realtime add table rent_payments;

-- Optionnel : Activer pour les tables liées pour avoir les données complètes
alter publication supabase_realtime add table locataires;
alter publication supabase_realtime add table properties;
alter publication supabase_realtime add table lease_contracts;

-- Commentaire explicatif
comment on publication supabase_realtime is 'Replication Realtime pour les notifications en temps réel des paiements de loyers';

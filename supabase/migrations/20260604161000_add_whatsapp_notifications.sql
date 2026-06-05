-- Ajouter des champs pour les notifications WhatsApp
-- Cette migration ajoute des numéros de téléphone WhatsApp pour les notifications

-- Ajouter un champ WhatsApp dans la table locataires (si elle existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'locataires') THEN
        ALTER TABLE locataires 
        ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
        ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled BOOLEAN DEFAULT true;
        
        COMMENT ON COLUMN locataires.whatsapp_number IS 'Numéro WhatsApp pour les notifications (format: +225XXXXXXXXX)';
        COMMENT ON COLUMN locataires.whatsapp_notifications_enabled IS 'Activer/désactiver les notifications WhatsApp pour ce locataire';
    END IF;
END $$;

-- Ajouter un champ WhatsApp dans la table tenants (si elle existe - alternative)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tenants') THEN
        ALTER TABLE tenants 
        ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
        ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled BOOLEAN DEFAULT true;
        
        COMMENT ON COLUMN tenants.whatsapp_number IS 'Numéro WhatsApp pour les notifications (format: +225XXXXXXXXX)';
        COMMENT ON COLUMN tenants.whatsapp_notifications_enabled IS 'Activer/désactiver les notifications WhatsApp pour ce locataire';
    END IF;
END $$;

-- Ajouter une table pour l'historique des notifications WhatsApp (optionnel)
CREATE TABLE IF NOT EXISTS whatsapp_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    provider TEXT NOT NULL,
    payment_id UUID REFERENCES rent_payments(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES locataires(id) ON DELETE SET NULL,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE whatsapp_notifications IS 'Historique des notifications WhatsApp envoyées';
COMMENT ON COLUMN whatsapp_notifications.recipient_phone IS 'Numéro de téléphone du destinataire (format: +225XXXXXXXXX)';
COMMENT ON COLUMN whatsapp_notifications.status IS 'Statut de la notification: pending, sent, failed';
COMMENT ON COLUMN whatsapp_notifications.provider IS 'Fournisseur WhatsApp utilisé: twilio, messagebird, whatsapp_business_api, callmebot';

-- Créer un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_status ON whatsapp_notifications(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_created_at ON whatsapp_notifications(created_at DESC);

-- Activer le trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_notifications_updated_at 
    BEFORE UPDATE ON whatsapp_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activer Realtime sur la table des notifications WhatsApp
alter publication supabase_realtime add table whatsapp_notifications;

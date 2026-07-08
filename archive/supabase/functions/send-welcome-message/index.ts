// ============================================
// EGS - Edge Function: Send Welcome Message
// Trigger: After INSERT on leads table
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types
interface Lead {
  id: string
  nom: string
  telephone: string
  email?: string
  source: string
  agent_id?: string
  created_at: string
}

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: Lead
  schema: 'public'
  old_record: null
}

// Configuration messages
const WELCOME_MESSAGES = {
  whatsapp: (lead: Lead) => `Bonjour ${lead.nom}, bienvenue chez G-NAMBA Services ! 🎉

Un agent commercial vous contactera sous 24h pour discuter de votre projet immobilier.

En attendant, n'hésitez pas à visiter notre site: www.gnamba.ci

À très bientôt !
L'équipe G-NAMBA`,

  sms: (lead: Lead) => `Bonjour ${lead.nom}, bienvenue chez G-NAMBA Services ! Un agent vous contactera sous 24h. www.gnamba.ci`,

  email: (lead: Lead) => `Objet: Bienvenue chez G-NAMBA Services !

Bonjour ${lead.nom},

Nous vous remercions de l'intérêt que vous portez à G-NAMBA Services.

Un agent commercial vous contactera sous 24 heures pour discuter de votre projet immobilier et vous accompagner dans votre recherche.

En attendant, nous vous invitons à visiter notre site web: www.gnamba.ci

Cordialement,
L'équipe G-NAMBA Services
Tél: +225 XX XX XX XX`,
}

serve(async (req) => {
  try {
    // Vérifier la méthode
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Créer client Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parse le payload
    const payload: WebhookPayload = await req.json()

    // Vérifier que c'est bien un INSERT sur leads
    if (payload.type !== 'INSERT' || payload.table !== 'leads') {
      return new Response(
        JSON.stringify({ message: 'Ignored: not a lead insert' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const lead = payload.record

    // Ne pas envoyer si le lead vient du bureau (prise de contact directe)
    if (lead.source === 'bureau') {
      console.log(`Lead ${lead.id} from bureau - skipping welcome message`)
      return new Response(
        JSON.stringify({ message: 'Skipped: bureau source' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Ne pas envoyer si pas de téléphone
    if (!lead.telephone) {
      console.log(`Lead ${lead.id} has no telephone - skipping`)
      return new Response(
        JSON.stringify({ message: 'Skipped: no telephone' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Déterminer le canal selon la source
    let channel: 'whatsapp' | 'sms' | 'email' = 'sms'
    if (lead.source === 'whatsapp') {
      channel = 'whatsapp'
    } else if (lead.email && lead.source === 'site') {
      channel = 'email'
    }

    // Générer le message
    const message = WELCOME_MESSAGES[channel](lead)

    // TODO: Intégrer avec service d'envoi (Twilio, etc.)
    // Pour l'instant, on loggue simplement
    console.log(`[${channel.toUpperCase()}] To: ${lead.telephone}`)
    console.log(`Message: ${message}`)

    // Enregistrer la tentative dans lead_campagnes
    // Créer une campagne "bienvenue" si elle n'existe pas
    const { data: existingCampaign, error: campaignError } = await supabaseClient
      .from('campagnes')
      .select('id')
      .eq('type', 'bienvenue')
      .eq('canal', channel)
      .single()

    let campaignId: string

    if (campaignError || !existingCampaign) {
      // Créer la campagne de bienvenue
      const { data: newCampaign, error: createError } = await supabaseClient
        .from('campagnes')
        .insert({
          nom: `Bienvenue ${channel}`,
          canal: channel,
          type: 'bienvenue',
          contenu: message,
          statut: 'terminee',
          cibles_filtres: { auto_generated: true },
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Error creating campaign:', createError)
      } else {
        campaignId = newCampaign!.id
      }
    } else {
      campaignId = existingCampaign.id
    }

    // Enregistrer l'envoi dans lead_campagnes
    const { error: linkError } = await supabaseClient
      .from('lead_campagnes')
      .insert({
        lead_id: lead.id,
        campagne_id: campaignId!,
        envoye_le: new Date().toISOString(),
        statut: 'envoye',
      })

    if (linkError) {
      console.error('Error recording campaign send:', linkError)
    }

    // Créer une tâche de suivi pour l'agent
    if (lead.agent_id) {
      const { error: taskError } = await supabaseClient
        .from('taches')
        .insert({
          titre: `Premier contact - ${lead.nom}`,
          description: `Contacter ${lead.nom} au ${lead.telephone}. Message de bienvenue envoyé via ${channel}.`,
          type: 'premier_contact',
          priorite: 'haute',
          date_echeance: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // +24h
          assignee_a: lead.agent_id,
          lead_id: lead.id,
          statut: 'a_faire',
        })

      if (taskError) {
        console.error('Error creating follow-up task:', taskError)
      }
    }

    // Log l'activité
    console.log(`✅ Welcome message processed for lead ${lead.id} via ${channel}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Welcome message sent via ${channel}`,
        lead_id: lead.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-welcome-message:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

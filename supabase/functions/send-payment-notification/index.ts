// ============================================
// EGS - Edge Function: Send Payment Notification
// Trigger: Called by the frontend after a rent payment is recorded
// Sends a OneSignal push notification without bundling server-only code in the client
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PaymentNotificationBody {
  property_id?: string
  payment_id: string
  montant: number
  locataire_nom: string
  propriete_nom?: string
  mois: string
}

interface PropertyRecord {
  onesignal_player_id: string | null
  adresse: string | null
}

const ALLOWED_ORIGINS = [
  'https://gnambaservices.ci',
  'https://www.gnambaservices.ci',
  'https://portal.gnambaservices.ci',
  'http://localhost:5173',
  'http://localhost:8080',
]

const getCorsHeaders = (req: Request): Record<string, string> => {
  const origin = req.headers.get('origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : 'https://gnambaservices.ci'

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    Vary: 'Origin',
  }
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: getCorsHeaders(req) })
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID') ?? Deno.env.get('VITE_ONESIGNAL_APP_ID') ?? ''
    const oneSignalApiKey = Deno.env.get('ONESIGNAL_API_KEY') ?? Deno.env.get('ONESIGNAL_REST_API_KEY') ?? ''

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase env vars missing' }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
      )
    }

    if (!oneSignalAppId || !oneSignalApiKey) {
      return new Response(
        JSON.stringify({ error: 'OneSignal env vars missing' }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
      )
    }

    const authHeader = req.headers.get('Authorization') || ''
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        persistSession: false,
      },
    })

    const { data: userData, error: userError } = await authClient.auth.getUser()
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
      )
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    })

    const body = (await req.json()) as PaymentNotificationBody
    const propertyId = body.property_id
    const fallbackAddress = body.propriete_nom || ''

    let property: PropertyRecord | null = null
    if (propertyId) {
      const { data, error } = await adminClient
        .from('properties')
        .select('onesignal_player_id, adresse')
        .eq('id', propertyId)
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Property lookup failed', details: error.message }),
          { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
        )
      }

      property = data as PropertyRecord
    }

    const playerId = property?.onesignal_player_id ?? null
    const propertyAddress = property?.adresse || fallbackAddress

    if (!playerId) {
      return new Response(
        JSON.stringify({ success: true, sent: false, reason: 'no_player_id' }),
        { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
      )
    }

    const notificationPayload = {
      app_id: oneSignalAppId,
      include_player_ids: [playerId],
      headings: {
        fr: `💰 Paiement reçu - ${Number(body.montant).toLocaleString('fr-FR')} FCFA`,
      },
      contents: {
        fr: `${body.locataire_nom} a payé son loyer pour ${body.mois}. ${propertyAddress ? `Propriété: ${propertyAddress}` : ''}`.trim(),
      },
      data: {
        type: 'payment_confirmation',
        payment_id: body.payment_id,
        montant: body.montant,
        locataire: body.locataire_nom,
        propriete: propertyAddress,
      },
      url: 'https://gnambaservices.ci/dashboard/paiements',
      priority: 10,
    }

    const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${oneSignalApiKey}`,
      },
      body: JSON.stringify(notificationPayload),
    })

    const responseText = await oneSignalResponse.text()
    if (!oneSignalResponse.ok) {
      console.error('OneSignal API error:', responseText)
      return new Response(
        JSON.stringify({ error: 'OneSignal API error', details: responseText }),
        { status: 502, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: true,
        notification: JSON.parse(responseText),
      }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Error in send-payment-notification:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})

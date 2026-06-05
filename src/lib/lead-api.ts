/**
 * Lead API - Direct Supabase Integration (No backend)
 */

import { supabase } from './supabase'

export async function captureLead(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    const { phone, first_name, last_name, email, source, source_page, source_form, consent_text, channels_optin } = body

    if (!phone) {
      return new Response(JSON.stringify({ error: 'Phone number required' }), { status: 400 })
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({
        phone,
        first_name,
        last_name,
        email,
        source: source || 'api',
        source_page,
        source_form,
        consent_text: consent_text || "Consentement via API",
        channels_optin: channels_optin || ['phone'],
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Capture lead error:', error)
    return new Response(JSON.stringify({ error: 'Failed to capture lead' }), { status: 500 })
  }
}

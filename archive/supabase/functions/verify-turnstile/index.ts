// ============================================
// EGS - Edge Function: Verify Turnstile
// Vérifie le token Cloudflare Turnstile côté serveur
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface VerifyTurnstileBody {
  token?: string
  remoteip?: string
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
    'Cache-Control': 'no-store',
  }
}

serve(async (req) => {
  const headers = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers })
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...headers, 'Content-Type': 'application/json' } },
      )
    }

    const secret =
      Deno.env.get('CLOUDFLARE_TURNSTILE_SECRET_KEY') ||
      Deno.env.get('TURNSTILE_SECRET_KEY') ||
      ''

    if (!secret) {
      return new Response(
        JSON.stringify({ success: false, error: 'Turnstile secret missing' }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } },
      )
    }

    const body = (await req.json()) as VerifyTurnstileBody
    const token = body.token?.trim()

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing token' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } },
      )
    }

    const form = new URLSearchParams({
      secret,
      response: token,
    })

    if (body.remoteip) {
      form.set('remoteip', body.remoteip)
    }

    const verifyResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      },
    )

    const result = (await verifyResponse.json()) as {
      success?: boolean
      'error-codes'?: string[]
      error?: string
    }

    return new Response(
      JSON.stringify({
        success: Boolean(result.success),
        error: result.success ? null : result['error-codes'] || result.error,
      }),
      { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Error in verify-turnstile:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } },
    )
  }
})

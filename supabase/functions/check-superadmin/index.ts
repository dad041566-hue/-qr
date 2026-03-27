import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('origin') ?? ''
  const allowed = [
    'https://tableflow.com',
    'https://www.tableflow.com',
    'https://tabledotflow.com',
    'https://www.tabledotflow.com',
  ]
  // Allow localhost in development
  if (origin.startsWith('http://localhost:')) allowed.push(origin)
  return allowed.includes(origin) ? origin : allowed[0]
}

function corsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }
}

function json(data: unknown, init: ResponseInit = {}, req?: Request) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(req ? corsHeaders(req) : {}),
      ...(init.headers ?? {}),
    },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return json({ ok: true }, {}, req)
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, { status: 405 }, req)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ allowed: false }, { status: 401 }, req)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !anonKey) {
    return json({ error: 'Server configuration error.' }, { status: 500 }, req)
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error } = await callerClient.auth.getUser()
  if (error || !user) {
    return json({ allowed: false }, { status: 401 }, req)
  }

  const roleOk = user.app_metadata?.role === 'super_admin'

  if (!roleOk) {
    return json({ allowed: false }, { status: 403 }, req)
  }

  return json({ allowed: true }, {}, req)
})
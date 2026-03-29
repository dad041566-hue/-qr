import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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
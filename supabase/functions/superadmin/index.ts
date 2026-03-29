import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

function json(data: unknown, status = 200, req?: Request) {
  const response = typeof status === 'number'
    ? { status }
    : { ...status }

  return new Response(JSON.stringify(data), {
    ...response,
    headers: {
      'Content-Type': 'application/json',
      ...((response as ResponseInit).headers ?? {}),
      ...(req ? corsHeaders(req) : {}),
    },
  })
}

async function verifySuperAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { user: null as any, status: 401 }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !serviceRole || !anonKey) {
    return { user: null as any, status: 500, error: 'Server configuration error' }
  }

  const adminClient = createClient(supabaseUrl, serviceRole)
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error } = await callerClient.auth.getUser()
  if (error || !user) {
    return { user: null as any, status: 401 }
  }

  const isAllowed = user.app_metadata?.role === 'super_admin'
  if (!isAllowed) {
    return { user: null as any, status: 403 }
  }

  return { user, status: 200, adminClient }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  // check-super-admin은 403 여부만 반환 (redirect용이므로 에러 대신 {allowed: false})
  if (action === 'check-super-admin') {
    const verified = await verifySuperAdmin(req)
    return json({ allowed: verified.status === 200 }, 200, req)
  }

  const verified = await verifySuperAdmin(req)
  if (verified.status === 500) return json({ error: verified.error }, 500, req)
  if (verified.status === 401) return json({ error: 'Unauthorized' }, 401, req)
  if (verified.status === 403) return json({ error: 'Forbidden' }, 403, req)

  const { adminClient } = verified

  try {
    if (action === 'list-stores') {
      const { data, error } = await adminClient
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return json(data, 200, req)
    }

    if (action === 'update-subscription') {
      if (req.method !== 'POST') {
        return json({ error: 'Method not allowed' }, { status: 405 }, req)
      }

      let body: { storeId?: unknown; subscriptionStart?: unknown; subscriptionEnd?: unknown; isActive?: unknown }
      try {
        body = await req.json()
      } catch {
        return json({ error: 'Invalid JSON body' }, { status: 400 }, req)
      }

      const { storeId, subscriptionStart, subscriptionEnd, isActive } = body
      if (typeof storeId !== 'string' || storeId.trim() === '') {
        return json({ error: 'storeId is required' }, { status: 400 }, req)
      }

      if (typeof subscriptionStart !== 'string' && subscriptionStart !== null) {
        return json({ error: 'subscriptionStart must be string or null' }, { status: 400 }, req)
      }
      if (typeof subscriptionEnd !== 'string' && subscriptionEnd !== null) {
        return json({ error: 'subscriptionEnd must be string or null' }, { status: 400 }, req)
      }
      if (typeof isActive !== 'boolean') {
        return json({ error: 'isActive must be boolean' }, { status: 400 }, req)
      }
      if (typeof subscriptionStart === 'string' && typeof subscriptionEnd === 'string' && subscriptionEnd < subscriptionStart) {
        return json({ error: 'subscription_end must be after subscription_start' }, { status: 400 }, req)
      }

      const { error } = await adminClient
        .from('stores')
        .update({
          subscription_start: subscriptionStart,
          subscription_end: subscriptionEnd,
          is_active: isActive,
        })
        .eq('id', storeId)

      if (error) throw error
      return json({ success: true }, 200, req)
    }

    return json({ error: 'Unknown action' }, 400, req)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류'
    return json({ error: message }, 500, req)
  }
})

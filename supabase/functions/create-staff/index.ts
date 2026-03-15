import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  })
}

const ALLOWED_ROLES = ['owner', 'manager', 'staff'] as const
const STAFF_CREATOR_ROLES = ['owner', 'manager'] as const
const PASSWORD_PATTERN = /^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/

type StoreRole = (typeof ALLOWED_ROLES)[number]

type VerifyResult =
  | { status: 200; user: { id: string }; adminClient: ReturnType<typeof createClient> }
  | { status: 401; user: null; adminClient: null }
  | { status: 403; user: null; adminClient: null }
  | { status: 500; user: null; adminClient: null; message: string }

async function verifyCaller(authHeader: string | null): Promise<VerifyResult> {
  if (!authHeader) {
    return { status: 401, user: null, adminClient: null }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !serviceKey || !anonKey) {
    return { status: 500, user: null, adminClient: null, message: 'Server configuration error.' }
  }

  const adminClient = createClient(supabaseUrl, serviceKey)
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error } = await callerClient.auth.getUser()
  if (error || !user) {
    return { status: 401, user: null, adminClient: null }
  }

  return { status: 200, user, adminClient }
}

interface Payload {
  email: string
  password: string
  name: string
  role: 'manager' | 'staff'
  storeId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return json({ ok: true })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 })
  }

  const verified = await verifyCaller(req.headers.get('Authorization'))
  if (verified.status === 500) {
    return json({ error: verified.message }, { status: 500 })
  }
  if (verified.status === 401) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { adminClient, user } = verified
  if (!adminClient || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Payload
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, password, name, role, storeId } = body
  if (!email || !password || !name || !storeId || !role) {
    return json({ error: 'email, password, name, role, storeId are required' }, { status: 400 })
  }

  if (!['owner', 'manager'].includes(role)) {
    return json({ error: 'Invalid role for staff account creation' }, { status: 400 })
  }

  if (!PASSWORD_PATTERN.test(password)) {
    return json({ error: 'Password policy violation' }, { status: 400 })
  }

  const { data: requesterMember, error: requesterError } = await adminClient
    .from('store_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('store_id', storeId)
    .maybeSingle()

  if (requesterError) {
    return json({ error: requesterError.message }, { status: 500 })
  }

  if (!requesterMember || !STAFF_CREATOR_ROLES.includes(requesterMember.role as StoreRole)) {
    return json({ error: 'Forbidden' }, { status: 403 })
  }

  let createdUserId: string | null = null

  try {
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
      app_metadata: { role },
    })

    if (authError || !authData.user) {
      throw new Error(authError?.message ?? 'Unable to create account')
    }

    createdUserId = authData.user.id

    const { error: memberError } = await adminClient.from('store_members').insert({
      store_id: storeId,
      user_id: createdUserId,
      role: role as StoreRole,
      is_first_login: true,
    })

    if (memberError) {
      throw new Error(memberError.message)
    }

    return json({
      success: true,
      userId: createdUserId,
      storeId,
      role,
      name,
      email,
    })
  } catch (err) {
    if (createdUserId) {
      await adminClient.auth.admin.deleteUser(createdUserId)
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return json({ error: message }, { status: 500 })
  }
})
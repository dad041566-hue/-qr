import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

  const superAdmins = (Deno.env.get('SUPABASE_SUPERADMIN_EMAILS') ?? '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)

  const isAllowed =
    user.app_metadata?.role === 'super_admin' ||
    superAdmins.includes((user.email ?? '').toLowerCase())

  if (!isAllowed) {
    return { user: null as any, status: 403 }
  }

  return { user, status: 200, adminClient }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  // check-super-admin은 403 여부만 반환 (redirect용이므로 에러 대신 {allowed: false})
  if (action === 'check-super-admin') {
    const verified = await verifySuperAdmin(req)
    return json({ allowed: verified.status === 200 })
  }

  const verified = await verifySuperAdmin(req)
  if (verified.status === 500) return json({ error: verified.error }, 500)
  if (verified.status === 401) return json({ error: 'Unauthorized' }, 401)
  if (verified.status === 403) return json({ error: 'Forbidden' }, 403)

  const { adminClient } = verified

  try {
    if (action === 'list-stores') {
      const { data, error } = await adminClient
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return json(data)
    }

    if (action === 'create-store-with-owner') {
      const body = await req.json()
      const { storeName, storeSlug, address, phone, subscriptionStart, subscriptionEnd, ownerEmail, ownerPassword } = body

      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(storeSlug)) {
        return json({ error: 'slug는 소문자 영문, 숫자, 하이픈만 허용됩니다.' }, 400)
      }
      if (!ownerPassword || ownerPassword.length < 8) {
        return json({ error: '비밀번호는 최소 8자 이상이어야 합니다.' }, 400)
      }

      // 1. 점주 계정 생성
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: ownerEmail,
        password: ownerPassword,
        email_confirm: true,
      })
      if (authError) throw new Error(`계정 생성 실패: ${authError.message}`)

      // 2. 매장 생성
      const { data: store, error: storeError } = await adminClient
        .from('stores')
        .insert({
          owner_id: authData.user.id,
          name: storeName,
          slug: storeSlug,
          address: address ?? null,
          phone: phone ?? null,
          subscription_start: subscriptionStart ?? null,
          subscription_end: subscriptionEnd ?? null,
          is_active: true,
        })
        .select()
        .single()

      if (storeError) {
        await adminClient.auth.admin.deleteUser(authData.user.id)
        throw new Error(`매장 생성 실패: ${storeError.message}`)
      }

      // 3. store_members 연결
      const { error: memberError } = await adminClient
        .from('store_members')
        .insert({ store_id: store.id, user_id: authData.user.id, role: 'owner', is_first_login: true })

      if (memberError) {
        await adminClient.auth.admin.deleteUser(authData.user.id)
        await adminClient.from('stores').delete().eq('id', store.id)
        throw new Error(`멤버 연결 실패: ${memberError.message}`)
      }

      return json({ store, userId: authData.user.id })
    }

    if (action === 'update-subscription') {
      const body = await req.json()
      const { storeId, subscriptionStart, subscriptionEnd, isActive } = body
      const { error } = await adminClient
        .from('stores')
        .update({
          subscription_start: subscriptionStart,
          subscription_end: subscriptionEnd,
          is_active: isActive,
        })
        .eq('id', storeId)

      if (error) throw error
      return json({ success: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류'
    return json({ error: message }, 500)
  }
})
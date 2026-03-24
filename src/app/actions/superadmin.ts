'use server'

import { createClient } from '@/lib/supabase/server'
import type { StoreRow } from '@/types/database'

async function getSuperadminHeaders(): Promise<{
  supabaseUrl: string
  anonKey: string
  accessToken: string
}> {
  const supabase = await createClient()

  // getUser()로 서버 측 토큰 검증 (getSession()은 토큰 위변조 감지 불가)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('로그인이 필요합니다.')
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) throw new Error('세션이 없습니다.')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) throw new Error('Supabase 환경 변수가 누락되었습니다.')

  return { supabaseUrl, anonKey, accessToken: session.access_token }
}

export async function createStoreWithOwnerAction(
  slug: string,
  name: string,
  email: string,
  password: string,
  subscriptionStart?: string,
  subscriptionEnd?: string,
): Promise<StoreRow> {
  const { supabaseUrl, anonKey, accessToken } = await getSuperadminHeaders()

  const res = await fetch(`${supabaseUrl}/functions/v1/create-store-with-owner`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
    body: JSON.stringify({
      slug,
      name,
      ownerEmail: email,
      ownerPassword: password,
      subscriptionStart: subscriptionStart ?? null,
      subscriptionEnd: subscriptionEnd ?? null,
    }),
  })

  let json: { store?: StoreRow; error?: string; message?: string }
  try {
    json = await res.json()
  } catch {
    throw new Error(`서버 응답 오류 (HTTP ${res.status})`)
  }
  if (!res.ok) throw new Error(json.error ?? json.message ?? `요청 실패 (${res.status})`)
  if (!json.store) throw new Error('매장 생성 응답이 올바르지 않습니다.')
  return json.store
}

export async function updateSubscriptionAction(
  storeId: string,
  startDate: string | null,
  endDate: string | null,
): Promise<void> {
  const { supabaseUrl, anonKey, accessToken } = await getSuperadminHeaders()

  const url = `${supabaseUrl}/functions/v1/superadmin?action=update-subscription`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
    body: JSON.stringify({
      storeId,
      subscriptionStart: startDate,
      subscriptionEnd: endDate,
    }),
  })

  let json: { error?: string; message?: string }
  try {
    json = await res.json()
  } catch {
    throw new Error(`서버 응답 오류 (HTTP ${res.status})`)
  }
  if (!res.ok) throw new Error(json.error ?? json.message ?? `요청 실패 (${res.status})`)
}

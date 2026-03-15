import { supabase } from '@/lib/supabase'
import type { StoreRow } from '@/types/database'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1`
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

function assertAuthConfig() {
  if (!SUPABASE_URL || !ANON_KEY) {
    throw new Error('Supabase 환경 변수가 누락되었습니다.')
  }
}

async function callSuperadmin<T>(action: string, body?: unknown): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('로그인이 필요합니다.')
  assertAuthConfig()

  const url = `${EDGE_FUNCTION_URL}/superadmin?action=${action}`
  const res = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': ANON_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? '요청 실패')
  return json as T
}

export async function checkSuperAdmin(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false
  return session.user.app_metadata?.role === 'super_admin'
}

interface CreateStoreWithOwnerResponse {
  store: StoreRow
}

async function callCreateStoreWithOwner<T>(body: unknown): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('로그인이 필요합니다.')
  assertAuthConfig()

  const url = `${EDGE_FUNCTION_URL}/create-store-with-owner`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': ANON_KEY,
    },
    body: JSON.stringify(body),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? '요청 실패')
  return json as T
}

export async function getAllStores(): Promise<StoreRow[]> {
  return callSuperadmin<StoreRow[]>('list-stores')
}

export interface CreateStoreWithOwnerParams {
  name: string
  slug: string
  address?: string
  phone?: string
  subscriptionStart?: string
  subscriptionEnd?: string
  ownerEmail: string
  ownerPassword: string
}

export async function createStoreWithOwner(params: CreateStoreWithOwnerParams): Promise<StoreRow> {
  const data = await callCreateStoreWithOwner<CreateStoreWithOwnerResponse>(params)
  return data.store
}

export async function updateStoreSubscription(params: {
  storeId: string
  subscriptionStart: string | null
  subscriptionEnd: string | null
  isActive: boolean
}): Promise<void> {
  await callSuperadmin('update-subscription', params)
}

import { supabase as _supabase } from '@/lib/supabase'
import type { PointReason } from '@/types/database'

// Cast to any to bypass Database type generic resolution issues with supabase-js v2.99
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any

// ============================================================
// Types
// ============================================================

export interface CustomerWithHistory {
  id: string
  storeId: string
  authUserId: string | null
  name: string
  profileImage: string | null
  phone: string | null
  kakaoFriend: boolean
  totalPoints: number
  visitCount: number
  lastVisitedAt: string | null
  createdAt: string
}

export interface PointHistoryItem {
  id: string
  delta: number
  reason: PointReason
  memo: string | null
  grantedBy: string | null
  createdAt: string
}

export interface StorePointEvent {
  id: string
  storeId: string
  name: string
  points: number
  isActive: boolean
  createdAt: string
}

// ============================================================
// Customers
// ============================================================

export async function fetchCustomers(storeId: string): Promise<CustomerWithHistory[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('store_id', storeId)
    .order('total_points', { ascending: false })

  if (error) throw error

  return (data ?? []).map(toCustomer)
}

export async function getCustomerByAuthId(
  storeId: string,
  authUserId: string,
): Promise<CustomerWithHistory | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('store_id', storeId)
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (error) throw error
  return data ? toCustomer(data) : null
}

export async function upsertCustomer(
  storeId: string,
  authUserId: string,
  name: string,
  profileImage?: string | null,
): Promise<CustomerWithHistory> {
  const { data, error } = await supabase
    .from('customers')
    .upsert(
      { store_id: storeId, auth_user_id: authUserId, name, profile_image: profileImage ?? null },
      { onConflict: 'store_id,auth_user_id', ignoreDuplicates: false },
    )
    .select()
    .single()

  if (error) throw error
  return toCustomer(data)
}

// ============================================================
// Points
// ============================================================

export async function grantPoints(
  customerId: string,
  delta: number,
  reason: PointReason = 'manual_grant',
  memo?: string | null,
  orderId?: string | null,
): Promise<void> {
  const { error } = await supabase.rpc('grant_points', {
    p_customer_id: customerId,
    p_delta: delta,
    p_reason: reason,
    p_memo: memo ?? null,
    p_order_id: orderId ?? null,
  })

  if (error) {
    if (error.message?.includes('insufficient_points')) {
      throw new Error('포인트가 부족합니다.')
    }
    if (error.message?.includes('not_authorized')) {
      throw new Error('권한이 없습니다.')
    }
    throw error
  }
}

export async function getPointHistory(customerId: string): Promise<PointHistoryItem[]> {
  const { data, error } = await supabase
    .from('customer_point_history')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    delta: row.delta as number,
    reason: row.reason as PointReason,
    memo: row.memo as string | null,
    grantedBy: row.granted_by as string | null,
    createdAt: row.created_at as string,
  }))
}

// ============================================================
// Store Point Events
// ============================================================

export async function fetchStorePointEvents(storeId: string): Promise<StorePointEvent[]> {
  const { data, error } = await supabase
    .from('store_point_events')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map(toEvent)
}

export async function upsertStorePointEvent(
  storeId: string,
  name: string,
  points: number,
  isActive = true,
  eventId?: string,
): Promise<StorePointEvent> {
  const payload = eventId
    ? { id: eventId, store_id: storeId, name, points, is_active: isActive }
    : { store_id: storeId, name, points, is_active: isActive }

  const { data, error } = await supabase
    .from('store_point_events')
    .upsert(payload)
    .select()
    .single()

  if (error) throw error
  return toEvent(data)
}

export async function deleteStorePointEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from('store_point_events').delete().eq('id', eventId)
  if (error) throw error
}

// ============================================================
// Mappers
// ============================================================

export async function createCustomerByPhone(
  storeId: string,
  name: string,
  phone: string,
): Promise<CustomerWithHistory> {
  const { data, error } = await supabase
    .from('customers')
    .insert({ store_id: storeId, name, phone })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('이미 등록된 전화번호입니다.')
    throw error
  }
  return toCustomer(data)
}

export async function setKakaoFriend(customerId: string): Promise<void> {
  const { error } = await supabase
    .from('customers')
    .update({ kakao_friend: true })
    .eq('id', customerId)

  if (error) throw error
}

function toCustomer(row: Record<string, unknown>): CustomerWithHistory {
  return {
    id: row.id as string,
    storeId: row.store_id as string,
    authUserId: row.auth_user_id as string | null,
    name: row.name as string,
    profileImage: row.profile_image as string | null,
    phone: row.phone as string | null,
    kakaoFriend: row.kakao_friend as boolean,
    totalPoints: row.total_points as number,
    visitCount: row.visit_count as number,
    lastVisitedAt: row.last_visited_at as string | null,
    createdAt: row.created_at as string,
  }
}

function toEvent(row: Record<string, unknown>): StorePointEvent {
  return {
    id: row.id as string,
    storeId: row.store_id as string,
    name: row.name as string,
    points: row.points as number,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
  }
}

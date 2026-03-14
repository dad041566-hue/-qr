import { supabase } from '@/lib/supabase'
import type { OrderStatus, TableStatus } from '@/types/database'

// ============================================================
// Orders
// ============================================================

export async function getOrders(storeId: string, status?: OrderStatus) {
  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================
// Tables
// ============================================================

export async function getTables(storeId: string) {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('store_id', storeId)
    .order('table_number', { ascending: true })

  if (error) throw error
  return data
}

export async function updateTableStatus(tableId: string, status: TableStatus) {
  const { data, error } = await supabase
    .from('tables')
    .update({ status })
    .eq('id', tableId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================
// Revenue (daily aggregation)
// ============================================================

export interface DailyRevenueRow {
  date: string
  amount: number
}

export async function getDailyRevenue(storeId: string, days: number): Promise<DailyRevenueRow[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceIso = since.toISOString()

  const { data, error } = await supabase
    .from('orders')
    .select('created_at, total_price')
    .eq('store_id', storeId)
    .eq('payment_status', 'paid')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: true })

  if (error) throw error

  // Aggregate by date
  const map: Record<string, number> = {}
  for (const row of data ?? []) {
    const date = row.created_at.slice(0, 10)
    map[date] = (map[date] ?? 0) + (row.total_price ?? 0)
  }

  return Object.entries(map).map(([date, amount]) => ({ date, amount }))
}

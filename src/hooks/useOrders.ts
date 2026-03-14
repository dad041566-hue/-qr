import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { getOrders, updateOrderStatus as apiUpdateOrderStatus } from '@/lib/api/admin'
import type { OrderRow, OrderItemRow, OrderStatus } from '@/types/database'

export interface OrderWithItems extends OrderRow {
  order_items: OrderItemRow[]
}

export function useOrders(storeId: string | null) {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    if (!storeId) return
    try {
      const data = await getOrders(storeId)
      setOrders((data as OrderWithItems[]) ?? [])
    } catch (err) {
      console.error('useOrders fetchOrders:', err)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    if (!storeId) return
    fetchOrders()

    const channel = supabase
      .channel(`orders:${storeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
        async (payload) => {
          // Fetch full order with items
          const { data } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setOrders((prev) => [data as OrderWithItems, ...prev])
            toast.success(`새 주문이 들어왔습니다! (테이블 ${(data as any).table_id ?? '-'})`)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
        (payload) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.new.id ? { ...o, ...(payload.new as OrderRow) } : o
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, fetchOrders])

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      await apiUpdateOrderStatus(orderId, status)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      )
    } catch (err) {
      console.error('useOrders updateOrderStatus:', err)
      toast.error('주문 상태 변경에 실패했습니다.')
    }
  }, [])

  const deleteOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId))
  }, [])

  return { orders, loading, updateOrderStatus, deleteOrder, refetch: fetchOrders }
}

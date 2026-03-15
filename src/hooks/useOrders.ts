import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { deleteOrder as apiDeleteOrder, getOrders, updateOrderStatus as apiUpdateOrderStatus } from '@/lib/api/admin'
import type { OrderRow, OrderItemRow, OrderStatus } from '@/types/database'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { notifyNewOrder, notifyOrderStatusChanged } from '@/hooks/useOrderNotification'

export interface OrderWithItems extends OrderRow {
  order_items: OrderItemRow[]
}

export function useOrders(storeId: string | null) {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    if (!storeId) {
      setOrders([])
      setLoading(false)
      return
    }
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
    setOrders([])
    setLoading(true)
    fetchOrders()

    async function handleInsert(payload: RealtimePostgresChangesPayload<OrderRow>) {
      const orderId = payload.new?.id
      if (!orderId) return

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', orderId)
          .single()

        if (error) throw error
        if (!data) return

        const order = data as OrderWithItems
        setOrders((prev) => {
          if (prev.some((item) => item.id === order.id)) return prev
          return [order, ...prev]
        })

        const tableLabel = `테이블 ${order.table_id ?? '-'}`
        toast.success(`새 주문이 들어왔습니다! (${tableLabel})`)
        notifyNewOrder(tableLabel, order.id)
      } catch (err) {
        console.error('useOrders INSERT handler:', err)
      }
    }

    function handleUpdate(payload: RealtimePostgresChangesPayload<OrderRow>) {
      try {
        const updated = payload.new as OrderRow
        if (!updated?.id) return

        setOrders((prev) =>
          prev.map((o) =>
            o.id === updated.id ? { ...o, ...updated } : o
          )
        )
        const tableLabel = `테이블 ${updated.table_id ?? '-'}`
        notifyOrderStatusChanged(tableLabel, updated.id, updated.status)
      } catch (err) {
        console.error('useOrders UPDATE handler:', err)
      }
    }

    const channel = supabase
      .channel(`orders:${storeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
        (payload) => {
          void handleInsert(payload as RealtimePostgresChangesPayload<OrderRow>)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
        (payload) => {
          try {
            handleUpdate(payload as RealtimePostgresChangesPayload<OrderRow>)
          } catch (err) {
            console.error('useOrders UPDATE callback:', err)
          }
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

  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      await apiDeleteOrder(orderId)
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
    } catch (err) {
      console.error('useOrders deleteOrder:', err)
      throw err
    }
  }, [])

  return { orders, loading, updateOrderStatus, deleteOrder, refetch: fetchOrders }
}

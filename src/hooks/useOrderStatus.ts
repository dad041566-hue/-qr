import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { OrderStatus } from '@/types/database'

export function useOrderStatus(orderId: string | null): { status: OrderStatus | null } {
  const [status, setStatus] = useState<OrderStatus | null>(null)

  useEffect(() => {
    if (!orderId) return

    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: OrderStatus }).status
          if (newStatus) setStatus(newStatus)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  return { status }
}

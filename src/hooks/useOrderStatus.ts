import { useState, useEffect } from 'react'
import { supabase as _supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any
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
        (payload: any) => {
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

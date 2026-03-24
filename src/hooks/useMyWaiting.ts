import { useEffect, useState } from 'react'
import { supabase as _supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any
import { getWaitingStatus } from '@/lib/api/waiting'
import type { WaitingStatus } from '@/types/database'

export interface MyWaitingState {
  status: WaitingStatus | null
  queueNumber: number | null
  myPosition: number
  totalWaiting: number
  loading: boolean
  error: string | null
}

export function useMyWaiting(
  storeId: string,
  waitingId: string,
  queueNumber: number,
) {
  const [state, setState] = useState<MyWaitingState>({
    status: 'waiting',
    queueNumber,
    myPosition: 0,
    totalWaiting: 0,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!storeId || !waitingId) return

    // Initial fetch
    getWaitingStatus(storeId, waitingId)
      .then(({ myPosition, totalWaiting }) => {
        setState((prev) => ({
          ...prev,
          myPosition,
          totalWaiting,
          loading: false,
        }))
      })
      .catch((e) => {
        setState((prev) => ({
          ...prev,
          error: e instanceof Error ? e.message : '오류 발생',
          loading: false,
        }))
      })

    // Realtime: subscribe to my waiting row
    const channel = supabase
      .channel(`my-waiting:${waitingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'waitings',
          filter: `id=eq.${waitingId}`,
        },
        (payload: any) => {
          const row = payload.new as {
            status: WaitingStatus
            queue_number: number
          }
          setState((prev) => ({ ...prev, status: row.status }))
        },
      )
      // Also track position changes via store-level inserts/updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'waitings',
          filter: `store_id=eq.${storeId}`,
        },
        () => {
          getWaitingStatus(storeId, waitingId)
            .then(({ myPosition, totalWaiting }) => {
              setState((prev) => ({ ...prev, myPosition, totalWaiting }))
            })
            .catch(() => {/* silent */})
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, waitingId])

  return state
}

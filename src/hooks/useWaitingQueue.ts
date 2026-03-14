import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { getWaitings } from '@/lib/api/waiting'
import type { WaitingRow } from '@/types/database'

export function useWaitingQueue(storeId: string) {
  const [waitings, setWaitings] = useState<WaitingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await getWaitings(storeId)
      setWaitings(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오기 실패')
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    if (!storeId) return
    refresh()

    const channel = supabase
      .channel(`waiting-queue:${storeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'waitings',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          const newRow = payload.new as WaitingRow
          setWaitings((prev) => {
            // avoid duplicates
            if (prev.some((w) => w.id === newRow.id)) return prev
            toast.success(
              `새 대기 등록: ${newRow.queue_number}번 (${newRow.party_size}명)`,
              { duration: 4000 },
            )
            return [...prev, newRow].sort(
              (a, b) => a.queue_number - b.queue_number,
            )
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'waitings',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          const updated = payload.new as WaitingRow
          setWaitings((prev) => {
            // Remove from list when status leaves 'waiting'
            if (updated.status !== 'waiting') {
              return prev.filter((w) => w.id !== updated.id)
            }
            return prev.map((w) => (w.id === updated.id ? updated : w))
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, refresh])

  return { waitings, loading, error, refresh }
}

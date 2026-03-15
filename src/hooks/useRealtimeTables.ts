import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { getTables, updateTableStatus as apiUpdateTableStatus } from '@/lib/api/admin'
import type { TableRow, TableStatus } from '@/types/database'

export function useRealtimeTables(storeId: string | null) {
  const [tables, setTables] = useState<TableRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTables = useCallback(async () => {
    if (!storeId) {
      setTables([])
      setLoading(false)
      return
    }
    try {
      const data = await getTables(storeId)
      setTables(data ?? [])
    } catch (err) {
      console.error('useRealtimeTables fetchTables:', err)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    if (!storeId) {
      setTables([])
      setLoading(false)
      return
    }
    fetchTables()

    const channel = supabase
      .channel(`tables:${storeId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tables', filter: `store_id=eq.${storeId}` },
        (payload) => {
          setTables((prev) =>
            prev.map((t) =>
              t.id === payload.new.id ? { ...t, ...(payload.new as TableRow) } : t
            )
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tables', filter: `store_id=eq.${storeId}` },
        (payload) => {
          setTables((prev) => [...prev, payload.new as TableRow].sort((a, b) => a.table_number - b.table_number))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, fetchTables])

  const updateTableStatus = useCallback(async (tableId: string, status: TableStatus) => {
    try {
      await apiUpdateTableStatus(tableId, status)
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status } : t))
      )
    } catch (err) {
      console.error('useRealtimeTables updateTableStatus:', err)
      toast.error('테이블 상태 변경에 실패했습니다.')
    }
  }, [])

  return { tables, loading, updateTableStatus, refetch: fetchTables }
}

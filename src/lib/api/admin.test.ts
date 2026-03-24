import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createQueryMock } from '@/test/mocks/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import {
  getOrders,
  updateOrderStatus,
  deleteOrder,
  getTables,
  updateTableStatus,
  addTable,
  getDailyRevenue,
} from './admin'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getOrders', () => {
  it('should fetch orders for a store', async () => {
    const mockOrders = [{ id: 'o1', store_id: 's1', order_items: [] }]
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: mockOrders, error: null }) as any,
    )

    const result = await getOrders('s1')
    expect(supabase.from).toHaveBeenCalledWith('orders')
    expect(result).toEqual(mockOrders)
  })

  it('should throw on error', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: { message: 'DB error' } }) as any,
    )

    await expect(getOrders('s1')).rejects.toEqual({ message: 'DB error' })
  })
})

describe('updateOrderStatus', () => {
  it('should update order status and return data', async () => {
    const updated = { id: 'o1', status: 'confirmed' }
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: updated, error: null }) as any,
    )

    const result = await updateOrderStatus('o1', 'confirmed')
    expect(supabase.from).toHaveBeenCalledWith('orders')
    expect(result).toEqual(updated)
  })

  it('should throw on error', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: { message: 'update failed' } }) as any,
    )

    await expect(updateOrderStatus('o1', 'confirmed')).rejects.toEqual({ message: 'update failed' })
  })
})

describe('deleteOrder', () => {
  it('should delete order without throwing', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: null }) as any,
    )

    await expect(deleteOrder('o1')).resolves.toBeUndefined()
  })

  it('should throw on error', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: { message: 'delete failed' } }) as any,
    )

    await expect(deleteOrder('o1')).rejects.toEqual({ message: 'delete failed' })
  })
})

describe('getTables', () => {
  it('should fetch tables for a store', async () => {
    const tables = [{ id: 't1', table_number: 1 }]
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: tables, error: null }) as any,
    )

    const result = await getTables('s1')
    expect(supabase.from).toHaveBeenCalledWith('tables')
    expect(result).toEqual(tables)
  })
})

describe('updateTableStatus', () => {
  it('should update table status', async () => {
    const updated = { id: 't1', status: 'occupied' }
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: updated, error: null }) as any,
    )

    const result = await updateTableStatus('t1', 'occupied')
    expect(result).toEqual(updated)
  })
})

describe('addTable', () => {
  it('should insert new table with qr_token', async () => {
    const newTable = { id: 't2', table_number: 6, qr_token: 'abc' }
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: newTable, error: null }) as any,
    )

    const result = await addTable('s1', 6)
    expect(supabase.from).toHaveBeenCalledWith('tables')
    expect(result).toEqual(newTable)
  })
})

describe('getDailyRevenue', () => {
  it('should aggregate revenue by date', async () => {
    const orders = [
      { created_at: '2026-03-20T10:00:00Z', total_price: 10000 },
      { created_at: '2026-03-20T12:00:00Z', total_price: 5000 },
      { created_at: '2026-03-21T09:00:00Z', total_price: 8000 },
    ]
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: orders, error: null }) as any,
    )

    const result = await getDailyRevenue('s1', 7)
    expect(result).toEqual([
      { date: '2026-03-20', amount: 15000 },
      { date: '2026-03-21', amount: 8000 },
    ])
  })

  it('should return empty array when no orders', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: [], error: null }) as any,
    )

    const result = await getDailyRevenue('s1', 7)
    expect(result).toEqual([])
  })

  it('should throw on DB error', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: { message: 'revenue error' } }) as any,
    )

    await expect(getDailyRevenue('s1', 7)).rejects.toEqual({ message: 'revenue error' })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createQueryMock } from '@/test/mocks/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { createOrder, getOrderStatus } from './order'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createOrder', () => {
  it('should call create_order_atomic RPC and return orderId', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: 'order-123',
      error: null,
    } as any)

    const result = await createOrder({
      storeId: 's1',
      tableId: 't1',
      items: [
        {
          menuItemId: 'm1',
          menuItemName: '김치찌개',
          unitPrice: 9000,
          quantity: 1,
          totalPrice: 9000,
          selectedOptions: [],
        },
      ],
    })

    expect(supabase.rpc).toHaveBeenCalledWith('create_order_atomic', expect.objectContaining({
      p_store_id: 's1',
      p_table_id: 't1',
    }))
    expect(result).toEqual({ orderId: 'order-123' })
  })

  it('should throw when RPC returns error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'RPC failed' },
    } as any)

    await expect(createOrder({
      storeId: 's1',
      tableId: 't1',
      items: [],
    })).rejects.toThrow('주문 생성 실패: RPC failed')
  })

  it('should throw when RPC returns null data', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: null,
    } as any)

    await expect(createOrder({
      storeId: 's1',
      tableId: 't1',
      items: [],
    })).rejects.toThrow('주문 생성 실패')
  })

  it('should map selectedOptions to null when empty', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: 'order-456',
      error: null,
    } as any)

    await createOrder({
      storeId: 's1',
      tableId: 't1',
      items: [{
        menuItemId: 'm1',
        menuItemName: '비빔밥',
        unitPrice: 10000,
        quantity: 2,
        totalPrice: 20000,
        selectedOptions: [],
      }],
    })

    const callArgs = vi.mocked(supabase.rpc).mock.calls[0][1] as any
    expect(callArgs.p_items[0].selected_options).toBeNull()
  })
})

describe('getOrderStatus', () => {
  it('should return order data', async () => {
    const order = { id: 'o1', status: 'pending' }
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: order, error: null }) as any,
    )

    const result = await getOrderStatus('o1')
    expect(result).toEqual(order)
  })

  it('should throw with descriptive message on error', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: { message: 'not found' } }) as any,
    )

    await expect(getOrderStatus('o1')).rejects.toThrow('주문 상태 조회 실패: not found')
  })
})

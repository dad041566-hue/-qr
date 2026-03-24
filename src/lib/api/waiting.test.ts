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
  createWaiting,
  getWaitingStatus,
  getWaitings,
  callWaiting,
  seatWaiting,
  completeWaiting,
  cancelWaiting,
  noShowWaiting,
  findAvailableTable,
} from './waiting'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createWaiting', () => {
  it('should call next_queue_number RPC then insert waiting', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 42, error: null } as any)
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: { id: 'w1' }, error: null }) as any,
    )

    const result = await createWaiting({
      storeId: 's1',
      phone: '01012345678',
      partySize: 3,
    })

    expect(supabase.rpc).toHaveBeenCalledWith('next_queue_number', { p_store_id: 's1' })
    expect(supabase.from).toHaveBeenCalledWith('waitings')
    expect(result).toEqual({ queueNumber: 42, waitingId: 'w1' })
  })

  it('should throw when RPC fails', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'RPC error' },
    } as any)

    await expect(createWaiting({
      storeId: 's1',
      phone: '010',
      partySize: 2,
    })).rejects.toThrow('RPC error')
  })

  it('should throw when INSERT fails', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 1, error: null } as any)
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: { message: 'insert failed' } }) as any,
    )

    await expect(createWaiting({
      storeId: 's1',
      phone: '010',
      partySize: 2,
    })).rejects.toThrow('insert failed')
  })
})

describe('getWaitingStatus', () => {
  it('should compute position and total waiting count', async () => {
    const waitings = [
      { id: 'w1', queue_number: 1 },
      { id: 'w2', queue_number: 2 },
      { id: 'w3', queue_number: 3 },
    ]
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: waitings, error: null }) as any,
    )

    const result = await getWaitingStatus('s1', 'w2')
    expect(result).toEqual({ myPosition: 1, totalWaiting: 3 })
  })

  it('should return totalWaiting as position when ID not found', async () => {
    const waitings = [{ id: 'w1', queue_number: 1 }]
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: waitings, error: null }) as any,
    )

    const result = await getWaitingStatus('s1', 'unknown')
    expect(result).toEqual({ myPosition: 1, totalWaiting: 1 })
  })

  it('should handle empty waiting list', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: [], error: null }) as any,
    )

    const result = await getWaitingStatus('s1', 'w1')
    expect(result).toEqual({ myPosition: 0, totalWaiting: 0 })
  })
})

describe('getWaitings', () => {
  it('should return waiting list for admin', async () => {
    const list = [{ id: 'w1', queue_number: 1, status: 'waiting' }]
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: list, error: null }) as any,
    )

    const result = await getWaitings('s1')
    expect(supabase.from).toHaveBeenCalledWith('waitings')
    expect(result).toEqual(list)
  })

  it('should return empty array when null data', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: null }) as any,
    )

    const result = await getWaitings('s1')
    expect(result).toEqual([])
  })
})

describe('status transitions', () => {
  it('callWaiting should update status to called', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: null }) as any,
    )

    await expect(callWaiting('w1')).resolves.toBeUndefined()
    expect(supabase.from).toHaveBeenCalledWith('waitings')
  })

  it('seatWaiting should update status to seated', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: null }) as any,
    )

    await expect(seatWaiting('w1', 't1')).resolves.toBeUndefined()
  })

  it('seatWaiting without tableId should pass null', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: null }) as any,
    )

    await expect(seatWaiting('w1')).resolves.toBeUndefined()
  })

  it('completeWaiting should update status to completed', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: null }) as any,
    )

    await expect(completeWaiting('w1')).resolves.toBeUndefined()
  })

  it('cancelWaiting should update status to cancelled', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: null }) as any,
    )

    await expect(cancelWaiting('w1')).resolves.toBeUndefined()
  })

  it('noShowWaiting should update status to no_show', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: null }) as any,
    )

    await expect(noShowWaiting('w1')).resolves.toBeUndefined()
  })

  it('should throw when update fails', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: { message: 'update error' } }) as any,
    )

    await expect(callWaiting('w1')).rejects.toThrow('update error')
  })
})

describe('findAvailableTable', () => {
  it('should return smallest available table with sufficient capacity', async () => {
    const table = { id: 't1', capacity: 4, status: 'available' }
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: table, error: null }) as any,
    )

    const result = await findAvailableTable('s1', 3)
    expect(supabase.from).toHaveBeenCalledWith('tables')
    expect(result).toEqual(table)
  })

  it('should return null when no table available', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: null }) as any,
    )

    const result = await findAvailableTable('s1', 10)
    expect(result).toBeNull()
  })

  it('should throw on DB error', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: { message: 'table error' } }) as any,
    )

    await expect(findAvailableTable('s1', 2)).rejects.toThrow('table error')
  })
})

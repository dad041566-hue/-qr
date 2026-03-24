import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createQueryMock } from '@/test/mocks/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('@/lib/utils/subscription', () => ({
  isStoreSubscriptionActive: vi.fn(),
}))

import { supabase } from '@/lib/supabase'
import { isStoreSubscriptionActive } from '@/lib/utils/subscription'
import { checkStoreActive } from './subscription'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('checkStoreActive', () => {
  it('should return true when store is active with valid subscription', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({
        data: { is_active: true, subscription_end: '2099-12-31' },
        error: null,
      }) as any,
    )
    vi.mocked(isStoreSubscriptionActive).mockReturnValue(true)

    const result = await checkStoreActive('s1')
    expect(result).toBe(true)
    expect(isStoreSubscriptionActive).toHaveBeenCalledWith({
      is_active: true,
      subscription_end: '2099-12-31',
    })
  })

  it('should return false when store is inactive', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({
        data: { is_active: false, subscription_end: '2099-12-31' },
        error: null,
      }) as any,
    )
    vi.mocked(isStoreSubscriptionActive).mockReturnValue(false)

    const result = await checkStoreActive('s1')
    expect(result).toBe(false)
  })

  it('should return false when DB error occurs', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: { message: 'not found' } }) as any,
    )

    const result = await checkStoreActive('s1')
    expect(result).toBe(false)
  })

  it('should return false when data is null', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: null }) as any,
    )

    const result = await checkStoreActive('s1')
    expect(result).toBe(false)
  })
})

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
import {
  getStoreBySlug,
  getTableByToken,
  getMenuCategories,
  getMenuItems,
  getOptionGroups,
  getOptionChoices,
} from './menu'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getStoreBySlug', () => {
  it('should return store when active subscription', async () => {
    const store = { id: 's1', slug: 'test', is_active: true, subscription_end: '2099-12-31' }
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: store, error: null }) as any,
    )
    vi.mocked(isStoreSubscriptionActive).mockReturnValue(true)

    const result = await getStoreBySlug('test')
    expect(supabase.from).toHaveBeenCalledWith('stores')
    expect(result).toEqual(store)
  })

  it('should throw when store not found', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: { message: 'PGRST116' } }) as any,
    )

    await expect(getStoreBySlug('missing')).rejects.toThrow('매장을 찾을 수 없습니다')
  })

  it('should throw when subscription inactive', async () => {
    const store = { id: 's1', is_active: false }
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: store, error: null }) as any,
    )
    vi.mocked(isStoreSubscriptionActive).mockReturnValue(false)

    await expect(getStoreBySlug('expired')).rejects.toThrow('현재 서비스를 이용할 수 없습니다')
  })
})

describe('getTableByToken', () => {
  it('should return table by qr_token', async () => {
    const table = { id: 't1', qr_token: 'abc', table_number: 1 }
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: table, error: null }) as any,
    )

    const result = await getTableByToken('s1', 'abc')
    expect(supabase.from).toHaveBeenCalledWith('tables')
    expect(result).toEqual(table)
  })

  it('should throw when table not found', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: { message: 'not found' } }) as any,
    )

    await expect(getTableByToken('s1', 'bad')).rejects.toThrow('테이블을 찾을 수 없습니다')
  })
})

describe('getMenuCategories', () => {
  it('should return categories sorted by sort_order', async () => {
    const cats = [{ id: 'c1', name: '메인', sort_order: 1 }]
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: cats, error: null }) as any,
    )

    const result = await getMenuCategories('s1')
    expect(supabase.from).toHaveBeenCalledWith('menu_categories')
    expect(result).toEqual(cats)
  })

  it('should return empty array when no categories', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: null }) as any,
    )

    const result = await getMenuCategories('s1')
    expect(result).toEqual([])
  })

  it('should throw on error', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: { message: 'db error' } }) as any,
    )

    await expect(getMenuCategories('s1')).rejects.toThrow('카테고리를 불러오지 못했습니다')
  })
})

describe('getMenuItems', () => {
  it('should return available, non-deleted items', async () => {
    const items = [{ id: 'm1', name: '김치찌개', price: 9000 }]
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: items, error: null }) as any,
    )

    const result = await getMenuItems('s1')
    expect(supabase.from).toHaveBeenCalledWith('menu_items')
    expect(result).toEqual(items)
  })

  it('should return empty array when no items', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: null }) as any,
    )

    const result = await getMenuItems('s1')
    expect(result).toEqual([])
  })
})

describe('getOptionGroups', () => {
  it('should return option groups for a menu item', async () => {
    const groups = [{ id: 'g1', name: '맵기', sort_order: 1 }]
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: groups, error: null }) as any,
    )

    const result = await getOptionGroups('m1')
    expect(supabase.from).toHaveBeenCalledWith('option_groups')
    expect(result).toEqual(groups)
  })
})

describe('getOptionChoices', () => {
  it('should return option choices for a group', async () => {
    const choices = [{ id: 'ch1', name: '순한맛', extra_price: 0 }]
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: choices, error: null }) as any,
    )

    const result = await getOptionChoices('g1')
    expect(supabase.from).toHaveBeenCalledWith('option_choices')
    expect(result).toEqual(choices)
  })
})

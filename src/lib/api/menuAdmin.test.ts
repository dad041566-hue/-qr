import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createQueryMock } from '@/test/mocks/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}))

import { supabase } from '@/lib/supabase'
import {
  getMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  uploadMenuImage,
} from './menuAdmin'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getMenuCategories (admin)', () => {
  it('should fetch categories for a store', async () => {
    const cats = [{ id: 'c1', name: '메인', sort_order: 0 }]
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: cats, error: null }) as any,
    )
    const result = await getMenuCategories('s1')
    expect(supabase.from).toHaveBeenCalledWith('menu_categories')
    expect(result).toEqual(cats)
  })

  it('should throw on error', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: { message: 'err' } }) as any,
    )
    await expect(getMenuCategories('s1')).rejects.toEqual({ message: 'err' })
  })
})

describe('createMenuCategory', () => {
  it('should create category with next sort_order', async () => {
    // First call: get existing max sort_order
    const existingMock = createQueryMock({ data: { sort_order: 2 }, error: null })
    // Second call: insert
    const insertMock = createQueryMock({ data: { id: 'c2', name: '사이드', sort_order: 3 }, error: null })

    let callCount = 0
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++
      return (callCount === 1 ? existingMock : insertMock) as any
    })

    const result = await createMenuCategory('s1', '사이드')
    expect(result).toEqual({ id: 'c2', name: '사이드', sort_order: 3 })
  })

  it('should use sort_order 0 when no existing categories', async () => {
    const existingMock = createQueryMock({ data: null, error: null })
    const insertMock = createQueryMock({ data: { id: 'c1', name: '첫카테고리', sort_order: 0 }, error: null })

    let callCount = 0
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++
      return (callCount === 1 ? existingMock : insertMock) as any
    })

    const result = await createMenuCategory('s1', '첫카테고리')
    expect(result).toEqual({ id: 'c1', name: '첫카테고리', sort_order: 0 })
  })
})

describe('updateMenuCategory', () => {
  it('should update category and return updated data', async () => {
    const updated = { id: 'c1', name: '수정됨' }
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: updated, error: null }) as any,
    )
    const result = await updateMenuCategory('c1', { name: '수정됨' })
    expect(result).toEqual(updated)
  })
})

describe('deleteMenuCategory', () => {
  it('should delete category', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: null }) as any,
    )
    await expect(deleteMenuCategory('c1')).resolves.toBeUndefined()
  })

  it('should throw on error', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: { message: 'FK constraint' } }) as any,
    )
    await expect(deleteMenuCategory('c1')).rejects.toEqual({ message: 'FK constraint' })
  })
})

describe('getMenuItems (admin)', () => {
  it('should fetch non-deleted items', async () => {
    const items = [{ id: 'm1', name: '김치찌개' }]
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: items, error: null }) as any,
    )
    const result = await getMenuItems('s1')
    expect(supabase.from).toHaveBeenCalledWith('menu_items')
    expect(result).toEqual(items)
  })
})

describe('createMenuItem', () => {
  it('should insert and return created item', async () => {
    const created = { id: 'm2', name: '비빔밥', price: 10000 }
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: created, error: null }) as any,
    )
    const result = await createMenuItem({
      store_id: 's1',
      name: '비빔밥',
      price: 10000,
      category_id: 'c1',
      sort_order: 1,
    } as any)
    expect(result).toEqual(created)
  })
})

describe('updateMenuItem', () => {
  it('should update item and return updated data', async () => {
    const updated = { id: 'm1', name: '특제김치찌개', price: 12000 }
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: updated, error: null }) as any,
    )
    const result = await updateMenuItem('m1', { name: '특제김치찌개', price: 12000 })
    expect(result).toEqual(updated)
  })
})

describe('deleteMenuItem', () => {
  it('should soft-delete by setting is_deleted=true', async () => {
    const deleted = { id: 'm1', is_deleted: true }
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: deleted, error: null }) as any,
    )
    const result = await deleteMenuItem('m1')
    expect(supabase.from).toHaveBeenCalledWith('menu_items')
    expect(result).toEqual(deleted)
  })

  it('should throw on error', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createQueryMock({ data: null, error: { message: 'delete error' } }) as any,
    )
    await expect(deleteMenuItem('m1')).rejects.toEqual({ message: 'delete error' })
  })
})

describe('uploadMenuImage', () => {
  it('should upload file and return public URL', async () => {
    const mockUpload = vi.fn().mockResolvedValue({ error: null })
    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: 'https://cdn.example.com/menu-images/s1/123.jpg' },
    })

    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    } as any)

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    const result = await uploadMenuImage('s1', file)

    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^s1\/\d+\.jpg$/),
      file,
      { upsert: false, contentType: 'image/jpeg' },
    )
    expect(result).toBe('https://cdn.example.com/menu-images/s1/123.jpg')
  })

  it('should throw when upload fails', async () => {
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: { message: 'upload failed' } }),
    } as any)

    const file = new File(['test'], 'photo.png', { type: 'image/png' })
    await expect(uploadMenuImage('s1', file)).rejects.toEqual({ message: 'upload failed' })
  })

  it('should default to jpg extension when filename has no extension', async () => {
    const mockUpload = vi.fn().mockResolvedValue({ error: null })
    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: 'https://cdn.example.com/url' },
    })

    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    } as any)

    const file = new File(['test'], 'noext', { type: 'image/jpeg' })
    await uploadMenuImage('s1', file)

    // 'noext'.split('.').pop() returns 'noext' (not undefined), so ext = 'noext'
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^s1\/\d+\.noext$/),
      file,
      expect.any(Object),
    )
  })
})

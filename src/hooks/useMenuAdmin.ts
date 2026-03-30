import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  getMenuItems,
  getMenuCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  uploadMenuImage,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  type MenuItemInput,
} from '@/lib/api/menuAdmin'
import type { MenuItemRow, MenuCategoryRow, MenuItemUpdate } from '@/types/database'

export function useMenuAdmin(storeId: string | null) {
  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([])
  const [categories, setCategories] = useState<MenuCategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [imageUploading, setImageUploading] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!storeId) return
    try {
      const [items, cats] = await Promise.all([
        getMenuItems(storeId),
        getMenuCategories(storeId),
      ])
      setMenuItems(items ?? [])
      setCategories(cats ?? [])
    } catch (err) {
      console.error('useMenuAdmin fetchAll:', err)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const addMenuItem = useCallback(async (data: MenuItemInput) => {
    try {
      const created = await createMenuItem(data)
      setMenuItems((prev) => [created, ...prev])
      toast.success('새 메뉴가 등록되었습니다.')
      return created
    } catch (err) {
      console.error('useMenuAdmin addMenuItem:', err)
      toast.error('메뉴 등록에 실패했습니다.')
      throw err
    }
  }, [])

  const editMenuItem = useCallback(async (id: string, data: MenuItemUpdate) => {
    try {
      const updated = await updateMenuItem(id, data)
      setMenuItems((prev) => prev.map((m) => (m.id === id ? updated : m)))
      toast.success('메뉴가 수정되었습니다.')
      return updated
    } catch (err) {
      console.error('useMenuAdmin editMenuItem:', err)
      toast.error('메뉴 수정에 실패했습니다.')
      throw err
    }
  }, [])

  const removeMenuItem = useCallback(async (id: string) => {
    try {
      await deleteMenuItem(id)
      setMenuItems((prev) => prev.filter((m) => m.id !== id))
      toast.success('메뉴가 삭제되었습니다.')
    } catch (err) {
      console.error('useMenuAdmin removeMenuItem:', err)
      toast.error('메뉴 삭제에 실패했습니다.')
      throw err
    }
  }, [])

  const toggleAvailability = useCallback(async (id: string, currentValue: boolean) => {
    try {
      const updated = await updateMenuItem(id, { is_available: !currentValue })
      setMenuItems((prev) => prev.map((m) => (m.id === id ? updated : m)))
      toast.info('메뉴 판매 상태가 변경되었습니다.')
    } catch (err) {
      console.error('useMenuAdmin toggleAvailability:', err)
      toast.error('상태 변경에 실패했습니다.')
    }
  }, [])

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    if (!storeId) throw new Error('storeId is required')
    setImageUploading(true)
    try {
      const url = await uploadMenuImage(storeId, file)
      return url
    } catch (err) {
      console.error('useMenuAdmin uploadImage:', err)
      toast.error('이미지 업로드에 실패했습니다.')
      throw err
    } finally {
      setImageUploading(false)
    }
  }, [storeId])

  const addCategory = useCallback(async (name: string) => {
    if (!storeId) throw new Error('storeId is required')
    try {
      const created = await createMenuCategory(storeId, name)
      setCategories((prev) => [...prev, created])
      toast.success('카테고리가 추가되었습니다.')
      return created
    } catch (err) {
      console.error('useMenuAdmin addCategory:', err)
      toast.error('카테고리 추가에 실패했습니다.')
      throw err
    }
  }, [storeId])

  const removeCategory = useCallback(async (id: string) => {
    try {
      await deleteMenuCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      toast.success('카테고리가 삭제되었습니다.')
    } catch (err) {
      console.error('useMenuAdmin removeCategory:', err)
      toast.error('카테고리 삭제에 실패했습니다.')
      throw err
    }
  }, [])

  const updateCategoryName = useCallback(async (id: string, name: string) => {
    try {
      const updated = await updateMenuCategory(id, { name })
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)))
      toast.success('카테고리 이름이 변경되었습니다.')
      return updated
    } catch (err) {
      console.error('useMenuAdmin updateCategoryName:', err)
      toast.error('카테고리 수정에 실패했습니다.')
      throw err
    }
  }, [])

  const reorderCategories = useCallback(async (orderedIds: string[]) => {
    try {
      await Promise.all(
        orderedIds.map((id, index) => updateMenuCategory(id, { sort_order: index }))
      )
      setCategories((prev) => {
        const map = new Map(prev.map((c) => [c.id, c]))
        return orderedIds
          .map((id, index) => {
            const cat = map.get(id)
            return cat ? { ...cat, sort_order: index } : undefined
          })
          .filter((c): c is MenuCategoryRow => c !== undefined)
      })
      toast.success('카테고리 순서가 변경되었습니다.')
    } catch (err) {
      console.error('useMenuAdmin reorderCategories:', err)
      toast.error('순서 변경에 실패했습니다.')
      throw err
    }
  }, [])

  return {
    menuItems,
    categories,
    loading,
    imageUploading,
    addMenuItem,
    editMenuItem,
    removeMenuItem,
    toggleAvailability,
    uploadImage,
    addCategory,
    removeCategory,
    updateCategoryName,
    reorderCategories,
    refetch: fetchAll,
  }
}

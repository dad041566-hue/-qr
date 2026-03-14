import { supabase } from '@/lib/supabase'
import type { MenuCategoryUpdate, MenuItemInsert, MenuItemUpdate } from '@/types/database'

// ============================================================
// Menu Categories
// ============================================================

export async function getMenuCategories(storeId: string) {
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('store_id', storeId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

export async function createMenuCategory(storeId: string, name: string) {
  const { data: existing } = await supabase
    .from('menu_categories')
    .select('sort_order')
    .eq('store_id', storeId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = existing ? existing.sort_order + 1 : 0

  const { data, error } = await supabase
    .from('menu_categories')
    .insert({ store_id: storeId, name, sort_order: nextOrder })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMenuCategory(id: string, data: MenuCategoryUpdate) {
  const { data: updated, error } = await supabase
    .from('menu_categories')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return updated
}

export async function deleteMenuCategory(id: string) {
  const { error } = await supabase
    .from('menu_categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================================
// Menu Items
// ============================================================

export async function getMenuItems(storeId: string) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_deleted', false)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

export type MenuItemInput = Omit<MenuItemInsert, 'store_id'> & { store_id: string }

export async function createMenuItem(data: MenuItemInput) {
  const { data: created, error } = await supabase
    .from('menu_items')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return created
}

export async function updateMenuItem(id: string, data: MenuItemUpdate) {
  const { data: updated, error } = await supabase
    .from('menu_items')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return updated
}

export async function deleteMenuItem(id: string) {
  const { data, error } = await supabase
    .from('menu_items')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================
// Image Upload
// ============================================================

export async function uploadMenuImage(storeId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${storeId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('menu-images')
    .upload(path, file, { upsert: false, contentType: file.type })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('menu-images').getPublicUrl(path)
  return data.publicUrl
}

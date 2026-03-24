import { supabase as _supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any
import { isStoreSubscriptionActive } from '@/lib/utils/subscription'
import type {
  StoreRow,
  TableRow,
  MenuCategoryRow,
  MenuItemRow,
  OptionGroupRow,
  OptionChoiceRow,
} from '@/types/database'

export async function getStoreBySlug(slug: string): Promise<StoreRow> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) throw new Error(`매장을 찾을 수 없습니다: ${error.message}`)

  if (!isStoreSubscriptionActive(data)) {
    throw new Error('현재 서비스를 이용할 수 없습니다.')
  }

  return data
}

export async function getTableByToken(
  storeId: string,
  qrToken: string
): Promise<TableRow> {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('store_id', storeId)
    .eq('qr_token', qrToken)
    .single()

  if (error) throw new Error(`테이블을 찾을 수 없습니다: ${error.message}`)
  return data
}

export async function getMenuCategories(storeId: string): Promise<MenuCategoryRow[]> {
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('store_id', storeId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`카테고리를 불러오지 못했습니다: ${error.message}`)
  return data ?? []
}

export async function getMenuItems(storeId: string): Promise<MenuItemRow[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_available', true)
    .eq('is_deleted', false)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`메뉴를 불러오지 못했습니다: ${error.message}`)
  return data ?? []
}

export async function getOptionGroups(menuItemId: string): Promise<OptionGroupRow[]> {
  const { data, error } = await supabase
    .from('option_groups')
    .select('*')
    .eq('menu_item_id', menuItemId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`옵션 그룹을 불러오지 못했습니다: ${error.message}`)
  return data ?? []
}

export async function getOptionChoices(optionGroupId: string): Promise<OptionChoiceRow[]> {
  const { data, error } = await supabase
    .from('option_choices')
    .select('*')
    .eq('option_group_id', optionGroupId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`옵션 선택지를 불러오지 못했습니다: ${error.message}`)
  return data ?? []
}

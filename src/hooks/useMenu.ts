import { useState, useEffect } from 'react'
import type { StoreRow, TableRow, MenuCategoryRow } from '@/types/database'
import {
  getStoreBySlug,
  getTableByToken,
  getMenuCategories,
  getMenuItems,
  getOptionGroups,
  getOptionChoices,
} from '@/lib/api/menu'

// Internal MenuItem shape expected by CustomerMenu UI
export type MenuItem = {
  id: string
  name: string
  price: number
  category: string
  desc: string
  image: string
  badge: string
  options?: {
    name: string
    choices: { name: string; price: number }[]
    required: boolean
  }[]
}

function badgeLabel(badge: string | null): string {
  if (badge === 'best') return 'BEST'
  if (badge === 'recommended') return '추천'
  return ''
}

interface UseMenuResult {
  store: StoreRow | null
  table: TableRow | null
  categories: MenuCategoryRow[]
  items: MenuItem[]
  loading: boolean
  error: string | null
}

export function useMenu(
  storeSlug: string | undefined,
  qrToken: string | undefined
): UseMenuResult {
  const [store, setStore] = useState<StoreRow | null>(null)
  const [table, setTable] = useState<TableRow | null>(null)
  const [categories, setCategories] = useState<MenuCategoryRow[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!storeSlug || !qrToken) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const storeData = await getStoreBySlug(storeSlug!)
        if (cancelled) return
        setStore(storeData)

        const [tableData, categoriesData, itemsData] = await Promise.all([
          getTableByToken(storeData.id, qrToken!),
          getMenuCategories(storeData.id),
          getMenuItems(storeData.id),
        ])
        if (cancelled) return
        setTable(tableData)
        setCategories(categoriesData)

        // Build a category id→name map
        const catMap = new Map<string, string>(
          categoriesData.map((c) => [c.id, c.name])
        )

        // Load option groups + choices for all items in parallel
        const menuItems: MenuItem[] = await Promise.all(
          itemsData.map(async (row) => {
            const groups = await getOptionGroups(row.id)
            const options = await Promise.all(
              groups.map(async (group) => {
                const choices = await getOptionChoices(group.id)
                return {
                  name: group.name,
                  required: group.is_required,
                  choices: choices.map((c) => ({
                    name: c.name,
                    price: c.extra_price,
                  })),
                }
              })
            )
            return {
              id: row.id,
              name: row.name,
              price: row.price,
              category: catMap.get(row.category_id) ?? '',
              desc: row.description ?? '',
              image: row.image_url ?? '',
              badge: badgeLabel(row.badge),
              options: options.length > 0 ? options : undefined,
            }
          })
        )

        if (cancelled) return
        setItems(menuItems)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '데이터를 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [storeSlug, qrToken])

  return { store, table, categories, items, loading, error }
}

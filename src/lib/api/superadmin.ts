import { supabase } from '@/lib/supabase'
import type { StoreRow } from '@/types/database'

// ============================================================
// Stores
// ============================================================

export async function getAllStores(): Promise<StoreRow[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as StoreRow[]
}

export async function createStore(params: {
  name: string
  slug: string
  address?: string
  phone?: string
}): Promise<StoreRow> {
  const { data, error } = await supabase
    .from('stores')
    .insert({
      owner_id: '00000000-0000-0000-0000-000000000000', // placeholder; real owner set after account creation
      name: params.name,
      slug: params.slug,
      address: params.address ?? null,
      phone: params.phone ?? null,
    } as any)
    .select()
    .single()

  if (error) throw error
  return data as StoreRow
}

export async function updateStoreSubscription(
  storeId: string,
  params: {
    subscription_start: string
    subscription_end: string
    is_active: boolean
  },
): Promise<void> {
  const { error } = await supabase
    .from('stores')
    .update(params as any)
    .eq('id', storeId)

  if (error) throw error
}

// ============================================================
// Owner account
// ============================================================

export async function createOwnerAccount(params: {
  email: string
  password: string
  storeId: string
}): Promise<void> {
  // Create the Supabase Auth user via admin API
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
  })

  if (authError) throw authError
  if (!authData.user) throw new Error('사용자 생성에 실패했습니다.')

  const userId = authData.user.id

  // Update the store's owner_id
  const { error: storeError } = await supabase
    .from('stores')
    .update({ owner_id: userId } as any)
    .eq('id', params.storeId)

  if (storeError) throw storeError

  // Link to store_members as owner
  const { error: memberError } = await supabase
    .from('store_members')
    .insert({
      store_id: params.storeId,
      user_id: userId,
      role: 'owner',
    })

  if (memberError) throw memberError
}

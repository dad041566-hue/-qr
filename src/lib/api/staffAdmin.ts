import { supabase } from '@/lib/supabase'
import type { MemberRole, StoreMemberRow } from '@/types/database'

// ============================================================
// Create staff member via Edge Function
// ============================================================

export async function createStaffMember(
  storeId: string,
  email: string,
  password: string,
  name: string,
  role: 'manager' | 'staff',
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('인증 세션이 없습니다.')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
  const res = await fetch(`${supabaseUrl}/functions/v1/create-staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: anonKey,
    },
    body: JSON.stringify({ storeId, email, password, name, role }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? '직원 생성에 실패했습니다.')
}

// ============================================================
// Get staff members
// ============================================================

export async function getStaffMembers(storeId: string): Promise<StoreMemberRow[]> {
  const { data, error } = await supabase
    .from('store_members')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

// ============================================================
// Deactivate (delete) staff member
// ============================================================

export async function deactivateStaffMember(memberId: string, storeId: string): Promise<void> {
  const { error } = await supabase
    .from('store_members')
    .delete()
    .eq('id', memberId)
    .eq('store_id', storeId)

  if (error) throw error
}

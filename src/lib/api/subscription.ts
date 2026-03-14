import { supabase } from '@/lib/supabase'
import { isStoreSubscriptionActive } from '@/lib/utils/subscription'

/**
 * 매장의 이용 기간이 유효한지 확인
 * - is_active = false → 강제 정지
 * - subscription_end가 오늘보다 이전 → 만료
 * - subscription_end가 null → 무제한 (유효)
 */
export async function checkStoreActive(storeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('stores')
    .select('is_active, subscription_end')
    .eq('id', storeId)
    .single()

  if (error || !data) return false
  return isStoreSubscriptionActive(data)
}

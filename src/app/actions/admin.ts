'use server'

import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase 환경 변수가 누락되었습니다.')
  return createClient(url, key)
}

export async function addTableAction(storeId: string, tableNumber: number) {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('tables')
    .insert({
      store_id: storeId,
      table_number: tableNumber,
      qr_token: crypto.randomUUID(),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

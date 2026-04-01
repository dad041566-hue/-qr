'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase 환경 변수가 누락되었습니다.')
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${key}` } },
  })
}

export async function createWaitingAction(
  storeId: string,
  phone: string,
  partySize: number,
): Promise<{ queueNumber: number; waitingId: string }> {
  // 공개 페이지에서 호출되므로 service_role로 RLS 우회
  const sb = getServiceClient()

  const { data: queueNumber, error: rpcError } = await sb.rpc('next_queue_number', {
    p_store_id: storeId,
  })
  if (rpcError) throw new Error(rpcError.message)

  const { data, error } = await sb
    .from('waitings')
    .insert({
      store_id: storeId,
      queue_number: queueNumber as number,
      phone,
      party_size: partySize,
      status: 'waiting',
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return { queueNumber: queueNumber as number, waitingId: data.id as string }
}

export async function callWaitingAction(waitingId: string): Promise<void> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // 알림톡 발송을 위해 전화번호·대기번호·매장 정보 조회
  const { data: waiting } = await sb
    .from('waitings')
    .select('phone, queue_number, store_id')
    .eq('id', waitingId)
    .single()

  const { error } = await sb
    .from('waitings')
    .update({ status: 'called', called_at: new Date().toISOString() })
    .eq('id', waitingId)

  if (error) throw new Error(`호출 실패: ${error.message}`)

  // 알림톡 발송 (실패해도 호출 자체는 성공으로 처리)
  if (waiting?.phone) {
    const { data: store } = await sb
      .from('stores')
      .select('name')
      .eq('id', waiting.store_id)
      .single()

    supabase.functions.invoke('send-alimtalk', {
      body: {
        to: waiting.phone,
        type: 'WAITING_CALLED',
        queueNumber: waiting.queue_number,
        storeName: store?.name ?? '',
      },
    }).catch(() => {})
  }
}

export async function completeWaitingAction(waitingId: string): Promise<void> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { error } = await sb
    .from('waitings')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', waitingId)

  if (error) throw new Error(`착석 처리 실패: ${error.message}`)
}

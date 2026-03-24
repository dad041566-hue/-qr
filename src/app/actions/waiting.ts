'use server'

import { createClient } from '@/lib/supabase/server'

export async function createWaitingAction(
  storeId: string,
  phone: string,
  partySize: number,
): Promise<{ queueNumber: number; waitingId: string }> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

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

  const { error } = await sb
    .from('waitings')
    .update({
      status: 'called',
      called_at: new Date().toISOString(),
    })
    .eq('id', waitingId)

  if (error) throw new Error(`호출 실패: ${error.message}`)
}

export async function completeWaitingAction(waitingId: string): Promise<void> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { error } = await sb
    .from('waitings')
    .update({
      status: 'seated',
      seated_at: new Date().toISOString(),
    })
    .eq('id', waitingId)

  if (error) throw new Error(`착석 처리 실패: ${error.message}`)
}

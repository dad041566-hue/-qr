import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { isStoreSubscriptionActive } from '@/lib/utils/subscription'
import WaitingClient from './WaitingClient'
import type { StoreRow } from '@/types/database'

interface Props {
  params: Promise<{ storeSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug } = await params
  return {
    title: `대기 등록 — ${storeSlug}`,
  }
}

export default async function WaitingPage({ params }: Props) {
  const { storeSlug } = await params
  const supabase = await createClient()

  const { data: store, error } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', storeSlug)
    .single()

  if (error || !store) {
    notFound()
  }

  if (!isStoreSubscriptionActive(store as StoreRow)) {
    notFound()
  }

  return <WaitingClient store={store as StoreRow} />
}

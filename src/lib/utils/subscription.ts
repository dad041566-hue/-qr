export function getKstDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export interface StoreSubscriptionState {
  is_active: boolean
  subscription_end: string | null
}

export function isStoreSubscriptionActive(state: StoreSubscriptionState | null | undefined): boolean {
  if (!state) return false
  if (!state.is_active) return false
  if (!state.subscription_end) return true
  return state.subscription_end >= getKstDateString()
}


import type { OrderStatus } from '@/types/database'

const VALID_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  created:   ['confirmed', 'preparing', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready:     ['served', 'cancelled'],
  served:    [],
  cancelled: [],
} as const

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function getNextStatuses(current: OrderStatus): readonly OrderStatus[] {
  return VALID_TRANSITIONS[current] ?? []
}

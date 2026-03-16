import { supabase } from '@/lib/supabase'
import type { OrderRow, PaymentMethod, SelectedOption } from '@/types/database'

export interface OrderItemInput {
  menuItemId: string
  menuItemName: string
  unitPrice: number
  quantity: number
  totalPrice: number
  selectedOptions: SelectedOption[]
}

export async function createOrder(params: {
  storeId: string
  tableId: string
  items: OrderItemInput[]
  guestName?: string
  specialRequests?: string
  paymentMethod?: PaymentMethod
}): Promise<{ orderId: string }> {
  const { data, error } = await supabase.rpc('create_order_atomic', {
    p_store_id: params.storeId,
    p_table_id: params.tableId,
    p_items: params.items.map((item) => ({
      menu_item_id: item.menuItemId,
      menu_item_name: item.menuItemName,
      quantity: item.quantity,
      selected_options: item.selectedOptions.length > 0 ? item.selectedOptions : null,
    })),
    p_guest_name: params.guestName ?? null,
    p_special_requests: params.specialRequests ?? null,
    p_payment_method: params.paymentMethod ?? null,
  })

  if (error || !data) throw new Error(`주문 생성 실패: ${error?.message ?? '알 수 없는 오류'}`)

  return { orderId: data }
}

export async function getOrderStatus(orderId: string): Promise<OrderRow> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error) throw new Error(`주문 상태 조회 실패: ${error.message}`)
  return data
}

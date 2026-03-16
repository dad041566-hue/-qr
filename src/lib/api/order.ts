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
  const subtotal = params.items.reduce((sum, item) => sum + item.totalPrice, 0)
  const orderId = crypto.randomUUID()

  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      store_id: params.storeId,
      table_id: params.tableId,
      subtotal_price: subtotal,
      total_price: subtotal,
      guest_name: params.guestName ?? null,
      special_requests: params.specialRequests ?? null,
      payment_method: params.paymentMethod ?? null,
    })

  if (orderError) throw new Error(`주문 생성 실패: ${orderError.message}`)

  const orderItems = params.items.map((item) => ({
    store_id: params.storeId,
    order_id: orderId,
    menu_item_id: item.menuItemId,
    menu_item_name: item.menuItemName,
    unit_price: item.unitPrice,
    quantity: item.quantity,
    total_price: item.totalPrice,
    selected_options: item.selectedOptions.length > 0 ? item.selectedOptions : null,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
    throw new Error(`주문 아이템 저장 실패: ${itemsError.message}`)
  }

  return { orderId }
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

/**
 * useOrderNotification
 * - Web Notifications API: 탭이 백그라운드여도 브라우저 알림 표시
 * - Vibration API: 모바일 진동
 * - 권한 요청은 최초 1회 (사용자 인터랙션 필요)
 */

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    const result = await Notification.requestPermission()
    return result
  }
  return Notification.permission
}

export function notifyNewOrder(tableLabel: string, orderId?: string) {
  // 탭이 포커스된 경우 브라우저 알림 불필요 (toast로 충분)
  // 백그라운드이거나 다른 탭 활성화 시 브라우저 알림 표시
  if (document.visibilityState !== 'visible' || document.hidden) {
    showBrowserNotification(`새 주문 — ${tableLabel}`, '주문이 접수되었습니다. 확인해주세요.', orderId)
  }
  vibrate([200, 100, 200, 100, 400])
}

export function notifyOrderStatusChanged(tableLabel: string, orderId: string, status: string) {
  const statusLabel: Record<string, string> = {
    confirmed: '주문 확인됨',
    preparing: '조리 중',
    ready: '조리 완료',
    served: '서빙 완료',
    cancelled: '주문 취소',
  }
  const label = statusLabel[status] ?? status

  if (document.visibilityState !== 'visible' || document.hidden) {
    showBrowserNotification(`${label} — ${tableLabel}`, '주문 상태가 변경되었습니다.', orderId)
  }

  if (status === 'ready') {
    vibrate([400, 100, 400])
  }
}

function showBrowserNotification(title: string, body: string, orderId?: string) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const tag = orderId ? `order-alert-${orderId}` : 'order-alert'

  new Notification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag,        // 같은 주문ID는 덮어쓰기 방지, 다른 주문은 구분
    ...({ renotify: true } as any),
  })
}

function vibrate(pattern: number[]) {
  if (!('vibrate' in navigator)) return
  navigator.vibrate(pattern)
}

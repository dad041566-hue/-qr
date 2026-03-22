import { Bell, X } from 'lucide-react'

interface Props {
  onDismiss: () => void
}

export function NotificationDeniedBanner({ onDismiss }: Props) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
      <Bell className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-amber-800">
          알림이 차단되어 있습니다
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          브라우저 설정에서 알림을 허용하면 새 주문을 놓치지 않을 수 있습니다.
          주소창 왼쪽의 자물쇠 아이콘 &rarr; 알림 &rarr; 허용으로 변경해주세요.
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 p-1 rounded-lg hover:bg-amber-100 transition-colors"
        aria-label="알림 배너 닫기"
      >
        <X className="w-4 h-4 text-amber-600" />
      </button>
    </div>
  )
}

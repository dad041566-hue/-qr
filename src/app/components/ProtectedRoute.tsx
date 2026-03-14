import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { checkStoreActive } from '@/lib/api/subscription'
import type { UserRole } from '@/types/auth'

const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 3,
  manager: 2,
  staff: 1,
}

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, isFirstLogin, signOut } = useAuth()
  const location = useLocation()
  const [subscriptionChecking, setSubscriptionChecking] = useState(false)
  const [storeActive, setStoreActive] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user?.storeId) return

    setSubscriptionChecking(true)
    checkStoreActive(user.storeId)
      .then((active) => setStoreActive(active))
      .catch(() => setStoreActive(false))
      .finally(() => setSubscriptionChecking(false))
  }, [user?.storeId])

  if (loading || subscriptionChecking) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Redirect to change-password if first login and not already there
  if (isFirstLogin && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  if (storeActive === false) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-50 gap-3">
        <p className="text-zinc-700 font-semibold text-lg">이용 기간이 만료되었습니다.</p>
        <p className="text-zinc-400 text-sm">관리자에게 문의하세요.</p>
        <button
          onClick={signOut}
          className="mt-2 px-4 py-2 text-sm text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
        >
          로그아웃
        </button>
      </div>
    )
  }

  if (requiredRole && ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY[requiredRole]) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-50 gap-3">
        <p className="text-zinc-700 font-semibold text-lg">접근 권한이 없습니다.</p>
        <p className="text-zinc-400 text-sm">이 페이지는 {requiredRole} 이상 권한이 필요합니다.</p>
      </div>
    )
  }

  return <>{children}</>
}

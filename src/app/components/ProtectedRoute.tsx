import React from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
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
  const { user, loading, isFirstLogin } = useAuth()
  const location = useLocation()

  if (loading) {
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

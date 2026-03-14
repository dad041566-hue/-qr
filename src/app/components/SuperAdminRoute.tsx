import React from 'react'
import { Navigate } from 'react-router'
import { useAuthContext } from '@/contexts/AuthContext'

interface SuperAdminRouteProps {
  children: React.ReactNode
}

function getSuperAdminEmails(): string[] {
  const raw = import.meta.env.VITE_SUPERADMIN_EMAILS ?? ''
  return raw
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const allowed = getSuperAdminEmails()
  const isSuperAdmin = allowed.includes(user.email.toLowerCase())

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

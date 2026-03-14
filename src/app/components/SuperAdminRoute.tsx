import React from 'react'
import { Navigate } from 'react-router'
import { checkSuperAdmin } from '@/lib/api/superadmin'
import { useAuthContext } from '@/contexts/AuthContext'

interface SuperAdminRouteProps {
  children: React.ReactNode
}

export function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { user, loading } = useAuthContext()
  const [authorized, setAuthorized] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    if (!user) {
      setAuthorized(null)
      return
    }

    let active = true
    checkSuperAdmin()
      .then((allowed) => {
        if (!active) return
        setAuthorized(allowed)
      })
      .catch(() => {
        if (!active) return
        setAuthorized(false)
      })

    return () => {
      active = false
    }
  }, [user])

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

  if (authorized === null) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authorized) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

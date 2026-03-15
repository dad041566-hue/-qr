import React from 'react'
import { Navigate } from 'react-router'
import { supabase } from '@/lib/supabase'

interface SuperAdminRouteProps {
  children: React.ReactNode
}

export function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const [authorized, setAuthorized] = React.useState<boolean | null>(null)
  const [sessionChecked, setSessionChecked] = React.useState(false)
  const [hasSession, setHasSession] = React.useState(false)

  React.useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      if (!session) {
        setHasSession(false)
        setSessionChecked(true)
        return
      }
      setHasSession(true)
      const allowed = session.user.app_metadata?.role === 'super_admin'
      setAuthorized(allowed)
      setSessionChecked(true)
    })

    return () => { active = false }
  }, [])

  if (!sessionChecked) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!hasSession) {
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

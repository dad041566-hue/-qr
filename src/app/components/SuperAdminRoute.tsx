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

    // getUser() validates against the Supabase Auth server for security-sensitive
    // role checks (A07-003). getSession() reads from local storage and can be spoofed.
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (!active) return
      if (error || !user) {
        setHasSession(false)
        setSessionChecked(true)
        return
      }
      setHasSession(true)
      const allowed = user.app_metadata?.role === 'super_admin'
      setAuthorized(allowed)
      setSessionChecked(true)
    }).catch(() => {
      // getUser() can time out if the network is unavailable.
      // Treat as unauthenticated to avoid an infinite spinner.
      if (!active) return
      setHasSession(false)
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

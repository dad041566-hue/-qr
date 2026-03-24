import { useState, useEffect, useCallback } from 'react'
import { requestNotificationPermission } from '@/hooks/useOrderNotification'

export type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

export function useNotificationPermission() {
  const [permission, setPermission] = useState<PermissionState>(() => {
    if (typeof window === 'undefined') return 'default'
    if (!('Notification' in window)) return 'unsupported'
    return Notification.permission as PermissionState
  })

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return sessionStorage.getItem('notif-banner-dismissed') === 'true'
    } catch {
      return false
    }
  })

  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission()
    if (result) setPermission(result as PermissionState)
    return result
  }, [])

  const dismissBanner = useCallback(() => {
    setDismissed(true)
    try {
      sessionStorage.setItem('notif-banner-dismissed', 'true')
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('permissions' in navigator)) return
    let cleanup: (() => void) | undefined

    navigator.permissions.query({ name: 'notifications' as PermissionName }).then((status) => {
      const onChange = () => {
        setPermission(status.state === 'prompt' ? 'default' : status.state as PermissionState)
      }
      status.addEventListener('change', onChange)
      cleanup = () => status.removeEventListener('change', onChange)
    }).catch(() => {})

    return () => cleanup?.()
  }, [])

  return {
    permission,
    showBanner: permission === 'denied' && !dismissed,
    requestPermission,
    dismissBanner,
  }
}

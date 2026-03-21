import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { StoreUser } from '@/types/auth'

interface AuthContextValue {
  user: StoreUser | null
  loading: boolean
  isFirstLogin: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshStoreUser: () => Promise<(StoreUser & { isFirstLogin: boolean }) | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)
interface StoreUserWithFirstLogin extends StoreUser {
  isFirstLogin: boolean
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoreUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFirstLogin, setIsFirstLogin] = useState(false)

  const fetchStoreUser = useCallback(async (supabaseUserId: string, email: string): Promise<StoreUserWithFirstLogin | null> => {
    const { data, error } = await supabase
      .from('store_members')
      .select('role, store_id, is_first_login, stores(name)')
      .eq('user_id', supabaseUserId)
      .single()

    if (error || !data) return null

    const storeUserFirstLogin = data.is_first_login ?? false
    setIsFirstLogin(storeUserFirstLogin)

    return {
      id: supabaseUserId,
      email,
      isFirstLogin: storeUserFirstLogin,
      role: data.role,
      storeId: data.store_id,
      storeName:
        typeof data.stores === 'object' &&
        data.stores !== null &&
        !Array.isArray(data.stores) &&
        'name' in data.stores
          ? (data.stores as { name?: string }).name ?? ''
          : '',
    }
  }, [])

  const refreshStoreUser = useCallback(async () => {
    setLoading(true)
    // getUser() validates against the Supabase Auth server (not local storage),
    // making it safe for security-sensitive decisions (A07-003).
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const storeUser = await fetchStoreUser(user.id, user.email ?? '')
      setUser(storeUser)
      setLoading(false)
      return storeUser
    }
    setUser(null)
    setIsFirstLogin(false)
    setLoading(false)
    return null
  }, [fetchStoreUser])

  useEffect(() => {
    refreshStoreUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // USER_UPDATED and TOKEN_REFRESHED fire while the auth WebLock is held.
      // Calling supabase.from() here deadlocks (getSession → _acquireLock → pendingInLock).
      // store_members data doesn't change for these events, so skip the DB refetch.
      if (_event === 'USER_UPDATED' || _event === 'TOKEN_REFRESHED') {
        setLoading(false)
        return
      }
      if (session?.user) {
        const storeUser = await fetchStoreUser(session.user.id, session.user.email ?? '')
        setUser(storeUser)
      } else {
        setUser(null)
        setIsFirstLogin(false)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, isFirstLogin, signInWithEmail, signOut, refreshStoreUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { StoreUser } from '@/types/auth'

interface AuthContextValue {
  user: StoreUser | null
  loading: boolean
  isFirstLogin: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshStoreUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoreUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFirstLogin, setIsFirstLogin] = useState(false)

  const fetchStoreUser = useCallback(async (supabaseUserId: string, email: string): Promise<StoreUser | null> => {
    const { data, error } = await supabase
      .from('store_members')
      .select('role, store_id, is_first_login, stores(name)')
      .eq('user_id', supabaseUserId)
      .single()

    if (error || !data) return null

    setIsFirstLogin(data.is_first_login ?? false)

    return {
      id: supabaseUserId,
      email,
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
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const storeUser = await fetchStoreUser(session.user.id, session.user.email ?? '')
      setUser(storeUser)
      setLoading(false)
      return
    }
    setUser(null)
    setIsFirstLogin(false)
    setLoading(false)
  }, [fetchStoreUser])

  useEffect(() => {
    refreshStoreUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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

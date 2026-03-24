'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoreUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFirstLogin, setIsFirstLogin] = useState(false)
  const [supabase] = useState(() => createClient())

  const fetchStoreUser = useCallback(async (supabaseUserId: string, email: string): Promise<StoreUserWithFirstLogin | null> => {
    const { data, error } = await supabase
      .from('store_members')
      .select('role, store_id, is_first_login, stores(name)')
      .eq('user_id', supabaseUserId)
      .single()

    if (error || !data) return null

    const row = data as unknown as {
      role: string
      store_id: string
      is_first_login: boolean | null
      stores: { name?: string } | null
    }

    const storeUserFirstLogin = row.is_first_login ?? false
    setIsFirstLogin(storeUserFirstLogin)

    return {
      id: supabaseUserId,
      email,
      isFirstLogin: storeUserFirstLogin,
      role: row.role as StoreUser['role'],
      storeId: row.store_id,
      storeName: row.stores?.name ?? '',
    }
  }, [supabase])

  const refreshStoreUser = useCallback(async () => {
    setLoading(true)
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
  }, [supabase, fetchStoreUser])

  useEffect(() => {
    refreshStoreUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
  }, [supabase, refreshStoreUser, fetchStoreUser])

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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside NextAuthProvider')
  return ctx
}

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { StoreUser } from '@/types/auth'

interface AuthContextValue {
  user: StoreUser | null
  loading: boolean
  isFirstLogin: boolean
  signInWithKakao: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoreUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFirstLogin, setIsFirstLogin] = useState(false)

  async function fetchStoreUser(supabaseUserId: string, email: string): Promise<StoreUser | null> {
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
      storeName: (data.stores as any)?.name ?? '',
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const storeUser = await fetchStoreUser(session.user.id, session.user.email ?? '')
        setUser(storeUser)
      }
      setLoading(false)
    })

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

  async function signInWithKakao() {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${window.location.origin}/admin` },
    })
  }

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isFirstLogin, signInWithKakao, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}

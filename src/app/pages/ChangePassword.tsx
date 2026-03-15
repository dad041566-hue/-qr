import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { Lock, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const PASSWORD_REGEX = /^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/

export function ChangePassword() {
  const navigate = useNavigate()
  const { refreshStoreUser } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({})
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    const newErrors: typeof errors = {}
    if (!newPassword) newErrors.newPassword = '새 비밀번호를 입력하세요.'
    else if (!PASSWORD_REGEX.test(newPassword)) newErrors.newPassword = '8자 이상, 특수문자를 포함해야 합니다.'
    if (!confirmPassword) newErrors.confirmPassword = '비밀번호 확인을 입력하세요.'
    else if (confirmPassword !== newPassword) newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      // 1. Get user ID from cached session (no network call)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('세션이 없습니다.')

      // 2. Update is_first_login BEFORE password change (avoid hanging SDK)
      const { error: memberError } = await supabase
        .from('store_members')
        .update({ is_first_login: false })
        .eq('user_id', session.user.id)
      if (memberError) throw memberError

      // Refresh in-memory auth state so ProtectedRoute sees is_first_login = false
      await refreshStoreUser()

      // 3. Update password with timeout fallback (SDK may hang on session post-processing)
      await Promise.race([
        supabase.auth.updateUser({ password: newPassword }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ]).catch((err: Error) => { if (err.message !== 'timeout') throw err })

      toast.success('비밀번호가 변경되었습니다.')
      navigate('/admin', { replace: true })
    } catch (err: any) {
      toast.error(err?.message ?? '비밀번호 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <h1 className="text-lg font-semibold text-zinc-900 mb-1 text-center">비밀번호 변경</h1>
          <p className="text-sm text-zinc-500 text-center mb-6">
            첫 로그인입니다. 새 비밀번호를 설정해주세요.
          </p>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600" htmlFor="newPassword">
                새 비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="8자 이상, 특수문자 포함"
                  className="pl-9"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600" htmlFor="confirmPassword">
                비밀번호 확인
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호 재입력"
                  className="pl-9"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white mt-1"
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

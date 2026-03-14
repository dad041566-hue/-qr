import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { Utensils, Mail, Lock, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

interface EmailFormValues {
  email: string
  password: string
}

export function Login() {
  const navigate = useNavigate()
  const { signInWithEmail, isFirstLogin } = useAuth()
  const [emailLoading, setEmailLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<EmailFormValues>()

  async function handleEmail(values: EmailFormValues) {
    setEmailLoading(true)
    try {
      await signInWithEmail(values.email, values.password)
      if (isFirstLogin) {
        navigate('/change-password', { replace: true })
      } else {
        navigate('/admin', { replace: true })
      }
    } catch (err: any) {
      toast.error(err?.message ?? '로그인에 실패했습니다.')
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-zinc-900">TableFlow</span>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <h1 className="text-lg font-semibold text-zinc-900 mb-5 text-center">로그인</h1>

          <form onSubmit={handleSubmit(handleEmail)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600" htmlFor="email">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="staff@example.com"
                  className="pl-9"
                  aria-invalid={!!errors.email}
                  {...register('email', { required: '이메일을 입력하세요.' })}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600" htmlFor="password">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호"
                  className="pl-9"
                  aria-invalid={!!errors.password}
                  {...register('password', { required: '비밀번호를 입력하세요.' })}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={emailLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white mt-1"
            >
              <LogIn className="w-4 h-4" />
              {emailLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          &copy; {new Date().getFullYear()} TableFlow. All rights reserved.
        </p>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Copy, Check, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog'

interface FormValues {
  name: string
  email: string
  role: 'manager' | 'staff'
}

interface CreatedAccount {
  email: string
  tempPassword: string
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  let password = ''
  // ensure at least one special char
  password += '!@#$'[Math.floor(Math.random() * 4)]
  for (let i = 1; i < 8; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  // shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export function StaffCreateModal() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<CreatedAccount | null>(null)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPw, setCopiedPw] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { role: 'staff' },
  })

  async function onSubmit(values: FormValues) {
    if (!user) return
    setLoading(true)
    const tempPassword = generateTempPassword()

    try {
      // Call Supabase Edge Function to create user with service role
      const { data, error } = await supabase.functions.invoke('create-staff', {
        body: {
          email: values.email,
          password: tempPassword,
          name: values.name,
          role: values.role,
          storeId: user.storeId,
        },
      })

      if (error) throw error

      setCreated({ email: values.email, tempPassword })
      toast.success('직원 계정이 생성되었습니다.')
      reset()
    } catch (err: any) {
      toast.error(err?.message ?? '계정 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copyText(text: string, field: 'email' | 'pw') {
    await navigator.clipboard.writeText(text)
    if (field === 'email') {
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    } else {
      setCopiedPw(true)
      setTimeout(() => setCopiedPw(false), 2000)
    }
  }

  function handleClose(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) {
      setCreated(null)
      setCopiedEmail(false)
      setCopiedPw(false)
      reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <UserPlus className="w-4 h-4" />
          직원 추가
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>직원 계정 생성</DialogTitle>
        </DialogHeader>

        {!created ? (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600">이름</label>
              <Input
                placeholder="홍길동"
                aria-invalid={!!errors.name}
                {...register('name', { required: '이름을 입력하세요.' })}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600">이메일</label>
              <Input
                type="email"
                placeholder="staff@example.com"
                aria-invalid={!!errors.email}
                {...register('email', { required: '이메일을 입력하세요.' })}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600">역할</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                {...register('role')}
              >
                <option value="staff">스태프 (주문 관리)</option>
                <option value="manager">매니저 (메뉴 수정 + 매출 조회)</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? '생성 중...' : '계정 생성'}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4 mt-2">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
              직원 계정이 생성되었습니다. 아래 정보를 직원에게 전달해주세요.
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-500">이메일</span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-zinc-100 rounded-lg px-3 py-2 text-sm font-mono text-zinc-800 truncate">
                    {created.email}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyText(created.email, 'email')}
                    className="shrink-0"
                  >
                    {copiedEmail ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-500">임시 비밀번호</span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-zinc-100 rounded-lg px-3 py-2 text-sm font-mono text-zinc-800 tracking-widest">
                    {created.tempPassword}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyText(created.tempPassword, 'pw')}
                    className="shrink-0"
                  >
                    {copiedPw ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-400">
              직원이 첫 로그인 후 비밀번호를 변경하게 됩니다.
            </p>

            <Button variant="outline" onClick={() => handleClose(false)}>
              닫기
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

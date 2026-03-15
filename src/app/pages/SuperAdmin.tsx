import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Building2, Plus, Pencil, LogOut, Utensils } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Badge } from '@/app/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { useAuthContext } from '@/contexts/AuthContext'
import {
  getAllStores,
  updateStoreSubscription,
  createStoreWithOwner,
  type CreateStoreWithOwnerParams,
} from '@/lib/api/superadmin'
import type { StoreRow } from '@/types/database'
import { getKstDateString } from '@/lib/utils/subscription'

// Extended store type that includes subscription fields (added via migration)
interface StoreWithSub extends StoreRow {
  subscription_start?: string | null
  subscription_end?: string | null
  is_active?: boolean | null
}

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_REGEX = /^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function getStoreStatus(store: StoreWithSub): 'active' | 'expired' | 'inactive' {
  if (!store.is_active) return 'inactive'
  if (!store.subscription_end) return 'active'
  return store.subscription_end >= getKstDateString() ? 'active' : 'expired'
}

const STATUS_LABEL: Record<string, string> = {
  active: '활성',
  expired: '만료',
  inactive: '정지',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  expired: 'secondary',
  inactive: 'destructive',
}

// ============================================================
// Subscription edit dialog
// ============================================================

interface SubEditDialogProps {
  store: StoreWithSub | null
  onClose: () => void
  onSaved: () => void
}

function SubEditDialog({ store, onClose, onSaved }: SubEditDialogProps) {
  const [start, setStart] = useState(store?.subscription_start?.slice(0, 10) ?? '')
  const [end, setEnd] = useState(store?.subscription_end?.slice(0, 10) ?? '')
  const [isActive, setIsActive] = useState(store?.is_active ?? true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (store) {
      setStart(store.subscription_start?.slice(0, 10) ?? '')
      setEnd(store.subscription_end?.slice(0, 10) ?? '')
      setIsActive(store.is_active ?? true)
    }
  }, [store])

  async function handleSave() {
    if (!store) return
    if (!start || !end) {
      toast.error('이용 시작일과 종료일을 모두 입력하세요.')
      return
    }
    setLoading(true)
    try {
      await updateStoreSubscription({
        storeId: store.id,
        subscriptionStart: start,
        subscriptionEnd: end,
        isActive,
      })
      toast.success('이용기간이 업데이트되었습니다.')
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err?.message ?? '저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!store} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>이용기간 수정</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-600">매장명</label>
            <p className="text-sm text-zinc-900 font-semibold">{store?.name}</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-600">이용 시작일</label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-600">이용 종료일</label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            <label htmlFor="is_active" className="text-sm text-zinc-700">활성 상태</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>취소</Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {loading ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Store list tab
// ============================================================

interface StoreListTabProps {
  stores: StoreWithSub[]
  loading: boolean
  onEdit: (store: StoreWithSub) => void
  onAddClick: () => void
}

function StoreListTab({ stores, loading, onEdit, onAddClick }: StoreListTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">전체 매장 ({stores.length})</h2>
        <Button
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
          onClick={onAddClick}
        >
          <Plus className="w-4 h-4" />
          매장 추가
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-2">
          <Building2 className="w-10 h-10 opacity-40" />
          <p className="text-sm">등록된 매장이 없습니다.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50">
                <TableHead className="font-semibold text-zinc-700">매장명</TableHead>
                <TableHead className="font-semibold text-zinc-700">Slug</TableHead>
                <TableHead className="font-semibold text-zinc-700">이용기간</TableHead>
                <TableHead className="font-semibold text-zinc-700">상태</TableHead>
                <TableHead className="font-semibold text-zinc-700 w-20">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => {
                const status = getStoreStatus(store)
                return (
                  <TableRow key={store.id} className="hover:bg-zinc-50/60">
                    <TableCell className="font-medium text-zinc-900">{store.name}</TableCell>
                    <TableCell className="text-zinc-500 font-mono text-sm">{store.slug}</TableCell>
                    <TableCell className="text-zinc-600 text-sm">
                      {store.subscription_start && store.subscription_end
                        ? `${store.subscription_start.slice(0, 10)} ~ ${store.subscription_end.slice(0, 10)}`
                        : <span className="text-zinc-400">미설정</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[status]}>
                        {STATUS_LABEL[status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 gap-1 text-zinc-600 hover:text-orange-600"
                        onClick={() => onEdit(store)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        수정
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Add store tab
// ============================================================

interface AddStoreTabProps {
  onCreated: () => void
  onTabChange: (tab: string) => void
}

interface AddStoreForm {
  name: string
  slug: string
  address: string
  phone: string
  subscriptionStart: string
  subscriptionEnd: string
  ownerEmail: string
  ownerPassword: string
}

function AddStoreTab({ onCreated, onTabChange }: AddStoreTabProps) {
  const [form, setForm] = useState<AddStoreForm>({
    name: '',
    slug: '',
    address: '',
    phone: '',
    subscriptionStart: '',
    subscriptionEnd: '',
    ownerEmail: '',
    ownerPassword: '',
  })
  const [loading, setLoading] = useState(false)

  function handleChange(field: keyof AddStoreForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const slug = normalizeSlug(form.slug)

    if (!form.name || !slug) {
      toast.error('매장명과 Slug는 필수입니다.')
      return
    }
    if (!SLUG_REGEX.test(slug)) {
      toast.error('Slug는 영문 소문자/숫자/하이픈만 허용됩니다.')
      return
    }

    if (form.ownerPassword.length < PASSWORD_MIN_LENGTH) {
      toast.error('비밀번호는 최소 8자 이상이어야 합니다.')
      return
    }

    if (!PASSWORD_REGEX.test(form.ownerPassword)) {
      toast.error('임시 비밀번호는 특수문자를 1개 이상 포함해야 합니다.')
      return
    }

    if (form.subscriptionStart && form.subscriptionEnd && form.subscriptionEnd < form.subscriptionStart) {
      toast.error('이용 종료일은 시작일보다 빠를 수 없습니다.')
      return
    }

    if (!form.ownerEmail || !form.ownerPassword) {
      toast.error('점주 이메일과 임시 비밀번호를 입력하세요.')
      return
    }
    setLoading(true)
    try {
      await createStoreWithOwner({
        name: form.name,
        slug,
        address: form.address || undefined,
        phone: form.phone || undefined,
        subscriptionStart: form.subscriptionStart || undefined,
        subscriptionEnd: form.subscriptionEnd || undefined,
        ownerEmail: form.ownerEmail,
        ownerPassword: form.ownerPassword,
      })

      toast.success(`'${form.name}' 매장이 생성되었습니다.`)
      setForm({
        name: '', slug: '', address: '', phone: '',
        subscriptionStart: '', subscriptionEnd: '',
        ownerEmail: '', ownerPassword: '',
      })
      onCreated()
      onTabChange('stores')
    } catch (err: any) {
      toast.error(err?.message ?? '매장 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-base font-semibold text-zinc-900 mb-5">새 매장 추가</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Store info */}
        <div className="rounded-xl border border-zinc-200 p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">매장 정보</p>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-600">매장명 *</label>
            <Input
              placeholder="예) 맛있는 식당"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-600">Slug * (URL 식별자)</label>
            <Input
              placeholder="예) tasty-restaurant"
              value={form.slug}
              onChange={(e) => handleChange('slug', normalizeSlug(e.target.value))}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-600">주소</label>
            <Input
              placeholder="예) 서울특별시 강남구 ..."
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-600">전화번호</label>
            <Input
              placeholder="예) 02-1234-5678"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>
        </div>

        {/* Subscription */}
        <div className="rounded-xl border border-zinc-200 p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">이용기간</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600">시작일</label>
              <Input
                type="date"
                value={form.subscriptionStart}
                onChange={(e) => handleChange('subscriptionStart', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600">만료일</label>
              <Input
                type="date"
                value={form.subscriptionEnd}
                onChange={(e) => handleChange('subscriptionEnd', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Owner account */}
        <div className="rounded-xl border border-zinc-200 p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">점주 계정</p>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-600">점주 이메일 *</label>
            <Input
              type="email"
              placeholder="owner@example.com"
              value={form.ownerEmail}
              onChange={(e) => handleChange('ownerEmail', e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-600">임시 비밀번호 *</label>
            <Input
              type="password"
              placeholder="8자 이상"
              value={form.ownerPassword}
              onChange={(e) => handleChange('ownerPassword', e.target.value)}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white w-full"
        >
          {loading ? '생성 중...' : '매장 생성'}
        </Button>
      </form>
    </div>
  )
}

// ============================================================
// SuperAdmin page
// ============================================================

export function SuperAdmin() {
  const { user, signOut } = useAuthContext()
  const [stores, setStores] = useState<StoreWithSub[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [editingStore, setEditingStore] = useState<StoreWithSub | null>(null)
  const [activeTab, setActiveTab] = useState('stores')

  async function loadStores() {
    setListLoading(true)
    try {
      const data = await getAllStores()
      setStores(data as StoreWithSub[])
    } catch (err: any) {
      toast.error(err?.message ?? '매장 목록을 불러오지 못했습니다.')
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    loadStores()
  }, [])

  return (
    <div className="min-h-[100dvh] bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
            <Utensils className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-zinc-900">TableFlow</span>
            <span className="ml-2 text-xs text-orange-500 font-semibold bg-orange-50 px-1.5 py-0.5 rounded">
              SuperAdmin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500 hidden sm:block">{user?.email}</span>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-zinc-600"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="stores" className="gap-1.5">
              <Building2 className="w-4 h-4" />
              매장 목록
            </TabsTrigger>
            <TabsTrigger value="add" className="gap-1.5">
              <Plus className="w-4 h-4" />
              매장 추가
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stores">
            <StoreListTab
              stores={stores}
              loading={listLoading}
              onEdit={setEditingStore}
              onAddClick={() => setActiveTab('add')}
            />
          </TabsContent>

          <TabsContent value="add">
            <AddStoreTab
              onCreated={loadStores}
              onTabChange={setActiveTab}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Subscription edit dialog */}
      <SubEditDialog
        store={editingStore}
        onClose={() => setEditingStore(null)}
        onSaved={loadStores}
      />
    </div>
  )
}

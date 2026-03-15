import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Copy, Check, Users, ShieldCheck, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import { createStaffMember, getStaffMembers, deactivateStaffMember } from '@/lib/api/staffAdmin'
import type { StoreMemberRow, MemberRole } from '@/types/database'

interface Props {
  storeId: string
  currentUserId: string
}

interface CreatedStaff {
  memberId: string
  email: string
  role: 'manager' | 'staff'
  password: string
}

const ROLE_LABEL: Record<MemberRole, string> = {
  owner: '최고관리자',
  manager: '매니저',
  staff: '직원',
}

const ROLE_BADGE_CLASS: Record<MemberRole, string> = {
  owner: 'bg-orange-100 text-orange-700',
  manager: 'bg-blue-100 text-blue-700',
  staff: 'bg-zinc-100 text-zinc-600',
}

export function StaffManagement({ storeId, currentUserId }: Props) {
  const [members, setMembers] = useState<StoreMemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [createdStaffList, setCreatedStaffList] = useState<CreatedStaff[]>([])

  // Form state
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formName, setFormName] = useState('')
  const [formRole, setFormRole] = useState<'manager' | 'staff'>('staff')

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getStaffMembers(storeId)
      setMembers(data)
    } catch (err) {
      toast.error('직원 목록을 불러오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  function openModal() {
    setFormEmail('')
    setFormPassword('')
    setFormName('')
    setFormRole('staff')
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      await createStaffMember(storeId, formEmail, formPassword, formName, formRole)
      toast.success('직원 계정이 생성됐습니다.')
      setIsModalOpen(false)
      const refreshed = await getStaffMembers(storeId)
      setMembers(refreshed)
      // Record the created staff password so owner can copy it
      const newest = refreshed.find(
        (m) => m.role === formRole && !createdStaffList.find((c) => c.memberId === m.id),
      )
      if (newest) {
        setCreatedStaffList((prev) => [
          { memberId: newest.id, email: formEmail, role: formRole, password: formPassword },
          ...prev,
        ])
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '직원 생성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeactivate(member: StoreMemberRow) {
    if (member.user_id === currentUserId) {
      toast.error('자기 자신은 삭제할 수 없습니다.')
      return
    }
    if (!confirm(`이 직원을 삭제하시겠습니까?`)) return
    try {
      await deactivateStaffMember(member.id, storeId)
      toast.success('직원이 삭제됐습니다.')
      setMembers((prev) => prev.filter((m) => m.id !== member.id))
      setCreatedStaffList((prev) => prev.filter((c) => c.memberId !== member.id))
    } catch (err) {
      toast.error('직원 삭제에 실패했습니다.')
    }
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('복사에 실패했습니다.')
    }
  }

  const createdMap = Object.fromEntries(createdStaffList.map((c) => [c.memberId, c]))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-zinc-900">직원 관리</h2>
          <p className="text-sm font-medium text-zinc-500 mt-1">매장 직원 계정을 추가하고 관리합니다.</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          직원 추가
        </button>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-400 font-bold">
            불러오는 중...
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
            <Users className="w-10 h-10" />
            <p className="font-bold">등록된 직원이 없습니다.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="text-left text-xs font-black text-zinc-500 uppercase tracking-wider px-6 py-4">역할</th>
                <th className="text-left text-xs font-black text-zinc-500 uppercase tracking-wider px-6 py-4">이메일</th>
                <th className="text-left text-xs font-black text-zinc-500 uppercase tracking-wider px-6 py-4">임시 비밀번호</th>
                <th className="text-left text-xs font-black text-zinc-500 uppercase tracking-wider px-6 py-4">상태</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {members.map((member) => {
                const created = createdMap[member.id]
                const isSelf = member.user_id === currentUserId
                return (
                  <tr key={member.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${ROLE_BADGE_CLASS[member.role]}`}>
                        {member.role === 'owner' && <ShieldCheck className="w-3 h-3" />}
                        {member.role === 'manager' && <UserCheck className="w-3 h-3" />}
                        {ROLE_LABEL[member.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-zinc-700">
                      {created ? created.email : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {created ? (
                        <button
                          onClick={() => copyToClipboard(created.password, member.id)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-black text-zinc-700 transition-colors"
                        >
                          {copiedId === member.id ? (
                            <><Check className="w-3 h-3 text-green-600" /> 복사됨</>
                          ) : (
                            <><Copy className="w-3 h-3" /> 복사</>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400 font-medium">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {member.is_first_login ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-black border border-amber-200/50">
                          첫 로그인 전
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-black border border-green-200/50">
                          활성
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isSelf && member.role !== 'owner' && (
                        <button
                          onClick={() => handleDeactivate(member)}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              onClick={() => !submitting && setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[32px] z-[70] shadow-2xl overflow-hidden flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-900">직원 추가</h2>
                  <p className="text-sm font-medium text-zinc-500 mt-0.5">새 직원 계정을 생성합니다.</p>
                </div>
                <button
                  onClick={() => !submitting && setIsModalOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-900 mb-1.5">이름</label>
                  <input
                    required
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-900 mb-1.5">이메일</label>
                  <input
                    required
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="staff@example.com"
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-900 mb-1.5">임시 비밀번호</label>
                  <input
                    required
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="특수문자 포함 8자 이상"
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                  <p className="text-xs text-zinc-400 font-medium mt-1.5">직원이 첫 로그인 후 비밀번호를 변경해야 합니다.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-900 mb-1.5">역할</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['staff', 'manager'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormRole(r)}
                        className={`py-3 rounded-xl text-sm font-black border-2 transition-all ${
                          formRole === r
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                        }`}
                      >
                        {ROLE_LABEL[r]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => !submitting && setIsModalOpen(false)}
                    className="flex-1 py-4 bg-zinc-100 text-zinc-700 font-bold rounded-2xl hover:bg-zinc-200 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? '생성 중...' : '직원 추가'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

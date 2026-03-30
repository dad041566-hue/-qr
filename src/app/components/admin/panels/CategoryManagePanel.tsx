'use client'

import React, { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X, FolderOpen } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog'
import type { MenuCategoryRow, MenuItemRow } from '@/types/database'

interface CategoryManagePanelProps {
  categories: MenuCategoryRow[]
  menuItems: MenuItemRow[]
  onAdd: (name: string) => Promise<unknown>
  onRemove: (id: string) => Promise<void>
  onUpdateName: (id: string, name: string) => Promise<unknown>
  onReorder: (orderedIds: string[]) => Promise<void>
}

export default function CategoryManagePanel({
  categories,
  menuItems,
  onAdd,
  onRemove,
  onUpdateName,
  onReorder,
}: CategoryManagePanelProps) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<MenuCategoryRow | null>(null)

  const getMenuCountForCategory = (categoryId: string): number => {
    return menuItems.filter((m) => m.category_id === categoryId && !m.is_deleted).length
  }

  const handleAdd = async () => {
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    try {
      await onAdd(trimmed)
      setNewCategoryName('')
      setIsAdding(false)
    } catch {
      // toast handled by hook
    }
  }

  const handleStartEdit = (category: MenuCategoryRow) => {
    setEditingId(category.id)
    setEditingName(category.name)
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    const trimmed = editingName.trim()
    if (!trimmed) return
    try {
      await onUpdateName(editingId, trimmed)
      setEditingId(null)
      setEditingName('')
    } catch {
      // toast handled by hook
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await onRemove(deleteTarget.id)
    } catch {
      // toast handled by hook
    }
    setDeleteTarget(null)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const ids = categories.map((c) => c.id)
    const reordered = [...ids]
    ;[reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]]
    onReorder(reordered)
  }

  const handleMoveDown = (index: number) => {
    if (index === categories.length - 1) return
    const ids = categories.map((c) => c.id)
    const reordered = [...ids]
    ;[reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]]
    onReorder(reordered)
  }

  return (
    <div className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-extrabold text-zinc-900">카테고리 관리</h3>
          <p className="text-xs text-zinc-500 mt-0.5">메뉴를 분류할 카테고리를 관리합니다.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-orange-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> 카테고리 추가
          </button>
        )}
      </div>

      {isAdding && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setIsAdding(false); setNewCategoryName('') } }}
            placeholder="새 카테고리 이름"
            autoFocus
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm font-bold text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:font-medium placeholder:text-zinc-400"
          />
          <button
            onClick={handleAdd}
            disabled={!newCategoryName.trim()}
            className="p-2 text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setIsAdding(false); setNewCategoryName('') }}
            className="p-2 text-zinc-400 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-10 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
          <FolderOpen className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 font-medium">
            등록된 카테고리가 없습니다.
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            메뉴를 등록하려면 먼저 카테고리를 추가하세요.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((category, index) => {
            const menuCount = getMenuCountForCategory(category.id)
            const isEditing = editingId === category.id

            return (
              <div
                key={category.id}
                className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 group"
              >
                <div className="flex flex-col gap-0.5 mr-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="text-zinc-400 hover:text-zinc-700 disabled:opacity-20 transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === categories.length - 1}
                    className="text-zinc-400 hover:text-zinc-700 disabled:opacity-20 transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isEditing ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit() }}
                    autoFocus
                    className="flex-1 bg-white border border-orange-300 rounded-lg px-2 py-1 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                ) : (
                  <span className="flex-1 text-sm font-bold text-zinc-900">{category.name}</span>
                )}

                <span className="text-xs text-zinc-400 font-medium shrink-0">
                  메뉴 {menuCount}개
                </span>

                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleStartEdit(category)}
                      className="p-1.5 text-zinc-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(category)}
                      className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>카테고리 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && getMenuCountForCategory(deleteTarget.id) > 0
                ? `이 카테고리에 ${getMenuCountForCategory(deleteTarget.id)}개 메뉴가 있습니다. 삭제하시겠습니까?`
                : `"${deleteTarget?.name}" 카테고리를 삭제하시겠습니까?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

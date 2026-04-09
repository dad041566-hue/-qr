'use client';

import { useState } from 'react';
import { Bell, Plus, Pin, Edit2, Trash2, Save, X } from 'lucide-react';
import { MOCK_NOTICES } from '@/lib/mockData';
import { Notice } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import clsx from 'clsx';

export default function AdminNoticePage() {
  const [notices, setNotices] = useState<Notice[]>(MOCK_NOTICES);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState({ title: '', content: '', isPinned: false });

  const openNew = () => { setEditing(null); setForm({ title: '', content: '', isPinned: false }); setShowForm(true); };
  const openEdit = (notice: Notice) => { setEditing(notice); setForm({ title: notice.title, content: notice.content, isPinned: notice.isPinned }); setShowForm(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) setNotices(prev => prev.map(n => n.id === editing.id ? { ...n, ...form } : n));
    else setNotices(prev => [{ id: `notice-${Date.now()}`, ...form, createdAt: new Date().toISOString() }, ...prev]);
    setShowForm(false);
  };

  const handleDelete = (id: string) => setNotices(prev => prev.filter(n => n.id !== id));

  return (
    <div className="max-w-[800px] space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Bell className="w-5 h-5 text-red-600" /> 공지사항 관리
        </h1>
        <button onClick={openNew} className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-red-700 transition-colors">
          <Plus className="w-4 h-4" /> 새 공지
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-red-300 rounded p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
            <h2 className="text-sm font-bold text-gray-800">{editing ? '공지 수정' : '새 공지 작성'}</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
          </div>
          <div className="space-y-3">
            <input type="text" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="공지 제목" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-red-500 outline-none" />
            <textarea required rows={4} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="내용" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-red-500 outline-none resize-none" />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.isPinned} onChange={e => setForm(p => ({ ...p, isPinned: e.target.checked }))} className="accent-red-600"/>
                <Pin className="w-3.5 h-3.5 text-red-500" /> 상단 고정
              </label>
              <button type="submit" className="flex items-center gap-1 px-4 py-1.5 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700">
                <Save className="w-4 h-4" /> 저장
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="divide-y divide-gray-100">
          {notices.map(notice => (
            <div key={notice.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                {notice.isPinned && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded shrink-0">고정</span>}
                <span className="text-sm text-gray-800 font-semibold truncate">{notice.title}</span>
                <span className="text-[11px] text-gray-400 shrink-0 ml-2">{formatDate(notice.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(notice)} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded border border-gray-200"><Edit2 className="w-3.5 h-3.5"/></button>
                <button onClick={() => handleDelete(notice.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded border border-red-100"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            </div>
          ))}
          {notices.length === 0 && <div className="p-6 text-center text-sm text-gray-400">공지사항이 없습니다.</div>}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { MOCK_SHOPS } from '@/lib/mockData';
import { REGIONS, THEMES } from '@/lib/types';
import Link from 'next/link';

export default function ShopEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === 'new';
  const initialData = isNew ? {
    id: `shop-${Date.now()}`, slug: '', name: '', description: '', tagline: '', address: '', phone: '',
    hours: '', region: 'seoul', regionLabel: '서울', theme: 'swedish', themeLabel: '스웨디시',
    rating: 0, reviewCount: 0, isPremium: false, isVisible: true, courses: [], images: [], tags: []
  } : MOCK_SHOPS.find(s => s.id === id);

  const [form, setForm] = useState(initialData!);
  const [courses, setCourses] = useState(initialData!.courses);
  const [tagsStr, setTagsStr] = useState(initialData!.tags.join(', '));

  if (!form) return <div>Not Found</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/admin/shops');
  };

  const ipt = "w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500";
  const lbl = "block text-xs font-bold text-gray-700 mb-1";

  return (
    <div className="max-w-[800px] space-y-4 pb-10">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/admin/shops" className="p-1 hover:bg-gray-200 rounded text-gray-600"><ArrowLeft className="w-5 h-5"/></Link>
        <h1 className="text-xl font-black text-gray-800">{isNew ? '업소 등록' : '업소 수정'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 기본 정보 */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">기본 정보</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className={lbl}>업소명 *</label>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={ipt}/>
            </div>
            <div>
              <label className={lbl}>슬러그 (URL 영문) *</label>
              <input type="text" required value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className={ipt}/>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className={lbl}>지역</label>
              <select value={form.region} onChange={e => setForm({...form, region: e.target.value, regionLabel: REGIONS.find(r=>r.code===e.target.value)?.label!})} className={ipt}>
                {REGIONS.filter(r=>r.code!=='all').map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>테마</label>
              <select value={form.theme} onChange={e => setForm({...form, theme: e.target.value, themeLabel: THEMES.find(t=>t.code===e.target.value)?.label!})} className={ipt}>
                {THEMES.filter(t=>t.code!=='all').map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className={lbl}>메인 캐치프레이즈 (목록 노출)</label>
            <input type="text" value={form.tagline} onChange={e => setForm({...form, tagline: e.target.value})} className={ipt}/>
          </div>
          <div className="mb-3">
            <label className={lbl}>상세 설명</label>
            <textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={`${ipt} resize-none`}/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={lbl}>연락처</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={ipt}/></div>
            <div><label className={lbl}>영업시간</label><input type="text" value={form.hours} onChange={e => setForm({...form, hours: e.target.value})} className={ipt}/></div>
          </div>
          <div className="mt-3">
            <label className={lbl}>주소</label>
            <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={ipt}/>
          </div>
          <div className="mt-3">
            <label className={lbl}>태그 (쉼표로 구분)</label>
            <input type="text" value={tagsStr} onChange={e => setTagsStr(e.target.value)} placeholder="예: 무료주차, 수면가능" className={ipt}/>
          </div>
        </div>

        {/* 코스 정보 */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">코스/요금표</h2>
            <button type="button" onClick={() => setCourses([...courses, { name: '', price: '', duration: '', description: '' }])}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-700 flex items-center gap-1">
              <Plus className="w-3 h-3"/> 추가
            </button>
          </div>
          <div className="space-y-2 text-sm">
            {courses.map((course, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <input type="text" placeholder="코스명" value={course.name} onChange={e => { const n=[...courses]; n[idx].name=e.target.value; setCourses(n); }} className={`${ipt} w-1/3`} />
                <input type="text" placeholder="시간" value={course.duration} onChange={e => { const n=[...courses]; n[idx].duration=e.target.value; setCourses(n); }} className={`${ipt} w-1/4`} />
                <input type="text" placeholder="요금" value={course.price} onChange={e => { const n=[...courses]; n[idx].price=e.target.value; setCourses(n); }} className={`${ipt} flex-1`} />
                <button type="button" onClick={() => setCourses(courses.filter((_, i) => i !== idx))} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
            {courses.length === 0 && <p className="text-xs text-gray-400">등록된 코스가 없습니다.</p>}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Link href="/admin/shops" className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">취소</Link>
          <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700 flex items-center gap-1">
            <Save className="w-4 h-4"/> 저장
          </button>
        </div>
      </form>
    </div>
  );
}

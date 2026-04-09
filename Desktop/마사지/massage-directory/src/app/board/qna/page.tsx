'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, ChevronDown, ChevronUp, Plus, X, Calendar } from 'lucide-react';
import { MOCK_QNA } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';

function QnAContent() {
  const searchParams = useSearchParams();
  const shopId = searchParams.get('shopId');
  const [openId, setOpenId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ question: '', authorName: '' });
  const [submitted, setSubmitted] = useState(false);
  const filtered = shopId ? MOCK_QNA.filter(q => q.shopId === shopId) : MOCK_QNA;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setShowForm(false);
    setFormData({ question: '', authorName: '' });
  };

  return (
    <div className="max-w-[800px] mx-auto px-3 py-4">
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <Link href="/" className="hover:text-red-600">홈</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/board" className="hover:text-red-600">게시판</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-800">Q&A</span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-black text-gray-800">💬 Q&amp;A</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-red-600 text-white text-xs font-bold hover:bg-red-700">
          {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showForm ? '취소' : '질문 작성'}
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-red-200 rounded p-4 mb-3 space-y-3">
          <input type="text" required value={formData.authorName}
            onChange={e => setFormData(p => ({ ...p, authorName: e.target.value }))}
            placeholder="닉네임" className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500" />
          <textarea required value={formData.question}
            onChange={e => setFormData(p => ({ ...p, question: e.target.value }))}
            placeholder="질문 내용을 입력하세요" rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500 resize-none" />
          <button type="submit" className="w-full py-2 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700">등록</button>
        </form>
      )}
      {submitted && <div className="mb-3 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">✅ 질문이 등록되었습니다.</div>}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">등록된 Q&A가 없습니다.</p>
        ) : filtered.map((qna, idx) => (
          <div key={qna.id} className={idx < filtered.length - 1 ? 'border-b border-gray-100' : ''}>
            <button onClick={() => setOpenId(openId === qna.id ? null : qna.id)}
              className="w-full flex items-start justify-between p-3 text-left hover:bg-gray-50 transition-all">
              <div className="flex items-start gap-2 min-w-0">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${qna.isAnswered ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {qna.isAnswered ? '완료' : '대기'}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-gray-700">Q. {qna.question}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{qna.authorName} · {formatDate(qna.createdAt)}</p>
                </div>
              </div>
              {openId === qna.id ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />}
            </button>
            {openId === qna.id && (
              <div className="px-3 pb-3">
                {qna.answer ? (
                  <div className="p-3 bg-red-50 border border-red-100 rounded text-sm text-gray-700">
                    <p className="text-[11px] text-red-500 font-bold mb-1">관리자 답변</p>
                    A. {qna.answer}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-500">답변 준비 중입니다.</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function QnAPage() {
  return <Suspense fallback={<div className="min-h-screen" />}><QnAContent /></Suspense>;
}

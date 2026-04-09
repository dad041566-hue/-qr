import { Metadata } from 'next';
import Link from 'next/link';
import { Pin, Calendar, ChevronRight, Star } from 'lucide-react';
import { MOCK_NOTICES, MOCK_QNA, MOCK_REVIEWS } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: '게시판', description: '공지사항, Q&A, 업소 후기' };

export default function BoardPage() {
  return (
    <div className="max-w-[1000px] mx-auto px-3 py-4">
      <h1 className="text-lg font-black text-gray-800 mb-4">📋 고객센터 &amp; 게시판</h1>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { href: '/board/notice', label: '공지사항', count: MOCK_NOTICES.length, emoji: '📢' },
          { href: '/board/qna', label: 'Q&A', count: MOCK_QNA.length, emoji: '💬' },
          { href: '/board/review', label: '업소 후기', count: MOCK_REVIEWS.length, emoji: '⭐' },
        ].map(tab => (
          <Link key={tab.href} href={tab.href}
            className="bg-white border border-gray-200 rounded p-3 text-center hover:border-red-300 hover:bg-red-50/50 transition-all">
            <div className="text-2xl mb-1">{tab.emoji}</div>
            <p className="text-sm font-bold text-gray-800">{tab.label}</p>
            <p className="text-xs text-gray-400">{tab.count}개</p>
          </Link>
        ))}
      </div>

      {/* 공지사항 */}
      <div className="bg-white border border-gray-200 rounded p-4 mb-3">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
          <h2 className="text-sm font-black text-gray-800">📢 공지사항</h2>
          <Link href="/board/notice" className="text-xs text-red-600 hover:underline">전체 &raquo;</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {MOCK_NOTICES.map(notice => (
            <Link key={notice.id} href={`/board/notice/${notice.id}`}
              className="flex items-center justify-between py-2 hover:bg-gray-50 px-1 -mx-1 rounded transition-all">
              <div className="flex items-center gap-2 min-w-0">
                {notice.isPinned && <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded shrink-0">공지</span>}
                <span className="text-sm text-gray-700 truncate">{notice.title}</span>
              </div>
              <span className="text-[11px] text-gray-400 shrink-0 ml-2">{formatDate(notice.createdAt)}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Q&A */}
      <div className="bg-white border border-gray-200 rounded p-4 mb-3">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
          <h2 className="text-sm font-black text-gray-800">💬 Q&amp;A</h2>
          <Link href="/board/qna" className="text-xs text-red-600 hover:underline">전체 &raquo;</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {MOCK_QNA.slice(0, 3).map(qna => (
            <div key={qna.id} className="py-2.5">
              <div className="flex items-start gap-2 mb-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${qna.isAnswered ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {qna.isAnswered ? '완료' : '대기'}
                </span>
                <p className="text-sm text-gray-700">Q. {qna.question}</p>
              </div>
              {qna.answer && <p className="text-xs text-gray-500 pl-10 border-l-2 border-red-200 ml-3">A. {qna.answer}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* 후기 */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
          <h2 className="text-sm font-black text-gray-800">⭐ 최근 후기</h2>
          <Link href="/board/review" className="text-xs text-red-600 hover:underline">전체 &raquo;</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {MOCK_REVIEWS.slice(0, 3).map(review => (
            <div key={review.id} className="py-2.5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-800">{review.authorName}</span>
                  <span className="text-xs text-red-500">{review.shopName}</span>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{review.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

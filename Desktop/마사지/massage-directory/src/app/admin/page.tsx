import { Metadata } from 'next';
import Link from 'next/link';
import { Store, BarChart2, Star, MessageCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { MOCK_SHOPS, MOCK_QNA, MOCK_REVIEWS } from '@/lib/mockData';
import { formatRating } from '@/lib/utils';

export const metadata: Metadata = { title: '대시보드 | 관리자' };

export default function AdminDashboard() {
  const pendingQnA = MOCK_QNA.filter(q => !q.isAnswered).length;

  const summary = [
    { label: '전체 업소', value: MOCK_SHOPS.length, icon: Store, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '프리미엄(AD)', value: MOCK_SHOPS.filter(s => s.isPremium).length, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: '미답변 Q&A', value: pendingQnA, icon: MessageCircle, color: 'text-red-500', bg: 'bg-red-50' },
    { label: '오늘 페이지뷰', value: '1,247', icon: BarChart2, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-4 max-w-[1000px]">
      <h1 className="text-xl font-black text-gray-800">대시보드</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summary.map(item => (
          <div key={item.label} className="bg-white border border-gray-200 rounded p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 mb-1">{item.label}</p>
              <p className="text-xl font-black text-gray-800">{item.value}</p>
            </div>
            <div className={`p-2 rounded ${item.bg}`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* 미답변 Q&A */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-500" /> 처리 필요 Q&amp;A
            </h2>
            <Link href="/admin/qna" className="text-[10px] text-gray-400 hover:text-red-600">더보기</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {MOCK_QNA.filter(q => !q.isAnswered).slice(0, 4).map(qna => (
              <div key={qna.id} className="py-2 flex justify-between items-center text-sm">
                <span className="text-gray-700 truncate min-w-0 pr-3">{qna.question}</span>
                <Link href="/admin/qna" className="shrink-0 text-[11px] px-2 py-1 bg-red-50 text-red-600 rounded">답변하기</Link>
              </div>
            ))}
            {pendingQnA === 0 && <p className="text-xs text-center py-4 text-gray-400">새로운 문의가 없습니다.</p>}
          </div>
        </div>

        {/* 최근 후기 요약 */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-500" /> 최근 작성된 후기
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {MOCK_REVIEWS.slice(0, 4).map(review => (
              <div key={review.id} className="py-2 text-sm">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-gray-800 text-[11px]">{review.shopName}</span>
                  <div className="flex items-center text-[10px] text-amber-500 font-bold">
                    <Star className="w-2.5 h-2.5 fill-amber-500 mr-0.5" />{review.rating}.0
                  </div>
                </div>
                <p className="text-gray-600 text-xs truncate">{review.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import { Star, ChevronRight } from 'lucide-react';
import { MOCK_REVIEWS } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: '업소 후기' };

export default function ReviewPage() {
  return (
    <div className="max-w-[800px] mx-auto px-3 py-4">
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <Link href="/" className="hover:text-red-600">홈</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/board" className="hover:text-red-600">게시판</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-800">업소 후기</span>
      </div>
      <h1 className="text-lg font-black text-gray-800 mb-3">⭐ 업소 후기 모아보기</h1>
      <div className="bg-white border border-gray-200 rounded overflow-hidden divide-y divide-gray-100">
        {MOCK_REVIEWS.map(review => (
          <div key={review.id} className="p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-800">{review.authorName}</span>
                <span className="text-xs text-red-500">{review.shopName}</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                  ))}
                </div>
              </div>
              <span className="text-[11px] text-gray-400">{formatDate(review.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

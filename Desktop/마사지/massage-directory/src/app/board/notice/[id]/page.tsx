import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Pin, ChevronRight } from 'lucide-react';
import { MOCK_NOTICES } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const n = MOCK_NOTICES.find(n => n.id === id);
  return { title: n?.title ?? '공지사항' };
}

export default async function NoticeDetailPage({ params }: Props) {
  const { id } = await params;
  const notice = MOCK_NOTICES.find(n => n.id === id);
  if (!notice) notFound();

  return (
    <div className="max-w-[800px] mx-auto px-3 py-4">
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <Link href="/" className="hover:text-red-600">홈</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/board/notice" className="hover:text-red-600">공지사항</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-800 truncate">{notice.title}</span>
      </div>
      <div className="bg-white border border-gray-200 rounded p-5">
        <div className="mb-4 pb-3 border-b border-gray-200">
          {notice.isPinned && <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded mb-2 inline-block">고정공지</span>}
          <h1 className="text-lg font-black text-gray-800 mt-1">{notice.title}</h1>
          <p className="text-xs text-gray-400 mt-1">{formatDate(notice.createdAt)}</p>
        </div>
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{notice.content}</div>
      </div>
      <div className="mt-3 text-center">
        <Link href="/board/notice" className="text-sm text-gray-500 hover:text-red-600">&laquo; 목록으로</Link>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { REGIONS, THEMES } from '@/lib/types';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-400 mt-6 pb-16 md:pb-0">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
          <div>
            <h4 className="text-white font-bold mb-2 text-sm">지역별</h4>
            <ul className="space-y-1">
              {REGIONS.filter(r => r.code !== 'all').map(r => (
                <li key={r.code}>
                  <Link href={`/?region=${r.code}`} className="hover:text-red-400">{r.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2 text-sm">테마별</h4>
            <ul className="space-y-1">
              {THEMES.filter(t => t.code !== 'all').map(t => (
                <li key={t.code}>
                  <Link href={`/?theme=${t.code}`} className="hover:text-red-400">{t.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2 text-sm">고객센터</h4>
            <ul className="space-y-1">
              <li><Link href="/board/notice" className="hover:text-red-400">공지사항</Link></li>
              <li><Link href="/board/qna" className="hover:text-red-400">Q&A</Link></li>
              <li><Link href="/board/review" className="hover:text-red-400">업소 후기</Link></li>
              <li><Link href="/admin" className="hover:text-red-400">관리자</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2 text-sm">힐링찾기</h4>
            <p className="text-xs leading-relaxed text-gray-500">
              전국 제휴업소 디렉토리 플랫폼<br />
              제휴/광고 문의: contact@healing.kr<br />
              고객센터: 1588-0000
            </p>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-700 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2024 힐링찾기. All rights reserved.</p>
          <div className="flex gap-3">
            <Link href="/terms" className="hover:text-gray-300">이용약관</Link>
            <Link href="/privacy" className="hover:text-gray-300">개인정보처리방침</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { REGIONS, THEMES, DISTRICTS } from '@/lib/types';
import clsx from 'clsx';

export default function Sidebar() {
  const searchParams = useSearchParams();
  const currentRegion = searchParams.get('region') ?? '';
  const currentSubRegion = searchParams.get('subRegion') ?? '';
  const currentTheme = searchParams.get('theme') ?? '';

  return (
    <aside className="hidden md:block w-[180px] shrink-0">
      <div className="sticky top-[110px] space-y-3">
        {/* 지역별 메뉴 */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="bg-red-600 text-white text-xs font-bold px-3 py-2">
            📍 지역별 업소
          </div>
          <div>
            <Link
              href="/"
              className={clsx('lnb-menu-item', !currentRegion && !currentTheme && 'active')}
            >
              전체보기
            </Link>
            {REGIONS.filter(r => r.code !== 'all').map(r => (
              <div key={r.code}>
                <Link
                  href={`/?region=${r.code}`}
                  className={clsx('lnb-menu-item', currentRegion === r.code && !currentSubRegion && 'active')}
                >
                  &rsaquo; {r.label}
                </Link>
                {/* 해당 지역이 선택되었고 세부 구가 있다면 표시 */}
                {currentRegion === r.code && DISTRICTS[r.code] && (
                  <div className="bg-gray-50/80 border-b border-gray-100 pb-1">
                    {DISTRICTS[r.code].filter(d => d.code !== 'all').map(d => (
                      <Link
                        key={d.code}
                        href={`/?region=${r.code}&subRegion=${d.code}`}
                        className={clsx('block px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 pl-6 border-b border-white/50 last:border-0', currentSubRegion === d.code && 'text-red-600 font-bold')}
                      >
                        - {d.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 테마별 메뉴 */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="bg-orange-500 text-white text-xs font-bold px-3 py-2">
            🏷️ 테마별 업소
          </div>
          <div>
            {THEMES.filter(t => t.code !== 'all').map(t => (
              <Link
                key={t.code}
                href={`/?theme=${t.code}`}
                className={clsx('lnb-menu-item', currentTheme === t.code && 'active')}
              >
                &rsaquo; {t.label}
              </Link>
            ))}
          </div>
        </div>

        {/* 고객센터 */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="bg-gray-700 text-white text-xs font-bold px-3 py-2">
            📞 고객센터
          </div>
          <div>
            <Link href="/board/notice" className="lnb-menu-item">&rsaquo; 공지사항</Link>
            <Link href="/board/qna" className="lnb-menu-item">&rsaquo; Q&A 문의</Link>
            <Link href="/board/review" className="lnb-menu-item">&rsaquo; 업소 후기</Link>
          </div>
        </div>

        {/* 광고 배너 슬롯 1 */}
        <div className="ad-slot h-[200px] rounded">
          <div className="text-center">
            <div className="text-2xl mb-1">📢</div>
            <span>광고 배너 영역</span><br/>
            <span className="text-[10px]">180×200</span>
          </div>
        </div>

        {/* 광고 배너 슬롯 2 */}
        <div className="ad-slot h-[120px] rounded">
          <div className="text-center">
            <div className="text-lg mb-0.5">💎</div>
            <span>제휴문의</span><br/>
            <span className="text-[10px]">1588-0000</span>
          </div>
        </div>

        {/* 광고 배너 슬롯 3 */}
        <div className="ad-slot h-[150px] rounded">
          <div className="text-center">
            <div className="text-lg mb-0.5">🎯</div>
            <span>광고 배너 영역</span><br/>
            <span className="text-[10px]">180×150</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

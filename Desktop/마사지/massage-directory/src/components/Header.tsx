'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Menu, X, User, ChevronDown } from 'lucide-react';
import { REGIONS, THEMES } from '@/lib/types';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="bg-white border-b-2 border-red-600 shadow-sm sticky top-0 z-50">
      {/* 최상단 공지 바 */}
      <div className="bg-red-600 text-white text-center text-xs py-1 font-medium">
        🎁 제휴업소 입점 문의 환영! &nbsp;|&nbsp; 프리미엄 배너 광고 진행중 &nbsp;|&nbsp; ☎ 1588-0000
      </div>

      {/* 메인 헤더 */}
      <div className="max-w-[1400px] mx-auto px-3">
        <div className="flex items-center h-14 gap-3">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-1.5 shrink-0">
            <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">힐</span>
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="text-red-600 font-black text-base">힐링찾기</span>
              <span className="text-gray-400 text-[10px] block -mt-0.5">HEALING DIRECTORY</span>
            </div>
          </Link>

          {/* 검색 */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="지역, 업소명, 테마 검색"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 bg-white"
              />
              <button type="submit" className="absolute right-0 top-0 h-full px-2.5 text-red-600">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* 우측 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link href="/auth/login" className="text-xs text-gray-600 hover:text-red-600 px-2 py-1 hidden sm:block">로그인</Link>
            <span className="text-gray-300 hidden sm:block">|</span>
            <Link href="/auth/register" className="text-xs text-gray-600 hover:text-red-600 px-2 py-1 hidden sm:block">회원가입</Link>
            <span className="text-gray-300 hidden sm:block">|</span>
            <Link href="/admin" className="text-xs text-gray-600 hover:text-red-600 px-2 py-1 hidden sm:block">관리자</Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-gray-600"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* GNB 지역탭 (PC) */}
        <nav className="hidden md:flex items-center border-t border-gray-200 -mx-3 px-3 overflow-x-auto scrollbar-hide">
          {REGIONS.filter(r => r.code !== 'all').map(region => (
            <Link
              key={region.code}
              href={`/?region=${region.code}`}
              className="shrink-0 px-4 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 border-b-2 border-transparent hover:border-red-600 font-medium transition-all"
            >
              {region.label}
            </Link>
          ))}
          <div className="w-px h-4 bg-gray-300 mx-1 self-center" />
          {THEMES.filter(t => t.code !== 'all').slice(0, 5).map(theme => (
            <Link
              key={theme.code}
              href={`/?theme=${theme.code}`}
              className="shrink-0 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              {theme.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* 모바일 드롭다운 */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <form onSubmit={handleSearch} className="p-3 border-b border-gray-100">
            <input
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:border-red-500"
            />
          </form>
          <div className="p-3">
            <p className="text-xs text-gray-400 font-bold mb-2">지역별</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {REGIONS.filter(r => r.code !== 'all').map(r => (
                <Link
                  key={r.code}
                  href={`/?region=${r.code}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-2.5 py-1 rounded border border-gray-200 text-xs text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                >
                  {r.label}
                </Link>
              ))}
            </div>
            <p className="text-xs text-gray-400 font-bold mb-2">테마별</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {THEMES.filter(t => t.code !== 'all').map(t => (
                <Link
                  key={t.code}
                  href={`/?theme=${t.code}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-2.5 py-1 rounded border border-gray-200 text-xs text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                >
                  {t.label}
                </Link>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50">로그인</Link>
              <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-xs bg-red-600 text-white rounded font-semibold hover:bg-red-700">회원가입</Link>
            </div>
          </div>
        </div>
      )}

      {/* 모바일 하단 네비 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center justify-around py-1.5">
          {[
            { href: '/', label: '홈', emoji: '🏠' },
            { href: '/?view=list', label: '업소', emoji: '📋' },
            { href: '/board', label: '게시판', emoji: '💬' },
            { href: '/board/qna', label: '고객센터', emoji: '📞' },
            { href: '/auth/login', label: 'MY', emoji: '👤' },
          ].map(item => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 px-3 py-0.5">
              <span className="text-base">{item.emoji}</span>
              <span className="text-[10px] text-gray-500">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

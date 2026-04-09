'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Store, Bell, MessageCircle, Settings,
  LogOut, Crown, BarChart2, Users, Eye, Menu, X, ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/shops', label: '업소 관리', icon: Store },
  { href: '/admin/premium', label: '프리미엄 배너', icon: Crown },
  { href: '/admin/notice', label: '공지 관리', icon: Bell },
  { href: '/admin/qna', label: 'Q&A 관리', icon: MessageCircle },
  { href: '/admin/stats', label: '통계', icon: BarChart2 },
  { href: '/admin/users', label: '회원 관리', icon: Users },
  { href: '/admin/settings', label: '사이트 설정', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`fixed top-0 left-0 h-full w-[200px] bg-white border-r border-gray-200 z-50 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center">
            <span className="text-white font-black text-xs">힐</span>
          </div>
          <span className="font-bold text-gray-800 text-sm">힐링 관리자</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm mb-1 transition-colors ${
                  isActive ? 'bg-red-50 text-red-600 font-bold' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200 space-y-1">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
            <Eye className="w-4 h-4" /> 사이트 보기
          </Link>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 rounded">
            <LogOut className="w-4 h-4" /> 로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 md:ml-[200px] flex flex-col min-h-screen min-w-0">
        <header className="bg-white border-b border-gray-200 h-14 px-4 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600">
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm font-bold text-gray-800">어드민 모드</div>
          <div className="ml-auto text-xs text-gray-500">최고관리자 (admin@)</div>
        </header>
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}

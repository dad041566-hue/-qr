'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-10 h-10 rounded bg-red-600 flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-black text-lg">힐</span>
            </div>
            <h1 className="text-lg font-black text-gray-800 mb-1">로그인</h1>
            <p className="text-xs text-gray-400">힐링찾기 계정으로 로그인하세요</p>
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-yellow-400 text-gray-900 text-sm font-bold hover:bg-yellow-300 mb-2">
            💬 카카오 로그인
          </button>
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-green-500 text-white text-sm font-bold hover:bg-green-600 mb-4">
            🌐 네이버 로그인
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[11px] text-gray-400">또는</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="email" required value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="이메일"
              className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500" />
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} required value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="비밀번호"
                className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500 pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-red-600 text-white font-bold text-sm rounded hover:bg-red-700 disabled:opacity-60">
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-4 flex justify-between text-xs">
            <Link href="/auth/forgot" className="text-gray-400 hover:text-red-600">비밀번호 찾기</Link>
            <Link href="/auth/register" className="text-red-600 font-semibold">회원가입 →</Link>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <Link href="/admin" className="text-[11px] text-gray-400 hover:text-red-600">관리자 로그인</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

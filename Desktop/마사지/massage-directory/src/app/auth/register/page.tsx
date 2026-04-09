'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', agree: false });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 1500);
  };

  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h1 className="text-lg font-black text-gray-800 mb-2">가입 완료!</h1>
          <p className="text-sm text-gray-500 mb-6">힐링찾기 회원이 되신 것을 환영합니다.</p>
          <Link href="/auth/login" className="px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700">
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-10 h-10 rounded bg-red-600 flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-black text-lg">힐</span>
            </div>
            <h1 className="text-lg font-black text-gray-800 mb-1">회원가입</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" required value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="닉네임"
              className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500" />
            <input type="email" required value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="이메일"
              className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500" />
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} required value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="비밀번호 (8자 이상)"
                className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500 pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={form.agree}
                onChange={e => setForm(p => ({ ...p, agree: e.target.checked }))}
                className="mt-0.5 accent-red-600" />
              <span className="text-xs text-gray-500">
                <Link href="/terms" className="text-red-600 hover:underline">이용약관</Link> 및{' '}
                <Link href="/privacy" className="text-red-600 hover:underline">개인정보처리방침</Link>에 동의
              </span>
            </label>
            <button type="submit" disabled={loading || !form.agree}
              className="w-full py-2.5 bg-red-600 text-white font-bold text-sm rounded hover:bg-red-700 disabled:opacity-50">
              {loading ? '가입 중...' : '가입하기'}
            </button>
          </form>
          <div className="mt-4 text-center text-xs">
            <span className="text-gray-400">이미 계정이 있으신가요? </span>
            <Link href="/auth/login" className="text-red-600 font-semibold">로그인</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

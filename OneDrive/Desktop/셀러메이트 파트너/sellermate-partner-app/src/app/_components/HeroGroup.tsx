'use client';

import { useState } from 'react';

/* ─────────────────────────────────────────
   Header — Sticky, 모바일 햄버거 메뉴
   ───────────────────────────────────────── */
function PartnerHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const links = [
    { label: '서비스 소개', id: 'services' },
    { label: '파트너 등급', id: 'tiers' },
    { label: '수익 계산기', id: 'calculator' },
    { label: 'FAQ', id: 'faq' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/92 backdrop-blur-md border-b border-gray-200/80">
      <div className="max-w-[1200px] mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 no-underline">
          <span className="w-7 h-7 bg-[var(--p-blue)] rounded-lg flex items-center justify-center text-white font-extrabold text-sm">
            S
          </span>
          <span className="text-lg font-bold text-[var(--p-navy)] tracking-tight">
            셀러메이트 파트너
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="text-sm text-gray-500 hover:text-[var(--p-blue)] font-medium bg-transparent border-none cursor-pointer transition-colors"
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo('final-cta')}
            className="px-5 py-2.5 bg-[var(--p-blue)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--p-blue-hover)] transition-colors cursor-pointer"
          >
            파트너 시작하기
          </button>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden bg-transparent border-none cursor-pointer p-2 text-gray-600"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="메뉴"
        >
          {mobileOpen ? (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 bg-white/98 backdrop-blur-md z-40 p-6 flex flex-col gap-1">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="block w-full text-left px-4 py-3.5 text-base font-medium text-gray-600 hover:bg-gray-50 rounded-xl bg-transparent border-none cursor-pointer"
            >
              {l.label}
            </button>
          ))}
          <div className="mt-4 px-4">
            <button
              onClick={() => scrollTo('final-cta')}
              className="w-full py-3.5 bg-[var(--p-blue)] text-white font-semibold rounded-xl hover:bg-[var(--p-blue-hover)] transition-colors cursor-pointer border-none text-base"
            >
              파트너 시작하기
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ─────────────────────────────────────────
   Hero Section
   ───────────────────────────────────────── */
function HeroSection() {
  const months = ['1월', '2월', '3월', '4월', '5월', '6월'];
  const barWidths = [45, 72, 58, 85, 40, 62];

  return (
    <section className="pt-16 pb-12 md:pt-20 md:pb-16 bg-gradient-to-b from-[var(--p-blue-50)] to-white">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* Left — Copy */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--p-blue-light)] text-[var(--p-blue)] text-[13px] font-semibold mb-5">
            <span>🤝</span> 셀러메이트 공식 파트너 프로그램
          </div>
          <h1 className="text-3xl md:text-[42px] font-extrabold text-gray-900 leading-tight tracking-tight mb-5">
            온라인 판매자를 위한
            <br />
            <span className="text-[var(--p-blue)]">재택 부업의 정석</span>
          </h1>
          <p className="text-base md:text-[17px] text-gray-400 leading-relaxed mb-8">
            추천인 가입 보상 + 셀러메이트 수익 퍼센트 적립.
            <br />
            집에서, 스마트폰으로, 내 네트워크로 수익을 만드세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => document.getElementById('tiers')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-8 py-3.5 bg-[var(--p-blue)] text-white font-semibold rounded-xl hover:bg-[var(--p-blue-hover)] transition-colors cursor-pointer border-none text-[15px]"
            >
              파트너 등급 알아보기 →
            </button>
            <button
              onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-[var(--p-blue)] font-semibold rounded-xl border-[1.5px] border-[var(--p-blue)] hover:bg-[var(--p-blue-light)] transition-colors cursor-pointer text-[15px]"
            >
              수익 계산해보기
            </button>
          </div>
        </div>

        {/* Right — Dashboard Mockup */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
          {/* Title bar */}
          <div className="bg-[var(--p-navy)] px-5 py-3.5 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white/25" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/25" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/25" />
            <span className="text-white/60 text-xs ml-2">파트너 대시보드 미리보기</span>
          </div>
          {/* Body */}
          <div className="p-5 bg-white">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { v: '12명', l: '추천 회원' },
                { v: '1,850P', l: '적립 포인트' },
                { v: '프리미엄', l: '내 등급' },
              ].map((s) => (
                <div key={s.l} className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-[var(--p-blue)]">{s.v}</div>
                  <div className="text-[11px] text-gray-400 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-400 mb-2">월별 추천 현황</div>
            <div className="flex gap-2">
              {barWidths.map((w, i) => (
                <div key={i} className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--p-blue)] rounded-full" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {months.map((m) => (
                <span key={m} className="text-[10px] text-gray-300">{m}</span>
              ))}
            </div>
            <div className="mt-4 px-4 py-2.5 bg-[var(--p-blue-50)] rounded-lg text-xs text-[var(--p-blue)] font-semibold flex items-center gap-1.5">
              <span>💡</span> 예시 화면입니다. 실제 데이터와 다를 수 있습니다.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   Trust Metrics — 신뢰 지표 카드
   ───────────────────────────────────────── */
function TrustMetrics() {
  const metrics = [
    { icon: '🏆', value: '3종', label: '파트너 등급' },
    { icon: '📈', value: '최대 50%', label: '추천 수익 보상률' },
    { icon: '🛒', value: '100만+', label: '국내 셀러 시장 규모' },
    { icon: '⏰', value: '24시간', label: '수익 발생 가능' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 -mt-4 mb-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="text-center py-5 px-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
          >
            <div className="w-11 h-11 rounded-xl bg-[var(--p-blue-light)] text-[var(--p-blue)] inline-flex items-center justify-center mb-3 text-xl">
              {m.icon}
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              {m.value}
            </div>
            <div className="text-[13px] text-gray-400 mt-1">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Export ─── */
export default function HeroGroup() {
  return (
    <>
      <PartnerHeader />
      <HeroSection />
      <TrustMetrics />
    </>
  );
}

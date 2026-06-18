/* ─────────────────────────────────────────
   그룹 2. 필요성 / 실체
   - 왜 추천하기 쉬운가
   - 가입비가 있는 이유
   - 셀러메이트 실제 서비스 소개
   ───────────────────────────────────────── */

const services = [
  { icon: '💬', name: 'SMS 서비스', desc: '주문/홍보/알림 메시지 운영', bg: 'bg-blue-50', color: 'text-blue-600' },
  { icon: '📸', name: '인스타그램 마케팅', desc: '계정 활성화 및 노출 관리', bg: 'bg-pink-50', color: 'text-pink-600' },
  { icon: '📍', name: '플레이스 상위노출', desc: '지역 검색 노출 관리', bg: 'bg-green-50', color: 'text-green-600' },
  { icon: '🛍️', name: '쇼핑 상위노출', desc: '상품 검색 유입 개선', bg: 'bg-orange-50', color: 'text-orange-600' },
  { icon: '🟠', name: '쿠팡 마케팅', desc: '쿠팡 판매자 노출 지원', bg: 'bg-amber-50', color: 'text-amber-600' },
  { icon: '✍️', name: '블로그 마케팅', desc: '검색 콘텐츠 노출 지원', bg: 'bg-teal-50', color: 'text-teal-600' },
  { icon: '⭐', name: '리뷰 관리', desc: '브랜드 신뢰도 관리', bg: 'bg-yellow-50', color: 'text-yellow-600' },
  { icon: '📊', name: '광고 운영 컨설팅', desc: '업종별 광고 방향 제안', bg: 'bg-indigo-50', color: 'text-indigo-600' },
  { icon: '🔍', name: '마케팅 진단', desc: '현재 홍보 상태 점검', bg: 'bg-purple-50', color: 'text-purple-600' },
  { icon: '📦', name: '도매/상품 연계', desc: '향후 확장 예정', bg: 'bg-gray-50', color: 'text-gray-500', tag: '확장 예정' },
];

const painPoints = [
  { emoji: '🍽️', text: '음식점 · 카페 · 술집' },
  { emoji: '💇', text: '미용실 · 네일 · 뷰티' },
  { emoji: '🛒', text: '스마트스토어 · 쿠팡 셀러' },
  { emoji: '🏪', text: '오프라인 매장 · 학원' },
];

export default function ServiceGroup() {
  return (
    <>
      {/* ── 왜 추천하기 쉬운가 ── */}
      <section className="py-12 md:py-14 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--p-blue-light)] text-[var(--p-blue)] text-[13px] font-semibold mb-4">
            왜 지금 파트너 프로그램인가
          </div>
          <h2 className="text-2xl md:text-[32px] font-bold text-gray-900 tracking-tight leading-snug mb-3">
            주변 사업자 대부분은
            <br className="hidden md:block" />
            <span className="text-[var(--p-blue)]">온라인 마케팅 고민</span>을 가지고 있습니다
          </h2>
          <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-xl mb-8">
            노출, 유입, 리뷰, SNS, 광고 운영 — 어디서 시작해야 할지 모르는 사업자가 대부분입니다.
            파트너는 어려운 마케팅을 직접 운영하는 것이 아니라,
            필요한 사업자를 셀러메이트와 연결하는 역할에 집중할 수 있습니다.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {painPoints.map((p) => (
              <div
                key={p.text}
                className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-shadow"
              >
                <div className="text-2xl mb-2">{p.emoji}</div>
                <div className="text-sm font-semibold text-gray-700">{p.text}</div>
                <div className="text-xs text-gray-400 mt-1">마케팅 고민 보유</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 가입비가 있는 이유 ── */}
      <section className="py-12 md:py-14 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--p-blue-light)] text-[var(--p-blue)] text-[13px] font-semibold mb-4">
              셀러메이트 파트너란
            </div>
            <h2 className="text-2xl md:text-[32px] font-bold text-gray-900 tracking-tight leading-snug mb-4">
              진성 파트너에게 더 집중하기 위한
              <br />
              <span className="text-[var(--p-blue)]">유료 멤버십 구조</span>입니다
            </h2>
            <p className="text-sm md:text-base text-gray-400 leading-relaxed mb-6">
              셀러메이트 파트너 등급은 단순 가입비가 아니라,
              파트너 전용 교육 자료, 추천 링크, 마케팅 소재, 수익 정산 구조,
              파트너 활동 지원을 제공하기 위한 등급형 멤버십입니다.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: '🎓',
                  title: '전용 교육 자료',
                  desc: '파트너 활동에 필요한 마케팅 기초 자료와 영업 가이드를 제공합니다.',
                },
                {
                  icon: '🔗',
                  title: '추천 링크 & 마케팅 소재',
                  desc: '나만의 추천 링크와 홍보용 소재를 제공하여 활동을 지원합니다.',
                },
                {
                  icon: '💰',
                  title: '수익 정산 구조',
                  desc: '추천 보상과 수익 적립이 투명하게 정산되는 시스템을 운영합니다.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-left"
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="text-sm font-bold text-gray-800 mb-1.5">{item.title}</div>
                  <div className="text-[13px] text-gray-400 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 mt-5 leading-relaxed">
              무분별한 가입보다 실제 활동 의지가 있는 파트너에게
              더 명확한 혜택과 운영 지원을 제공하는 구조입니다.
              <br />
              등록비는 <strong className="text-gray-500">1회성 납부</strong>이며 월회비·연회비가 아닙니다.
            </p>
          </div>
        </div>
      </section>

      {/* ── 셀러메이트 실제 서비스 소개 ── */}
      <section id="services" className="py-12 md:py-14 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--p-blue-light)] text-[var(--p-blue)] text-[13px] font-semibold mb-4">
            셀러메이트 서비스
          </div>
          <h2 className="text-2xl md:text-[32px] font-bold text-gray-900 tracking-tight leading-snug mb-3">
            셀러메이트는 <span className="text-[var(--p-blue)]">실제 마케팅 서비스</span>를 제공합니다
          </h2>
          <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-xl mb-8">
            파트너가 추천하는 것은 빈 플랫폼이 아니라,
            실제로 운영되는 온라인 마케팅 서비스입니다.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
            {services.map((s) => (
              <div
                key={s.name}
                className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div
                  className={`w-11 h-11 rounded-xl ${s.bg} ${s.color} inline-flex items-center justify-center mb-2.5 text-xl`}
                >
                  {s.icon}
                </div>
                <div className="text-[13px] font-semibold text-gray-700">{s.name}</div>
                <div className="text-[12px] text-gray-400 mt-1 leading-snug">{s.desc}</div>
                {s.tag && (
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-gray-100 text-[11px] text-gray-400">
                    {s.tag}
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-5 text-center">
            일부 서비스는 향후 연계 가능하거나 확장 예정인 서비스입니다.
            확정 기능과 구분하여 안내드립니다.
          </p>
        </div>
      </section>
    </>
  );
}

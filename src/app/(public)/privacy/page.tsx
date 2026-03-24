import type { Metadata } from 'next';
import Link from 'next/link';
import { Utensils } from 'lucide-react';

export const metadata: Metadata = { title: '개인정보처리방침 | 테이블QR' };

export default function Privacy() {
  return (
    <div className="min-h-[100dvh] bg-zinc-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-900">TableFlow</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-black text-zinc-900 mb-2">개인정보처리방침</h1>
        <p className="text-sm text-zinc-500 mb-10">시행일: 2026년 3월 16일</p>

        <div className="space-y-10 text-zinc-700 text-[15px] leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">제1조 (개인정보의 수집 항목 및 수집 방법)</h2>
            <p className="mb-2">[회사명](이하 "회사")은 TableFlow 서비스(이하 "서비스") 제공을 위해 아래와 같이 개인정보를 수집합니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-semibold">수집 항목:</span> 이메일 주소, 서비스 이용 기록, 접속 로그, 접속 IP 정보</li>
              <li><span className="font-semibold">수집 방법:</span> 서비스 가입 및 이용 과정에서 회사가 직접 계정을 생성하여 제공</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">제2조 (개인정보의 수집 및 이용 목적)</h2>
            <p className="mb-2">회사는 수집한 개인정보를 다음 목적으로 이용합니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>서비스 제공 및 운영 (QR 주문, 대기 접수, POS 관리 기능 제공)</li>
              <li>계정 관리 및 본인 확인</li>
              <li>서비스 개선 및 신규 기능 개발</li>
              <li>고객 문의 응대 및 불만 처리</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">제3조 (개인정보의 보유 및 이용 기간)</h2>
            <p className="mb-2">회사는 서비스 이용 기간 동안 개인정보를 보유하며, 이용 계약 종료 시 지체없이 파기합니다. 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
              <li>접속 로그: 3개월 (통신비밀보호법)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">제4조 (개인정보의 제3자 제공)</h2>
            <p>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 단, 이용자의 동의가 있거나 법령에 의한 경우는 예외로 합니다. 향후 카카오 알림톡 등 외부 서비스 연동 시 별도 고지 후 동의를 받겠습니다.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">제5조 (개인정보의 파기)</h2>
            <p className="mb-2">회사는 개인정보 보유 기간이 경과하거나 처리 목적이 달성된 경우 지체없이 해당 개인정보를 파기합니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-semibold">전자적 파일:</span> 복구 불가능한 방법으로 영구 삭제</li>
              <li><span className="font-semibold">출력물 등 기타:</span> 분쇄기로 분쇄하거나 소각</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">제6조 (이용자의 권리)</h2>
            <p className="mb-2">이용자는 언제든지 아래의 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>개인정보 열람 요청</li>
              <li>개인정보 정정·삭제 요청</li>
              <li>개인정보 처리 정지 요청</li>
            </ul>
            <p className="mt-2">권리 행사는 아래 개인정보보호책임자에게 이메일로 요청하실 수 있으며, 회사는 지체없이 조치하겠습니다.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">제7조 (개인정보보호책임자)</h2>
            <p className="mb-2">회사는 개인정보 처리에 관한 업무를 총괄하고, 관련 불만 처리 및 피해 구제를 담당하는 개인정보보호책임자를 다음과 같이 지정합니다.</p>
            <div className="bg-zinc-100 rounded-xl px-5 py-4 space-y-1">
              <p><span className="font-semibold">성명:</span> [담당자명]</p>
              <p><span className="font-semibold">이메일:</span> <a href="mailto:privacy@tableflow.com" className="text-orange-600 hover:underline">privacy@tableflow.com</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">제8조 (개인정보처리방침의 변경)</h2>
            <p>이 방침은 법령 또는 서비스 변경에 따라 개정될 수 있으며, 변경 시 서비스 내 공지사항을 통해 안내합니다.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200">
          <Link href="/" className="text-sm font-semibold text-orange-600 hover:underline">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}

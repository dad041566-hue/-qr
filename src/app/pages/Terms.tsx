import { Link } from 'react-router';
import { Utensils } from 'lucide-react';

export function Terms() {
  return (
    <div className="min-h-[100dvh] bg-zinc-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-900">TableFlow</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-black text-zinc-900 mb-2">이용약관</h1>
        <p className="text-sm text-zinc-500 mb-10">시행일: 2026년 3월 16일</p>

        <div className="space-y-10 text-zinc-700 text-[15px] leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">제1조 (목적)</h2>
            <p>이 약관은 [회사명](이하 "회사")이 제공하는 TableFlow 서비스(이하 "서비스")의 이용 조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">제2조 (서비스 내용)</h2>
            <p className="mb-2">회사는 다음과 같은 서비스를 제공합니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-semibold">QR 스마트 주문:</span> 고객이 테이블 QR 코드를 통해 앱 설치 없이 메뉴를 주문하는 기능</li>
              <li><span className="font-semibold">대기 접수 시스템:</span> 매장 입구에서 고객 대기 순번을 등록하고 관리하는 키오스크 기능</li>
              <li><span className="font-semibold">POS 관리 대시보드:</span> 주문 현황, 매출 통계, 메뉴 관리, 테이블 현황을 통합 관리하는 어드민 기능</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">제3조 (이용 계약 체결)</h2>
            <p className="mb-2">서비스 이용 계약은 다음과 같이 체결됩니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>서비스 계정은 이용자가 자가 가입하는 방식이 아니라, 회사가 직접 생성하여 이용자에게 제공합니다.</li>
              <li>계정 발급은 회사와 이용자 간 별도 계약 또는 도입 협의를 통해 이루어집니다.</li>
              <li>계정을 제공받은 시점에 이용 계약이 체결된 것으로 간주합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">제4조 (서비스 이용)</h2>
            <p className="mb-2">서비스 이용에 관한 사항은 다음과 같습니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>서비스 이용 기간은 계약 시 별도로 정한 기간을 따릅니다.</li>
              <li>이용 기간이 만료된 경우 서비스 접근이 제한되며, 데이터는 만료일로부터 30일 이내에 파기될 수 있습니다.</li>
              <li>이용 기간 연장은 회사와의 별도 협의를 통해 가능합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">제5조 (이용자의 의무)</h2>
            <p className="mb-2">이용자는 다음 사항을 준수해야 합니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>계정 및 비밀번호의 관리 책임은 이용자 본인에게 있습니다.</li>
              <li>계정을 제3자에게 양도·대여하거나 공유해서는 안 됩니다.</li>
              <li>서비스를 이용하여 타인의 권리를 침해하거나 법령을 위반하는 행위를 해서는 안 됩니다.</li>
              <li>서비스의 정상적인 운영을 방해하는 행위를 해서는 안 됩니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">제6조 (서비스 제공의 중단)</h2>
            <p className="mb-2">회사는 다음의 경우 서비스 제공을 일시적으로 중단할 수 있습니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>시스템 점검, 교체, 고장 수리 등 운영상의 사유</li>
              <li>천재지변, 전쟁, 테러, 해킹 등 불가항력적 사유</li>
              <li>기간통신사업자의 서비스 중단</li>
            </ul>
            <p className="mt-2">서비스 중단이 예정된 경우 사전에 공지하며, 불가피한 경우 사후 공지할 수 있습니다.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">제7조 (면책 조항)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>회사는 천재지변 또는 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
              <li>회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</li>
              <li>회사는 이용자가 서비스를 통해 획득한 정보의 정확성·신뢰성에 대해 보증하지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">제8조 (분쟁 해결)</h2>
            <p>이 약관과 관련하여 분쟁이 발생할 경우, 대한민국 법률을 준거법으로 하며 회사의 본사 소재지를 관할하는 법원을 합의 관할 법원으로 합니다.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">부칙</h2>
            <p>이 약관은 2026년 3월 16일부터 시행합니다.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200">
          <Link to="/" className="text-sm font-semibold text-orange-600 hover:underline">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}

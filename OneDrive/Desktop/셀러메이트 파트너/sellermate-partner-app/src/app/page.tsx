import HeroGroup from './_components/HeroGroup';
import ServiceGroup from './_components/ServiceGroup';
import RevenueGroup from './_components/RevenueGroup';
import CalculatorGroup from './_components/CalculatorGroup';
import FaqAndCtaGroup from './_components/FaqAndCtaGroup';

export default function PartnerPage() {
  return (
    <main className="flex-1">
      {/* 그룹 1. 첫인상 / 신뢰 */}
      <HeroGroup />

      {/* 그룹 2. 필요성 / 실체 */}
      <ServiceGroup />

      {/* 그룹 3. 수익 구조 */}
      <RevenueGroup />

      {/* 그룹 4. 체험 / 설득 */}
      <CalculatorGroup />

      {/* 그룹 5. 시스템 / 마무리 */}
      <FaqAndCtaGroup />
    </main>
  );
}

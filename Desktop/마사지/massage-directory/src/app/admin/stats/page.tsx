import { Metadata } from 'next';
import { BarChart2, TrendingUp } from 'lucide-react';

export const metadata: Metadata = { title: '통계 | 관리자' };

export default function AdminStatsPage() {
  const stats = [
    { label: '오늘 방문자', value: '1,247', change: '+12%', positive: true },
    { label: '이번 달 방문자', value: '38,592', change: '+8%', positive: true },
    { label: '총 페이지뷰', value: '142,830', change: '+21%', positive: true },
    { label: '당일 회원가입', value: '45명', change: '-4%', positive: false },
  ];

  const topShops = [
    { name: '강남 힐링스파', views: 3240, region: '서울' },
    { name: '부산 타이마사지', views: 2810, region: '부산' },
    { name: '홍대 아로마테라피', views: 2540, region: '서울' },
    { name: '제주 쉼표 마사지', views: 1960, region: '제주' },
    { name: '인천 딥티슈 센터', views: 1340, region: '인천' },
  ];

  return (
    <div className="max-w-[1000px] space-y-4">
      <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-red-600" /> 통계 보고서
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded p-4 text-center">
            <p className="text-[11px] text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-black text-gray-800">{s.value}</p>
            <p className={`text-[10px] mt-1 font-bold ${s.positive ? 'text-green-500' : 'text-red-500'}`}>
              전월 대비 {s.change}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded p-4">
        <h2 className="text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-blue-500" /> 인기 조회 업소 TOP 5
        </h2>
        <div className="space-y-3">
          {topShops.map((shop, idx) => (
            <div key={shop.name} className="flex items-center gap-3">
              <span className="w-5 text-center text-xs font-bold text-gray-400">{idx + 1}</span>
              <div className="flex-1">
                <div className="flex justify-between mb-1 text-[11px]">
                  <span className="font-bold text-gray-700">{shop.name} <span className="font-normal text-gray-400 ml-1">({shop.region})</span></span>
                  <span className="text-gray-500">{shop.views.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${(shop.views / topShops[0].views) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

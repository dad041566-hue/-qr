'use client';

import { useState } from 'react';
import { Crown, Save, Info, ArrowUp, ArrowDown } from 'lucide-react';
import { MOCK_SHOPS } from '@/lib/mockData';
import { Shop } from '@/lib/types';
import clsx from 'clsx';

export default function AdminPremiumPage() {
  const [premiumShops, setPremiumShops] = useState<Shop[]>(
    MOCK_SHOPS.filter(s => s.isPremium).sort((a, b) => (a.premiumOrder ?? 0) - (b.premiumOrder ?? 0))
  );
  const [allShops] = useState<Shop[]>(MOCK_SHOPS.filter(s => !s.isPremium));

  const moveItem = (idx: number, dir: -1 | 1) => {
    if (idx + dir < 0 || idx + dir >= premiumShops.length) return;
    const newItems = [...premiumShops];
    const temp = newItems[idx];
    newItems[idx] = newItems[idx + dir];
    newItems[idx + dir] = temp;
    setPremiumShops(newItems.map((s, i) => ({ ...s, premiumOrder: i + 1 })));
  };

  const removePremium = (id: string) => {
    setPremiumShops(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, premiumOrder: i + 1 })));
  };

  const addPremium = (id: string) => {
    const shop = allShops.find(s => s.id === id);
    if (!shop) return;
    setPremiumShops(prev => [...prev, { ...shop, isPremium: true, premiumOrder: prev.length + 1 }]);
  };

  return (
    <div className="max-w-[700px] space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" /> 프리미엄 배너 관리
        </h1>
        <button className="flex items-center gap-1 bg-red-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-700">
          <Save className="w-4 h-4" /> 저장
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs p-3 rounded flex items-start gap-1.5">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>메인 화면 우측 사이드바와 상단에 노출되는 프리미엄 업소 순서를 관리합니다. 위아래 화살표를 눌러 순서를 변경하세요.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded">
        <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-600">현재 적용된 배너 ({premiumShops.length})</span>
        </div>
        <div className="divide-y divide-gray-100">
          {premiumShops.map((shop, idx) => (
            <div key={shop.id} className="p-3 flex items-center gap-3">
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="p-0.5 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowUp className="w-4 h-4"/></button>
                <div className="w-5 text-center text-[10px] font-bold text-amber-500 bg-amber-50 rounded">{idx + 1}</div>
                <button onClick={() => moveItem(idx, 1)} disabled={idx === premiumShops.length - 1} className="p-0.5 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowDown className="w-4 h-4"/></button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 line-clamp-1">{shop.name}</p>
                <p className="text-[11px] text-gray-500">{shop.regionLabel} · {shop.themeLabel}</p>
              </div>
              <button onClick={() => removePremium(shop.id)} className="px-2.5 py-1 bg-gray-100 border border-gray-300 text-gray-600 text-[11px] rounded hover:bg-gray-200 shrink-0">
                제거
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded">
        <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50">
          <span className="text-xs font-bold text-gray-600">일반 업소 목록</span>
        </div>
        <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
          {allShops.filter(s => !premiumShops.find(p => p.id === s.id)).map(shop => (
            <div key={shop.id} className="p-2.5 flex items-center justify-between px-4 hover:bg-gray-50 text-sm">
              <div>
                <span className="font-semibold text-gray-800">{shop.name}</span>
                <span className="text-[11px] text-gray-500 ml-2">{shop.regionLabel}</span>
              </div>
              <button onClick={() => addPremium(shop.id)} className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded text-[11px] font-bold hover:bg-amber-100">
                + 추가
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

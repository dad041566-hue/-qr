'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Crown, Shuffle, RefreshCw, Star, MapPin, Phone } from 'lucide-react';
import { MOCK_SHOPS } from '@/lib/mockData';
import { shuffleRegularShops, filterShops, formatRating } from '@/lib/utils';
import { Shop, REGIONS, THEMES, DISTRICTS } from '@/lib/types';
import ShopCard from '@/components/ShopCard';
import Sidebar from '@/components/Sidebar';

function HomeContent() {
  const searchParams = useSearchParams();
  const selectedRegion = searchParams.get('region') ?? 'all';
  const selectedSubRegion = searchParams.get('subRegion') ?? 'all';
  const selectedTheme = searchParams.get('theme') ?? 'all';
  const searchQuery = searchParams.get('q') ?? '';

  const [shuffledShops, setShuffledShops] = useState<Shop[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

  const doShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
      const filtered = filterShops(MOCK_SHOPS, selectedRegion, selectedSubRegion, selectedTheme, searchQuery);
      setShuffledShops(shuffleRegularShops(filtered));
      setIsShuffling(false);
    }, 200);
  };

  useEffect(() => { doShuffle(); }, [selectedRegion, selectedSubRegion, selectedTheme, searchQuery]);

  const premiumShops = shuffledShops.filter(s => s.isPremium);
  const regularShops = shuffledShops.filter(s => !s.isPremium);

  // 현재 필터 라벨
  const regionLabel = REGIONS.find(r => r.code === selectedRegion)?.label ?? '전체';
  const subRegionLabel = selectedRegion !== 'all' && selectedSubRegion !== 'all' 
    ? (DISTRICTS[selectedRegion]?.find(d => d.code === selectedSubRegion)?.label ?? '')
    : '';
  const themeLabel = THEMES.find(t => t.code === selectedTheme)?.label;

  return (
    <div className="max-w-[1400px] mx-auto px-3 py-3">
      <div className="flex gap-3">
        {/* ===== 좌측 사이드바 (LNB) ===== */}
        <Sidebar />

        {/* ===== 메인 콘텐츠 ===== */}
        <div className="flex-1 min-w-0">

          {/* 상단 광고 띠배너 */}
          <div className="bg-gradient-to-r from-red-600 to-rose-500 rounded mb-3 p-3 flex items-center justify-between text-white">
            <div>
              <p className="font-black text-sm">
                🔥 {regionLabel} {subRegionLabel} 주간 인기 업소 모음
                {themeLabel && ` · ${themeLabel}`}
              </p>
              <p className="text-[11px] text-white/80 mt-0.5">
                전국 {MOCK_SHOPS.length}개+ 제휴업소 | 매일 업데이트
              </p>
            </div>
            <button
              onClick={doShuffle}
              disabled={isShuffling}
              className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isShuffling ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>

          {/* 모바일 필터 칩 */}
          <div className="md:hidden flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            <Link href="/" className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${!searchParams.get('region') && !searchParams.get('theme') ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 text-gray-600 bg-white'}`}>전체</Link>
            {REGIONS.filter(r => r.code !== 'all').map(r => (
              <Link key={r.code} href={`/?region=${r.code}`}
                className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${selectedRegion === r.code ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 text-gray-600 bg-white'}`}>{r.label}</Link>
            ))}
          </div>

          {/* ===== 프리미엄 업소 영역 ===== */}
          {premiumShops.length > 0 && (
            <div className="premium-box mb-3 p-2.5">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-amber-700">PREMIUM 추천업소</span>
                <div className="flex-1 h-px bg-amber-200" />
                <span className="text-[10px] text-amber-500">광고</span>
              </div>

              {/* 프리미엄 가로형 배너 (큰 사이즈) */}
              <div className="space-y-2">
                {premiumShops.map(shop => (
                  <Link
                    key={shop.id}
                    href={`/shop/${shop.slug}`}
                    className="banner-item flex bg-white border border-amber-200 rounded overflow-hidden hover:border-red-500"
                  >
                    {/* 썸네일 */}
                    <div className="w-24 sm:w-32 shrink-0 bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center">
                      <span className="text-3xl opacity-60">
                        {({'swedish':'🌿','aroma':'🌸','thai':'🙏','sport':'💪','deep':'🔥','hot_stone':'💎','foot':'🦶','couple':'👫'})[shop.theme] ?? '✨'}
                      </span>
                    </div>
                    {/* 정보 */}
                    <div className="flex-1 p-2 sm:p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">AD</span>
                            <h3 className="text-sm font-bold text-gray-900 truncate">{shop.name}</h3>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1">{shop.tagline}</p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-bold text-gray-700">{formatRating(shop.rating)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-red-500" />{shop.regionLabel}
                        </span>
                        <span>#{shop.themeLabel}</span>
                        <span>{shop.hours}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex gap-1 flex-wrap">
                          {shop.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{tag}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          {shop.courses[0] && (
                            <span className="text-xs font-bold text-red-600">{shop.courses[0].price}~</span>
                          )}
                          <span className="hidden sm:flex items-center gap-0.5 text-[10px] text-blue-600">
                            <Phone className="w-3 h-3" />{shop.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ===== 일반 업소 그리드 ===== */}
          <div className="bg-white border border-gray-200 rounded p-2.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-gray-800">
                  📋 전체업소
                  {regionLabel !== '전체' && ` · ${regionLabel} ${subRegionLabel}`}
                  {themeLabel && ` · ${themeLabel}`}
                </span>
                <span className="text-[10px] text-gray-400">({regularShops.length}개)</span>
              </div>
              <button
                onClick={doShuffle}
                disabled={isShuffling}
                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <Shuffle className={`w-3 h-3 ${isShuffling ? 'animate-spin' : ''}`} />
                랜덤
              </button>
            </div>

            {regularShops.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                해당 조건의 업소가 없습니다.
              </div>
            ) : (
              <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 transition-opacity duration-200 ${
                isShuffling ? 'opacity-30' : 'opacity-100'
              }`}>
                {regularShops.map(shop => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            )}
          </div>

          {/* 하단 광고 띠배너 */}
          <div className="mt-3 ad-slot h-[80px] rounded">
            <span>하단 광고 배너 영역 (풀폭 728×80)</span>
          </div>

        </div>

        {/* ===== 우측 광고 사이드바 (PC only, 넓은 화면) ===== */}
        <aside className="hidden lg:block w-[160px] shrink-0 space-y-3">
          <div className="sticky top-[110px] space-y-3">
            <div className="ad-slot h-[250px] rounded">
              <div className="text-center">
                <div className="text-xl mb-1">📢</div>
                <span>광고 배너</span><br/>
                <span className="text-[10px]">160×250</span>
              </div>
            </div>
            <div className="ad-slot h-[250px] rounded">
              <div className="text-center">
                <div className="text-xl mb-1">🎯</div>
                <span>광고 배너</span><br/>
                <span className="text-[10px]">160×250</span>
              </div>
            </div>
            <div className="ad-slot h-[120px] rounded">
              <div className="text-center">
                <div className="text-lg mb-0.5">💬</div>
                <span>제휴문의</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <HomeContent />
    </Suspense>
  );
}

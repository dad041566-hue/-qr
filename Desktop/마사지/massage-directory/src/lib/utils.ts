import { Shop } from './types';

/**
 * 일반 업소 목록을 랜덤으로 섞는 함수
 * 프리미엄 업소는 순서 유지, 일반 업소만 셔플
 */
export function shuffleRegularShops(shops: Shop[]): Shop[] {
  const premium = shops
    .filter(s => s.isPremium)
    .sort((a, b) => (a.premiumOrder ?? 0) - (b.premiumOrder ?? 0));
  
  const regular = shops.filter(s => !s.isPremium);
  
  // Fisher-Yates 셔플
  for (let i = regular.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [regular[i], regular[j]] = [regular[j], regular[i]];
  }
  
  return [...premium, ...regular];
}

/**
 * 지역 및 테마 필터 적용
 */
export function filterShops(
  shops: Shop[],
  region: string,
  subRegion: string,
  theme: string,
  query: string,
): Shop[] {
  return shops.filter(s => {
    if (!s.isVisible) return false;
    if (region !== 'all' && region !== '' && s.region !== region) return false;
    if (subRegion !== 'all' && subRegion !== '' && s.subRegion !== subRegion) return false;
    if (theme !== 'all' && theme !== '' && s.theme !== theme) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.regionLabel.includes(query) ||
        (s.subRegionLabel && s.subRegionLabel.includes(query)) ||
        s.themeLabel.includes(query) ||
        s.tagline.toLowerCase().includes(q) ||
        s.tags.some(t => t.includes(query))
      );
    }
    return true;
  });
}

/**
 * 평점 별 렌더링 헬퍼
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * 날짜 포맷
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

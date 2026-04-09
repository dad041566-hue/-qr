// ===== 업소(Shop) 관련 타입 =====
export interface Shop {
  id: string;
  name: string;              // 업소명
  slug: string;              // URL slug
  region: string;            // 지역 코드 (seoul, gyeonggi, etc.)
  regionLabel: string;       // 지역 한글명
  subRegion?: string;        // 지역구 코드 (gangnam, seocho, etc.)
  subRegionLabel?: string;   // 지역구 한글명 
  theme: string;             // 테마 코드
  themeLabel: string;        // 테마 한글명
  isPremium: boolean;        // 프리미엄(고정 상단) 여부
  premiumOrder?: number;     // 프리미엄 순서
  thumbnailUrl: string;      // 썸네일 이미지
  bannerUrl: string;         // 상세 배너 이미지
  images: string[];          // 갤러리 이미지
  tagline: string;           // 짧은 소개 문구
  description: string;       // 상세 소개
  address: string;           // 주소
  phone: string;             // 전화번호
  hours: string;             // 영업시간
  rating: number;            // 평점 (0~5)
  reviewCount: number;       // 후기 수
  courses: Course[];         // 코스/요금표
  tags: string[];            // 태그
  isVisible: boolean;        // 노출 여부 (어드민 제어)
  ownerId?: string;          // 제휴업체 관리자 계정 ID
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  name: string;
  duration: string;
  price: string;
  description?: string;
}

// ===== 후기(Review) =====
export interface Review {
  id: string;
  shopId: string;
  shopName: string;
  authorName: string;
  rating: number;
  content: string;
  createdAt: string;
}

// ===== 공지사항(Notice) =====
export interface Notice {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

// ===== Q&A =====
export interface QnA {
  id: string;
  shopId?: string;
  question: string;
  answer?: string;
  authorName: string;
  isAnswered: boolean;
  createdAt: string;
}

// ===== 사용자(User) =====
export type UserRole = 'super_admin' | 'shop_admin' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  managedShopId?: string;  // shop_admin인 경우 담당 업소 ID
}

// ===== 지역/테마 목록 =====
export const REGIONS = [
  { code: 'all', label: '전체' },
  { code: 'seoul', label: '서울' },
  { code: 'gyeonggi', label: '경기' },
  { code: 'incheon', label: '인천' },
  { code: 'busan', label: '부산' },
  { code: 'daejeon', label: '대전' },
  { code: 'daegu', label: '대구' },
  { code: 'gwangju', label: '광주' },
  { code: 'ulsan', label: '울산' },
  { code: 'jeju', label: '제주' },
] as const;

export const DISTRICTS: Record<string, { code: string; label: string }[]> = {
  seoul: [
    { code: 'all', label: '전체' },
    { code: 'gangnam', label: '강남구' },
    { code: 'seocho', label: '서초구' },
    { code: 'songpa', label: '송파구' },
    { code: 'mapo', label: '마포구' },
    { code: 'yeouido', label: '영등포/여의도' },
    { code: 'jongno', label: '종로/중구' },
    { code: 'gwanak', label: '관악/동작' },
  ],
  gyeonggi: [
    { code: 'all', label: '전체' },
    { code: 'suwon', label: '수원시' },
    { code: 'seongnam', label: '성남/분당' },
    { code: 'yongin', label: '용인시' },
    { code: 'goyang', label: '고양/일산' },
    { code: 'bucheon', label: '부천시' },
  ],
  busan: [
    { code: 'all', label: '전체' },
    { code: 'haeundae', label: '해운대구' },
    { code: 'busanjin', label: '부산진구(서면)' },
    { code: 'dongnae', label: '동래구' },
  ],
  incheon: [
    { code: 'all', label: '전체' },
    { code: 'bupyeong', label: '부평구' },
    { code: 'yeonsu', label: '연수구(송도)' },
    { code: 'namdong', label: '남동구(구월)' },
  ],
};

export const THEMES = [
  { code: 'all', label: '전체' },
  { code: 'swedish', label: '스웨디시' },
  { code: 'aroma', label: '아로마' },
  { code: 'thai', label: '타이' },
  { code: 'sport', label: '스포츠' },
  { code: 'deep', label: '딥티슈' },
  { code: 'hot_stone', label: '핫스톤' },
  { code: 'foot', label: '발마사지' },
  { code: 'couple', label: '커플' },
] as const;

export type RegionCode = typeof REGIONS[number]['code'];
export type ThemeCode = typeof THEMES[number]['code'];

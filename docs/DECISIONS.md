# 결정 로그 (Decision Log)

> 결정 완료 시 `[ ]` → `[x]` 로 변경

---

## ✅ 확정 결정

### 1. 백엔드 전략
- [x] **Supabase 올인원** — Auth + DB + Realtime + Storage + RLS 멀티테넌트 격리

### 2. 운영 모델
- [x] **개발사 관리형** (Self-service SaaS 아님)
  - 개발사가 슈퍼어드민 패널에서 매장·계정·이용기간 직접 관리
  - 점주 자가 가입 없음
  - 결제/구독 코드 없음 — 계약은 오프라인, 시스템은 기간 만료 여부로만 접근 제어

### 3. 인증 방식
- [x] **이메일+비번만** — 카카오 소셜 로그인 제거
- [x] 계정 생성 주체:
  - 점주 계정 → 개발사(슈퍼어드민)가 생성
  - 직원 계정 → 점주가 어드민 대시보드에서 생성
- [x] 첫 로그인 시 임시비번 강제 변경 (`is_first_login` 플래그)

### 4. 이용 기간 관리
- [x] `stores` 테이블에 `subscription_start`, `subscription_end`, `is_active` 컬럼 추가
- [x] 만료 또는 `is_active=false` 시 `/admin`, `/m/:storeSlug/:tableId` 접근 차단
- [x] 슈퍼어드민은 기간/상태 무관 항상 접근 가능

### 5. 슈퍼어드민
- [x] `/superadmin` 라우트 — 개발사 전용 패널
- [x] 기능: 매장 CRUD, 점주 계정 생성, 이용기간 설정, 강제 정지
- [x] 슈퍼어드민 식별: 환경변수 화이트리스트 방식 (단순, 별도 role 불필요)
  ```
  VITE_SUPERADMIN_EMAILS=admin@tableflow.com,ops@tableflow.com
  ```

### 6. 배포 인프라
- [x] 프론트: **Vercel** (React SPA)
- [x] DB/Auth/Realtime/Edge Function: **Supabase**
- [x] 커스텀 백엔드 API: **AWS Lambda** (필요 시)
- [x] 도메인: `tableflow.com`

### 7. URL 구조
- [x] `/m/:storeSlug/:tableId` — 고객 QR 주문
- [x] `/admin` — 점주 어드민
- [x] `/waiting` — 대기 키오스크
- [x] `/login` — 이메일+비번 로그인
- [x] `/superadmin` — 개발사 관리 패널 (신규)

### 8. 실시간
- [x] **Supabase Realtime** (postgres_changes) — 주문·테이블·대기 구독

### 9. 이미지
- [x] **Supabase Storage** (`menu-images` 버킷, public read)

### 10. 다국어
- [x] **한국어만** — 영어 추후

### 11. QR 코드
- [x] 테이블별 QR 일괄 생성
- [x] 출력 없음 — 화면에서 이미지 저장

---

## ⬜ 미결 사항 (Phase 2 이후)

### 카카오 알림톡
- [ ] 대기·주문 알림톡 — 카카오 비즈채널 등록 필요 (1~2주 심사)
- [ ] `send-alimtalk` Supabase Edge Function 구현

### 모바일 앱
- [ ] PWA vs React Native 네이티브 앱

### 프린터 연동
- [ ] 영수증 프린터 (스타, 엡손) Phase 2 포함 여부

### 다점포
- [ ] 프랜차이즈 통합 대시보드 스펙

### 법적 페이지
- [ ] 개인정보처리방침 / 이용약관

### 운영
- [ ] 계정 삭제 정책 (매장 해지 시 데이터 처리)
- [ ] 주문 데이터 CSV 내보내기

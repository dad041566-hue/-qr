# Git Worktree 병렬 에이전트 작업 계획

> 베이스 브랜치: `main`
> 작업 루트: `D:\Project\-qr`
> 워크트리 루트: `D:\Project\-qr-worktrees\`

---

## 전체 작업 흐름

```
main (기준)
 │
 ├─[Wave 1: 병렬]──────────────────────────────────────────┐
 │   feat/infra-setup                                       │
 │   feat/auth                                              │
 │                                                          │
 ├─[Wave 2: Wave 1 머지 후 병렬]──────────────────────────┤
 │   feat/customer-menu-api                                 │
 │   feat/admin-realtime                                    │
 │   feat/waiting-api                                       │
 │                                                          │
 └─[Wave 3: Wave 2 머지 후]────────────────────────────────┘
     feat/onboarding
     feat/alimtalk
```

---

## Wave 1 — 인프라 & 인증 (동시 착수 가능)

> 두 브랜치 모두 Main 기준이며 서로 의존성 없음 → **완전 병렬**

### `feat/infra-setup`

**담당 에이전트:** `executor` (sonnet)
**예상 소요:** 3~4일

**작업 범위:**
- Supabase 프로젝트 연동 (환경변수 설정)
- `docs/schema.sql` 기반 마이그레이션 파일 작성
- RLS 정책 적용
- Supabase Storage 버킷 생성 (menu-images)
- `.env.example` 작성

**산출물:**
```
supabase/
  migrations/
    001_initial_schema.sql
    002_rls_policies.sql
    003_indexes.sql
    004_functions.sql   ← next_queue_number()
  seed.sql              ← 개발용 샘플 데이터
.env.example
```

**완료 조건:**
- [ ] `supabase db push` 오류 없이 통과
- [ ] RLS 정책 테스트 (직원 격리, anon INSERT 검증)
- [ ] Storage 버킷 public read 설정 완료

---

### `feat/auth`

**담당 에이전트:** `executor` (sonnet)
**예상 소요:** 3~4일
**선행 조건:** 없음 (Supabase 클라이언트 초기화 코드만 필요)

**작업 범위:**
- Supabase 클라이언트 설정 (`src/lib/supabase.ts`)
- 카카오 소셜 로그인 (점주)
- 이메일+비번 로그인 (직원)
- 세션 관리 (AuthContext)
- 점주 대시보드에서 직원 계정 생성 UI
  - 아이디 + 임시 비밀번호 발급
  - 화면 표시 후 복사
  - 첫 로그인 강제 비밀번호 변경
- Protected Route 구성 (역할별 접근 제어)

**산출물:**
```
src/
  lib/
    supabase.ts
  contexts/
    AuthContext.tsx
  hooks/
    useAuth.ts
  app/pages/
    Login.tsx
    ChangePassword.tsx   ← 직원 첫 로그인용
  app/components/
    ProtectedRoute.tsx
```

**완료 조건:**
- [ ] 카카오 로그인 → 대시보드 리다이렉트
- [ ] 직원 계정 생성 → 임시 비번 화면 복사
- [ ] 직원 로그인 → 비번 변경 강제
- [ ] owner/manager/staff 페이지 접근 제어 동작

---

## Wave 2 — 핵심 기능 (Wave 1 완료 후 병렬)

> `feat/infra-setup` + `feat/auth` 머지 완료 후 3개 브랜치 동시 진행

### `feat/customer-menu-api`

**담당 에이전트:** `executor` (sonnet)
**예상 소요:** 3일

**작업 범위:**
- `CustomerMenu.tsx` Mock 데이터 → Supabase API 연동
- URL: `/m/:storeSlug/:tableId` (QR 토큰 기반)
- 메뉴 카테고리 · 아이템 · 옵션 조회
- 주문 제출 (`orders` + `order_items` INSERT)
- 주문 상태 실시간 구독 (Supabase Realtime)

**산출물:**
```
src/
  lib/
    api/
      menu.ts      ← 메뉴 조회
      order.ts     ← 주문 제출
  hooks/
    useMenu.ts
    useOrder.ts
    useOrderStatus.ts   ← Realtime 구독
```

**완료 조건:**
- [ ] QR URL → 매장/테이블 자동 인식
- [ ] 메뉴 실제 DB 데이터 표시
- [ ] 주문 제출 → orders 테이블 저장
- [ ] 주문 상태 변경 시 고객 화면 실시간 업데이트

---

### `feat/admin-realtime`

**담당 에이전트:** `executor` (sonnet)
**예상 소요:** 4일

**작업 범위:**
- `AdminDashboard.tsx` Mock 데이터 → Supabase API 연동
- 실시간 주문 목록 (Supabase Realtime)
- 주문 상태 변경 (confirmed → preparing → ready → served)
- 테이블 현황 조회 및 상태 변경
- 메뉴 CRUD (카테고리, 아이템, 옵션)
- 메뉴 이미지 업로드 (Supabase Storage, 모바일 카메라/갤러리)
- 매출 차트 (Recharts → 실제 orders 데이터)
- 직원 관리 UI (owner 전용)

**산출물:**
```
src/
  lib/
    api/
      admin.ts       ← 주문/테이블/매출
      menuAdmin.ts   ← 메뉴 CRUD
      staff.ts       ← 직원 관리
  hooks/
    useOrders.ts         ← Realtime 구독
    useRealtimeTables.ts
    useMenuAdmin.ts
    useImageUpload.ts    ← Storage 업로드
```

**완료 조건:**
- [ ] 신규 주문 → 대시보드 실시간 알림 (1초 이내)
- [ ] 주문 상태 변경 → DB 반영
- [ ] 메뉴 이미지 모바일 업로드 동작
- [ ] 매출 차트 실제 데이터 표시

---

### `feat/waiting-api`

**담당 에이전트:** `executor` (sonnet)
**예상 소요:** 3일

**작업 범위:**
- `Waiting.tsx` Mock → Supabase API 연동
- 대기 등록 (`next_queue_number()` 함수 호출)
- 대기 현황 실시간 조회 (내 앞 대기 수)
- 대시보드 웨이팅 탭 연동
  - 대기 목록, 호출, 착석, 완료, no_show 처리
  - 테이블 자동 배정 쿼리 (capacity 기반)

**산출물:**
```
src/
  lib/
    api/
      waiting.ts
  hooks/
    useWaiting.ts
    useWaitingQueue.ts   ← Realtime 구독
```

**완료 조건:**
- [ ] 대기 등록 → queue_number 자동 채번
- [ ] 대기 호출 → 상태 called 변경
- [ ] 테이블 자동 배정 동작 (capacity >= party_size)
- [ ] 대시보드 웨이팅 탭 실시간 동기화

---

## Wave 3 — 부가 기능 (Wave 2 완료 후)

### `feat/alimtalk`

**담당 에이전트:** `executor` (sonnet)
**예상 소요:** 3일

**작업 범위:**
- Supabase Edge Function 작성 (알림톡 발송)
- `platform_alimtalk_templates` 기반 템플릿 변수 치환
- 트리거 이벤트: 주문 접수, 대기 등록, 호출, 취소
- `waiting_notifications` 로그 저장
- 발송 실패 시 재시도 로직

**산출물:**
```
supabase/
  functions/
    send-alimtalk/
      index.ts
```

---

### `feat/onboarding`

**담당 에이전트:** `executor` (sonnet)
**예상 소요:** 2일

**작업 범위:**
- 카카오 로그인 후 최초 매장 생성 플로우
  - 매장명 · 슬러그 입력
  - `stores` + `store_settings` + `store_queue_sequences` 자동 생성
  - `store_members` owner 등록
- 테이블 일괄 생성 (테이블 수 입력 → qr_token 자동 생성)
- QR 이미지 화면 표시 (출력 없음, 저장만)

**완료 조건:**
- [ ] 신규 가입 → 매장 생성 → 대시보드 진입
- [ ] 테이블 수 입력 → QR 일괄 생성
- [ ] QR 이미지 화면에서 저장 가능

---

## Worktree 명령어

```bash
# Wave 1 시작
git worktree add ../qr-infra-setup feat/infra-setup
git worktree add ../qr-auth feat/auth

# Wave 2 시작 (Wave 1 머지 후)
git worktree add ../qr-customer-menu feat/customer-menu-api
git worktree add ../qr-admin feat/admin-realtime
git worktree add ../qr-waiting feat/waiting-api

# Wave 3
git worktree add ../qr-alimtalk feat/alimtalk
git worktree add ../qr-onboarding feat/onboarding

# 목록 확인
git worktree list

# 완료 후 정리
git worktree remove ../qr-infra-setup
```

---

## 머지 순서 & 규칙

```
Wave 1 완료
  feat/infra-setup → main (PR #1)
  feat/auth        → main (PR #2)

Wave 2 완료 (순서 무관)
  feat/customer-menu-api → main (PR #3)
  feat/admin-realtime    → main (PR #4)
  feat/waiting-api       → main (PR #5)

Wave 3 완료
  feat/alimtalk    → main (PR #6)
  feat/onboarding  → main (PR #7)
```

**머지 규칙:**
- PR 단위로 에이전트가 작업 완료 확인 후 제출
- 충돌 시 `feat/*` 브랜치에서 `main` rebase 후 재작업
- 각 Wave 내 브랜치끼리는 공유 파일 최소화 (충돌 방지)

---

## 공유 파일 충돌 주의 구역

Wave 2 병렬 작업 시 아래 파일은 **에이전트 간 동시 수정 금지:**

| 파일 | 수정 담당 | 나머지 에이전트 처리 |
|------|---------|-----------------|
| `src/app/routes.tsx` | `feat/onboarding` | 라우트 추가 필요 시 Wave 3 까지 대기 |
| `src/lib/supabase.ts` | `feat/auth` (Wave 1) | Wave 2는 읽기만 |
| `src/contexts/AuthContext.tsx` | `feat/auth` (Wave 1) | Wave 2는 import만 |

---

## 환경변수 구조

각 worktree는 동일한 `.env.local` 공유 (심볼릭 링크 또는 복사):

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_KAKAO_CLIENT_ID=
SUPABASE_SERVICE_ROLE_KEY=   ← Edge Function 전용
ALIMTALK_API_KEY=            ← 플랫폼 알림톡 키
```

---

## 진행 상태 트래킹

| 브랜치 | Wave | 상태 | 담당 |
|-------|------|------|------|
| `feat/infra-setup` | 1 | ⬜ 대기 | executor |
| `feat/auth` | 1 | ⬜ 대기 | executor |
| `feat/customer-menu-api` | 2 | ⏸ Wave1 대기 | executor |
| `feat/admin-realtime` | 2 | ⏸ Wave1 대기 | executor |
| `feat/waiting-api` | 2 | ⏸ Wave1 대기 | executor |
| `feat/alimtalk` | 3 | ⏸ Wave2 대기 | executor |
| `feat/onboarding` | 3 | ⏸ Wave2 대기 | executor |

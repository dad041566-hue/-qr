# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TableFlow (테이블QR)** — B2B SaaS for restaurant QR ordering + POS management.
- `tableflow.com` — 서비스 도메인
- 고객 메뉴 URL: `/m/:storeSlug/:tableId`

세 개의 사용자 인터페이스: 고객 QR 주문 메뉴, 점주 어드민 대시보드, 대기 키오스크. 마케팅 랜딩 페이지 포함.

현재 상태: Supabase 연동 완료 (Auth, Realtime, DB). 일부 페이지 Mock → API 전환 작업 진행 중.
기획 문서: `docs/PRD.md`, `docs/DECISIONS.md`, `docs/SCHEMA.md`, `docs/schema.sql`

## Commands

```bash
npm i          # 의존성 설치
npm run dev    # Vite 개발 서버
npm run build  # 프로덕션 빌드
```

테스트·린트 스크립트 없음.

## Environment Variables

`.env` 파일 필요:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Architecture

### Routing (`src/app/routes.tsx`)

| Path | Component | 대상 | 인증 |
|------|-----------|------|------|
| `/` | `Home` | 마케팅 랜딩 | 없음 |
| `/table/:id` | `CustomerMenu` | 고객 QR 주문 (레거시) | 없음 |
| `/m/:storeSlug/:tableId` | `CustomerMenu` | 고객 QR 주문 (모바일) | 없음 |
| `/waiting` | `Waiting` | 대기 접수 키오스크 | 없음 |
| `/login` | `Login` | 직원/점주 로그인 | 없음 |
| `/change-password` | `ChangePassword` | 최초 로그인 비번 변경 | ProtectedRoute |
| `/admin` | `AdminDashboard` | 점주 POS + 어드민 | ProtectedRoute |
| `/superadmin` | `SuperAdmin` | 개발사 매장·계정·기간 관리 | SuperAdminRoute |

### 핵심 구조

- `src/app/pages/` — 라우트 컴포넌트. `CustomerMenu.tsx`·`AdminDashboard.tsx`는 대형 단일 컴포넌트.
- `src/app/components/ui/` — shadcn/ui 프리미티브 48개. **수정 금지 (read-only 라이브러리)**.
- `src/styles/theme.css` — 모든 CSS 커스텀 프로퍼티 토큰 정의. 색상·간격 값 하드코딩 금지, 이 파일의 변수 사용.
- `src/contexts/AuthContext.tsx` — `AuthProvider` + `useAuthContext()` 훅. `StoreUser` (id, email, role, storeId, storeName) 제공.
- `src/app/components/ProtectedRoute.tsx` — 인증 미완료 시 `/login` 리다이렉트.

### 데이터 레이어

3계층 구조:

1. **`src/lib/supabase.ts`** — `Database` 타입으로 typed된 단일 supabase 클라이언트.
2. **`src/lib/api/`** — 순수 async 함수 (DB 호출만). `admin.ts` (주문·테이블·매출), `menu.ts` (고객용 메뉴 조회), `menuAdmin.ts` (메뉴 CRUD), `order.ts` (주문 생성), `waiting.ts` (대기 접수).
3. **`src/hooks/`** — API 함수를 래핑 + Supabase Realtime 구독. 컴포넌트에서 직접 `supabase`를 호출하지 않고 훅을 통해서만 접근.

### Realtime 패턴

모든 realtime 훅은 동일한 패턴을 따름:
```ts
supabase.channel(`{table}:{storeId}`)
  .on('postgres_changes', { event: 'INSERT'|'UPDATE', ... }, handler)
  .subscribe()
// cleanup: supabase.removeChannel(channel)
```

### 타입 (`src/types/database.ts`)

자동 생성이 아닌 수동 관리. `docs/SCHEMA.md` 또는 `docs/schema.sql` 변경 시 직접 업데이트 필요. 각 테이블마다 `Row`, `Insert`, `Update` 타입과 `Database` 인터페이스로 구성.

### 인프라 스택

| 레이어 | 기술 |
|-------|------|
| Backend/DB | Supabase (PostgreSQL + Realtime + Auth + Storage + Edge Functions) |
| 프론트 배포 | Vercel (React SPA) |
| 커스텀 API | AWS Lambda (필요 시) |
| 인증 | Supabase Auth — 이메일+비번만 (카카오 소셜 없음) |
| 슈퍼어드민 | Supabase Edge Function (`supabase/functions/superadmin/`) |
| 도메인 | `tableflow.com` |

### Path Alias

`@` → `./src` (`vite.config.ts`). `@/app/...`, `@/styles/...` 형태로 임포트.

### Styling

- 디자인 토큰: `src/styles/theme.css` CSS 변수. 하드코딩 금지.
- 강조색: orange (`text-orange-500` / `#f97316`)
- Tailwind CSS v4 — `@tailwindcss/vite` 플러그인 사용, PostCSS 설정 불필요.
- 다크모드: CSS 커스텀 프로퍼티로 지원.

### 권한 모델

| 역할 | 주문 관리 | 메뉴 수정 | 직원 관리 | 매출 조회 |
|------|----------|----------|----------|----------|
| owner | ✅ | ✅ | ✅ | ✅ |
| manager | ✅ | ✅ | ❌ | ✅ |
| staff | ✅ | ❌ | ❌ | ❌ |

고객(비로그인)은 주문 INSERT만 허용. Supabase RLS로 `store_id` 기반 멀티테넌트 격리.

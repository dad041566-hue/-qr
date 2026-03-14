# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TableFlow (테이블QR)** — B2B SaaS for restaurant QR ordering + POS management.
- `tableflow.com` — 서비스 도메인
- 고객 메뉴 URL: `/m/:storeSlug/:tableId`

세 개의 사용자 인터페이스: 고객 QR 주문 메뉴, 점주 어드민 대시보드, 대기 키오스크. 마케팅 랜딩 페이지 포함.

현재 상태: **프로토타입 (Mock 데이터)** → Supabase 연동 SaaS로 전환 작업 중.
기획 문서: `docs/PRD.md`, `docs/DECISIONS.md`, `docs/SCHEMA.md`, `docs/schema.sql`

## Commands

```bash
npm i          # 의존성 설치
npm run dev    # Vite 개발 서버
npm run build  # 프로덕션 빌드
```

테스트·린트 스크립트 없음.

## Architecture

### Routing (`src/app/routes.tsx`)

| Path | Component | 대상 |
|------|-----------|------|
| `/` | `Home` | 마케팅 랜딩 |
| `/table/:id` | `CustomerMenu` | 고객 QR 주문 (모바일) |
| `/admin` | `AdminDashboard` | 점주 POS + 어드민 (데스크톱) |
| `/waiting` | `Waiting` | 대기 키오스크 |

### 핵심 구조

- `src/app/pages/` — 라우트 컴포넌트 (파일당 1 페이지). `CustomerMenu.tsx`·`AdminDashboard.tsx` 각 ~49KB로 대형 단일 컴포넌트 구조.
- `src/app/components/ui/` — shadcn/ui 프리미티브 48개. **수정 금지 (read-only 라이브러리)**.
- `src/styles/theme.css` — 모든 CSS 커스텀 프로퍼티 토큰 정의. 색상·간격 값 하드코딩 금지, 이 파일의 변수 사용.

### 데이터 흐름 (현재)

백엔드·상태관리 라이브러리 없음. 모든 데이터는 각 페이지 컴포넌트 내 Mock 배열로 하드코딩, `useState`로만 관리. 페이지 간 데이터 공유 없음.

### SaaS 전환 스택 (진행 중)

| 레이어 | 기술 |
|-------|------|
| Backend/DB | Supabase (PostgreSQL + Realtime + Auth + Storage) |
| 배포 | S3 + CloudFront (프론트) + Lambda (커스텀 API) |
| 인증 | Supabase Auth — 점주: 카카오 소셜, 직원: 이메일+비번 |
| 알림 | 카카오 알림톡 |
| 모노레포 | Turborepo |

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

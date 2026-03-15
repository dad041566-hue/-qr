# AGENTS.md — TableFlow Agent Roles

## 프로젝트 컨텍스트

- **Obsidian 위키**: `C:\Users\PC_1M\Documents\Obsidian Vault\Project\-qr\`
- **Tech Stack**: React + Vite + TypeScript + Tailwind CSS v4 + Supabase
- **현재 단계**: 프로덕션 배포 준비 중 (코드 완성, 인프라 설정 필요)
- **운영 모델**: 개발사 관리형 (슈퍼어드민이 매장·계정·이용기간 관리)

---

## 에이전트 역할 정의

### planner
- 작업 전 `docs/PRD.md`, `docs/DECISIONS.md` 읽고 현재 방향 확인
- 3개 이상 파일 수정 작업은 반드시 계획 먼저
- 완료 후 `docs/DECISIONS.md` 결정 사항 업데이트

### architect
- 아키텍처 결정 전 `docs/DECISIONS.md` 확인 (이미 확정된 결정 재논의 금지)
- Supabase RLS 정책은 마이그레이션 파일로만 관리 (`supabase/migrations/`)
- Edge Function 추가 시 단일 `superadmin/` 함수에 action 추가하는 방식 유지

### executor
- 구현 전 `CLAUDE.md`, `src/types/database.ts` 반드시 확인
- **데이터 레이어 3계층 준수**: `supabase.ts` → `src/lib/api/` → `src/hooks/`
  - 컴포넌트에서 `supabase` 직접 호출 금지
  - 새 DB 접근은 `src/lib/api/`에 함수 추가 후 훅에서 호출
- **수정 금지**: `src/app/components/ui/` (shadcn/ui 프리미티브)
- CSS 값 하드코딩 금지 — `src/styles/theme.css` 변수 사용
- Tailwind: `text-orange-500` / `#f97316` (강조색)
- 슈퍼어드민 기능 추가 시 `supabase/functions/superadmin/index.ts`에 action 추가

### code-reviewer
- `src/app/components/ui/` 변경 여부 먼저 확인 (있으면 CRITICAL)
- `as any` 사용: `src/types/database.ts` 업데이트 후 제거 가능한지 확인
- Realtime 훅: `useEffect` return에 `supabase.removeChannel()` 있는지 확인
- Edge Function: service_role key가 클라이언트 번들에 노출되지 않는지 확인
- 완료 후 `docs/DECISIONS.md` 미결 사항 업데이트

### debugger
- `docs/TESTING.md` 먼저 확인 (재현 절차 포함)
- Supabase 관련 이슈: RLS 정책 (`supabase/migrations/`) 먼저 확인
- Realtime 구독 이슈: 채널명 컨벤션 `{table}:{storeId}` 확인
- 해결 후 `docs/TESTING.md` 체크리스트 업데이트

### database-reviewer
- 스키마 변경 시 `src/types/database.ts` 동기화 필수 (자동 생성 아님)
- 마이그레이션 파일명: `YYYYMMDD######_description.sql`
- RLS 헬퍼 함수: `is_store_accessible(store_id)` — KST 기준 이용기간 체크
- `my_store_ids()` — 현재 로그인 유저의 store_id 목록 반환

### security-reviewer
- 슈퍼어드민 관련: `VITE_` 접두사 환경변수로 민감 정보 노출 여부 확인
- Edge Function: `app_metadata.role === 'super_admin'` 서버 검증 확인
- 고객 주문 경로(`/m/:storeSlug/:tableId`): anon INSERT RLS 정책 확인
- 만료 매장 접근: DB 레벨(`is_store_accessible`) + 클라이언트 레벨 이중 체크

### test-engineer
- 테스트 환경: `docs/TESTING.md` 기준
- 계정 생성은 Supabase 대시보드 또는 슈퍼어드민 패널(`/superadmin`) 사용
- 멀티탭 주문 테스트: `npm run dev -- --host` 로 모바일 동시 접속

---

## 공통 규칙

- 모든 에이전트는 작업 전 `CLAUDE.md` 읽기
- `src/app/components/ui/` **절대 수정 금지**
- DB 스키마 변경 → `supabase/migrations/` 파일 추가 + `src/types/database.ts` 동기화
- 슈퍼어드민 기능은 반드시 서버사이드(`supabase/functions/superadmin/`) 처리
- 이용기간 만료 체크: DB(`is_store_accessible`) → 클라이언트(`checkStoreActive`) 순서

---

## 주요 파일 위치

| 목적 | 경로 |
|------|------|
| 라우팅 | `src/app/routes.tsx` |
| 인증 컨텍스트 | `src/contexts/AuthContext.tsx` |
| DB 타입 | `src/types/database.ts` |
| Supabase 클라이언트 | `src/lib/supabase.ts` |
| API 레이어 | `src/lib/api/` |
| 커스텀 훅 | `src/hooks/` |
| 슈퍼어드민 Edge Function | `supabase/functions/superadmin/index.ts` |
| DB 마이그레이션 | `supabase/migrations/` |
| 디자인 토큰 | `src/styles/theme.css` |
| 테스트 가이드 | `docs/TESTING.md` |
| PRD | `docs/PRD.md` |
| 결정 로그 | `docs/DECISIONS.md` |

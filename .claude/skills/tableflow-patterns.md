---
name: tableflow-patterns
description: Coding patterns extracted from TableFlow (테이블QR) — B2B SaaS restaurant QR ordering + POS management
version: 1.0.0
source: local-git-analysis
analyzed_commits: 47
---

# TableFlow Patterns

## Commit Conventions

Conventional commits (한글 + 영문 혼용):

| Prefix | Usage | Count | Example |
|--------|-------|-------|---------|
| `feat:` | 새 기능 | 19 (40%) | `feat: 어드민 직원 관리 UI + Edge Function` |
| `test:` | 테스트 추가/수정 | 7 (15%) | `test: Fix 4 E2E test failures` |
| `fix:` | 버그 수정 | 4 (9%) | `fix: 점주 첫 로그인 비밀번호 변경 플로우 완성` |
| `docs:` | 문서 | 3 (6%) | `docs: CLAUDE.md + 기능 강화` |
| `chore:` | 유지보수 | 2 (4%) | `chore: .gitignore 추가` |
| `security:` | 보안 | 1 (2%) | `security: CRITICAL 보안 이슈 수정` |

Branch naming: `feat/{feature-name}` (kebab-case, 한글 제목).
Merge commits: `Merge branch 'feat/{name}': 한글 설명`.

## Code Architecture

### 3-Layer Data Pattern

모든 데이터 접근은 3계층을 따름:

```
Component → Hook (src/hooks/) → API function (src/lib/api/) → Supabase client
```

1. **API 함수** (`src/lib/api/*.ts`): 순수 async 함수, DB 호출만. UI 로직 없음.
2. **훅** (`src/hooks/use*.ts`): API 래핑 + Realtime 구독 + 상태 관리.
3. **컴포넌트**: 훅을 통해서만 데이터 접근. `supabase` 직접 호출 금지.

### Feature Implementation Sequence

Git 히스토리에서 반복되는 기능 구현 순서:

```
1. API 레이어 구현 (src/lib/api/{feature}.ts)
2. 훅 구현 (src/hooks/use{Feature}.ts)
3. 페이지 컴포넌트에서 Mock → API 전환
4. Edge Function (필요 시) (supabase/functions/{name}/index.ts)
5. DB 마이그레이션 (supabase/migrations/)
6. E2E 테스트 (e2e/{feature}.spec.ts)
7. 보안 하드닝 (RLS 정책, 입력 검증)
```

### File Co-Change Patterns

자주 함께 변경되는 파일 그룹:

| 그룹 | 파일들 |
|------|--------|
| 인증 | `AuthContext.tsx` + `ProtectedRoute.tsx` + `SuperAdminRoute.tsx` + `Login.tsx` |
| 어드민 | `AdminDashboard.tsx` + `src/lib/api/admin.ts` + `src/hooks/useOrders.ts` |
| E2E 인프라 | `e2e/e2e-helpers.ts` + 모든 `e2e/*.spec.ts` |
| 슈퍼어드민 | `superadmin.ts` (API) + `supabase/functions/superadmin/index.ts` + `SuperAdmin.tsx` |
| 직원 관리 | `staffAdmin.ts` + `create-staff/index.ts` + `staff.spec.ts` |

## Workflows

### 새 API 엔드포인트 추가

1. `src/lib/api/{module}.ts`에 async 함수 추가
2. `src/hooks/use{Module}.ts`에서 래핑 훅 작성
3. Realtime 필요 시 `supabase.channel()` 구독 추가
4. `src/types/database.ts`에 타입 추가/수정
5. 단위 테스트: `src/lib/api/{module}.test.ts`

### Edge Function 추가

1. `supabase/functions/{name}/index.ts` 생성
2. JWT 검증 + CORS 헤더 처리
3. Service Role Key로 DB 접근
4. 프론트에서 `supabase.functions.invoke('{name}')` 호출
5. E2E 테스트에서 `getServiceRoleHeaders()` 활용

### 보안 변경

1. `supabase/migrations/` 에 새 SQL 마이그레이션 추가
2. RLS 정책 수정 시 기존 정책 DROP 후 재생성
3. E2E에서 권한 시나리오 검증 (비인가 접근 차단 확인)
4. `security:` 커밋 접두사 사용

## Testing Patterns

### E2E 테스트 구조

- 파일 네이밍: `e2e/{feature}.spec.ts`
- 시나리오 ID: `SC-001`, `OD-002`, `RS-004` 등 접두사 기반 식별
- 공통 유틸: `e2e/e2e-helpers.ts` (`login`, `loginAndWaitForAdmin`, `requireEnv`)
- 환경변수: `TEST_SUPERADMIN_EMAIL`, `TEST_SUPERADMIN_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`

### 단위 테스트 구조

- 파일 위치: 소스 파일 옆 (`src/lib/api/order.test.ts`)
- 프레임워크: Vitest + jsdom + @testing-library
- 커버리지 대상: `src/lib/api/*.ts`, `src/lib/utils/*.ts`, `src/hooks/*.ts`

### 테스트-구현 반복 패턴

Git 히스토리에서 관찰된 패턴:
1. E2E 전체 작성 → 실패 발견 → 반복 수정 (4-5회 커밋)
2. 보안 수정과 테스트 수정이 함께 발생
3. `test:` 커밋에서 E2E 스펙 파일 4-5개가 동시 변경

## Supabase Patterns

### Realtime 채널 네이밍

```
{table_name}:{store_id}
```

예: `orders:abc-123`, `tables:abc-123`

### RLS 정책 패턴

- `store_id` 기반 멀티테넌트 격리
- 고객(anon): INSERT만 허용 (주문, 대기)
- 직원(authenticated): role 기반 CRUD 제한
- 마이그레이션으로 정책 관리, 반복 수정 이력 있음 (v1 → v2 → final 패턴)

### Edge Function 패턴

모든 Edge Function은 동일 구조:
1. CORS preflight 처리 (`OPTIONS`)
2. JWT에서 사용자 검증
3. 권한 확인 (슈퍼어드민 또는 owner)
4. Service Role Key로 `supabase.auth.admin.*` 호출
5. JSON 응답 반환

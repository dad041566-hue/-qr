# TableFlow — 통합 테스트 계획 (testplan.md)

> 작성일: 2026-03-16 | 최종 업데이트: 2026-03-16
> QA + Security 팀 에이전트 협의 결과 반영
> E2E 도구: Playwright (serial describe mode)

---

## 우선순위 분류

| 레벨 | 기준 | 시나리오 수 |
|------|------|------------|
| **P0** | 서비스 핵심 플로우 — 실패 시 서비스 불능 | 13 |
| **P1** | 주요 기능 — 실패 시 기능 저하 | 19 |
| **P2** | 엣지 케이스 / 보안 / 성능 | 9 |

---

## P0 — 핵심 플로우 (반드시 통과)

### SC-001: 슈퍼어드민 → 매장 생성 플로우
- **경로**: `/login` → `/superadmin`
- **검증**: 매장명 셀이 테이블에 노출, 테이블 5개 자동 생성
- **E2E 파일**: `e2e/superadmin.spec.ts` (test 1)

### SC-002: 슈퍼어드민 페이지 비인가 접근 차단
- **경로**: 점주 계정으로 `/superadmin` 직접 접근
- **검증**: `/admin` 또는 `/login`으로 리다이렉트
- **구현**: `SuperAdminRoute` — `app_metadata.role !== 'super_admin'`
- **E2E 파일**: `e2e/staff.spec.ts` (SC-002 테스트)

### SC-003: 점주 첫 로그인 → 비번 변경 강제
- **경로**: 임시 비번 로그인 → `/change-password` 강제 이동
- **검증**: `is_first_login = true` → ProtectedRoute가 `/change-password`로 리다이렉트
- **E2E 파일**: `e2e/superadmin.spec.ts` (test 2)

### SC-004: 비번 변경 후 어드민 진입
- **검증**: `is_first_login = false` 업데이트 → `/admin` 접근 허용
- **E2E 파일**: `e2e/order-flow.spec.ts` (test 2)

### SC-005: 비로그인 어드민 접근 차단
- **경로**: `/admin` 직접 접근 (세션 없음)
- **검증**: `/login`으로 리다이렉트
- **E2E 파일**: `e2e/staff.spec.ts` (SC-005/006 통합 테스트)

### SC-006: 비로그인 change-password 접근 차단
- **경로**: `/change-password` 직접 접근 (세션 없음)
- **검증**: `/login`으로 리다이렉트
- **E2E 파일**: `e2e/staff.spec.ts` (SC-005/006 통합 테스트)

### SC-007: 만료된 매장 접근 차단
- **조건**: `subscription_end < today` 또는 `is_active = false`
- **검증**: 점주 로그인 시 `/admin` 접근 불가 (403 메시지 또는 리다이렉트)
- **구현 상태**: `ProtectedRoute` + `checkStoreActive`로 적용

### SC-008: 고객 QR 메뉴 조회
- **경로**: `/m/:storeSlug/:tableId`
- **검증**: 매장명, 메뉴 카테고리 표시 (메뉴 없으면 빈 화면)
- **E2E 파일**: `e2e/order-flow.spec.ts` (test 5)

### SC-009: 고객 주문 생성
- **흐름**: 메뉴 선택 → 장바구니 → 주문 제출
- **검증**: `orders` 테이블 INSERT 확인, `order_items` 연결, 주문 알림 트리거
- **E2E 파일**: `e2e/order-flow.spec.ts` (test 6, 8, 10)

### SC-010: 어드민 실시간 주문 수신
- **검증**: 고객 주문 제출 후 5초 이내 어드민 화면에 신규 주문 노출
- **E2E 파일**: `e2e/order-flow.spec.ts` (test 6)

### SC-011: 직원 계정 생성 (슈퍼어드민/점주)
- **경로**: 어드민 → 직원 관리 탭 → 직원 추가
- **검증**: Supabase Auth 계정 생성, `store_members` INSERT, role = 'staff'
- **구현**: `create-staff` Edge Function
- **E2E 파일**: `e2e/staff.spec.ts` (SC-011 테스트) + `e2e/order-flow.spec.ts` (test 7)

### SC-012: 직원 role — 메뉴 수정 불가
- **흐름**: staff 계정 로그인 → 어드민 → 메뉴 탭 숨김 확인
- **검증**: "메뉴 관리" 탭 미노출
- **E2E 파일**: `e2e/staff.spec.ts` (SC-012 테스트)

### SC-013: 직원 role — 매장 관리 접근 불가
- **검증**: staff는 "매장 관리" 모드 버튼 없음 또는 클릭 시 차단
- **E2E 파일**: `e2e/staff.spec.ts` (SC-013 테스트)

---

## P1 — 주요 기능

### SC-014: 메뉴 카테고리 등록
- 점주 → 메뉴 관리 → 카테고리 추가 → DB 반영 확인

### SC-015: 메뉴 아이템 등록 (이미지 포함)
- 메뉴명, 가격, 설명, 이미지 업로드 → `menu_items` INSERT

### SC-016: 메뉴 수정
- 메뉴명/가격 변경 → UPDATE 확인

### SC-017: 메뉴 비활성화
- `is_available = false` 설정 → 고객 화면 미노출 확인

### SC-018: 테이블 추가
- 어드민 → QR 관리 → 테이블 추가 → `tables` INSERT + QR URL 생성

### SC-019: QR URL 유효성
- 생성된 QR URL (`/m/:slug/:tableId`) 접근 → 메뉴 화면 정상 로딩

### SC-020: 직원 — 메뉴 탭 접근 차단
- staff 로그인 → "매장 관리" 모드 전환 불가 또는 메뉴 탭 숨김

### SC-021: 점주 매출 조회
- 어드민 → 매출 탭 → 일별 매출 차트 데이터 Supabase 쿼리 확인

### SC-022: 고객 주문 — 장바구니 수량 변경
- 메뉴 선택 → +/- 버튼 → 수량 반영 → 주문 금액 계산

### SC-023: 고객 주문 — 빈 장바구니 주문 시도
- 장바구니 비우고 주문 버튼 → 에러 메시지 또는 버튼 비활성

### SC-024: 주문 상태 변경 (신규 → 완료)
- 어드민에서 `조리 시작`/`조리 완료`/`서빙 완료` 동작으로 상태 전환
- **E2E 파일**: `e2e/order-flow.spec.ts` (test 6, 8, 10)

### SC-025: 어드민 실시간 주문 상태 변경
- 상태 변경 후 화면 실시간 반영 (Realtime subscription)
- **알림 검증 범위(현재)**: 상태 전환 직후 화면 반영 + 각 화면의 toast 메시지 노출
- **확장 완료(제안 반영)**: Playwright init-script 기반 Notification/Vibration probe로 백그라운드(visibilityState=hidden) 수신 흐름까지 E2E 검증
- **E2E 파일**: `e2e/order-flow.spec.ts` (test 6, 8)

### SC-039: 다중 스태프 실시간 주문 접수 동기화 (웹소켓)
- 점주/직원 2개 관리자 세션 동시 로그인
- 고객 주문 제출 후 5초 이내 양쪽 화면에서 동일 주문 노출
- **E2E 파일**: `e2e/order-flow.spec.ts` (test 8)

### SC-040: 다중 스태프 상태 변경 알림 동기화
- 점주가 주문 상태를 `confirmed → preparing → ready → served`로 변경
- 직원 세션에서 즉시 상태 반영 + 상태별 알림/진동 일치
- **E2E 파일**: `e2e/order-flow.spec.ts` (test 8)

### SC-041: 실시간 채널 장애 복원성
- 네트워크 오프라인 후 재연결 시 Supabase Realtime 채널 재구독 확인
- 미도달 이벤트 보완/재조회 정책 확인

### SC-026: 대기 접수 키오스크
- `/waiting` → 인원 선택 → 접수 → `waiting_queue` INSERT

### SC-027: 어드민 대기 목록 확인
- 대기 접수 후 어드민 → 대기 탭 → 신규 항목 노출

### SC-028: 점주 비번 변경 (설정)
- 어드민 → 프로필 → 비번 변경 (최초 변경 이후의 선택적 변경)

### SC-029: 로그아웃
- 어드민 → 로그아웃 → 세션 제거 → `/login` 이동

### SC-030: 세션 만료 후 자동 리다이렉트
- localStorage 토큰 만료 → ProtectedRoute → `/login` 리다이렉트

### SC-031: 법적 페이지 접근
- `/privacy`, `/terms` 직접 접근 → 정상 렌더링 (비로그인 허용)

### SC-032: 직원 계정 비활성화
- 점주 → 직원 관리 → 비활성화 → 해당 직원 로그인 차단

---

## P2 — 엣지 케이스 / 보안

### SC-033: 중복 slug 매장 생성 시도
- `slug` 유니크 제약 → Edge Function 400 에러 반환

### SC-034: 약한 비번 설정 시도
- 8자 미만 or 특수문자 없음 → 프론트 + Edge Function 양측 검증

### SC-035: 잘못된 tableId QR 접근
- 존재하지 않는 tableId → 고객 메뉴 오류 화면

### SC-036: 동시 주문 (race condition)
- 2개 세션에서 동시 주문 → 두 주문 모두 정상 INSERT (중복 방지 불필요)

### SC-037: 대기 번호 race condition
- 동시 다발 대기 접수 → `next_queue_number()` DB 함수 원자적 처리 확인

### SC-038: XSS — 메뉴명 특수문자 입력
- `<script>alert(1)</script>` 메뉴명 저장 → 고객 화면에서 이스케이프 확인

---

## 보안 이슈 (Security Agent 확인)

### CRITICAL — ✅ 수정 완료

| ID | 설명 | 수정 내역 |
|----|------|----------|
| SEC-001 | `store_members_self_update` 정책이 `role` 컬럼까지 UPDATE 허용 → role 탈취 가능 | `20260316000003_fix_store_members_policy_v2.sql` — `is_first_login` 전용 정책으로 교체, USING/WITH CHECK 양쪽에서 `is_first_login` 조건 강제 |
| SEC-002 | 고객 주문 시 `price_at_order`를 클라이언트가 전송 → 가격 조작 가능 | `20260316000002_fix_order_price_server_side.sql` — `enforce_menu_item_price()` BEFORE INSERT 트리거 + `recalculate_order_totals()` AFTER INSERT 트리거로 서버사이드 가격 강제 |

### HIGH

| ID | 설명 | 상태 |
|----|------|------|
| SEC-003 | CORS `Access-Control-Allow-Origin: *` | ✅ 수정 완료 — 4개 Edge Function에 `getAllowedOrigin()` 도메인 화이트리스트 적용 |
| SEC-004 | `next_queue_number()` race condition | ⚠️ 부분 수정 — `SECURITY DEFINER` 적용 완료 (`20260316000007`), row-level lock은 기존 `UPDATE ... RETURNING` 패턴으로 이미 처리됨 |
| SEC-005 | `deactivateStaffMember`에 `store_id` 스코프 없음 | ✅ 확인 완료 — 코드에 이미 `.eq('store_id', storeId)` 적용됨 |
| SEC-006 | `create-staff` Edge Function 호출 시 `apikey` 헤더 누락 | ✅ 확인 완료 — 코드에 이미 `apikey: anonKey` 헤더 포함 |
| SEC-007 | 비로그인 사용자의 `orders` SELECT 허용 가능성 | ✅ 확인 완료 — anon은 `orders_anon_insert` (INSERT only), SELECT 정책 없음 |

---

## E2E 파일 현황

| 파일 | 커버 시나리오 | 상태 |
|------|------------|------|
| `e2e/superadmin.spec.ts` | SC-001 (슈퍼어드민 매장 생성), SC-003/SC-004 (점주 첫 로그인 → 비번 변경 → 어드민 진입) | ✅ 작성완료 |
| `e2e/order-flow.spec.ts` | SC-001 (매장 생성), SC-003/SC-004 (비번 변경), SC-008 (고객 메뉴 조회), SC-009/SC-010 (주문 생성 + 실시간 수신), SC-011 (직원 생성 UI), SC-012 (role 권한), SC-024/SC-025 (주문 상태 변경 + 실시간 반영), SC-039/SC-040 (다중 스태프 동기화), SC-041 (실시간 채널 복원성), 백그라운드 알림/진동 probe | ✅ 작성완료 |
| `e2e/staff.spec.ts` | SC-002 (점주 superadmin 접근 차단), SC-005/SC-006 (비로그인 보호 경로 차단), SC-011 (직원 계정 생성), SC-012 (직원 메뉴 탭 차단), SC-013 (직원 매장 설정 차단), SC-028 (비밀번호 변경), SC-029 (홈으로 나가기), SC-032 (직원 비활성화) | ✅ 작성완료 |
| `e2e/login.spec.ts` | 슈퍼어드민 로그인 기본 검증 (SC-005/SC-006은 staff.spec.ts로 이동) | ✅ 작성완료 |
| `e2e/menu.spec.ts` | SC-014 (메뉴 탭 진입), SC-015 (메뉴 등록), SC-016 (메뉴 수정), SC-017 (품절 처리 + 고객 미노출), SC-018 (테이블 추가), SC-019 (QR URL 유효성) | ✅ 작성완료 |
| `e2e/order-detail.spec.ts` | SC-022 (장바구니 수량 변경 +/-), SC-023 (빈 장바구니 주문 차단) | ✅ 작성완료 |
| `e2e/waiting.spec.ts` | SC-026 (대기 키오스크 UI 키패드/인원 선택 + API RPC/INSERT 검증), SC-027 (대기 목록 API 조회) | ✅ 작성완료 |
| `e2e/edge-cases.spec.ts` | SC-007 (만료 매장 차단), SC-031 (법적 페이지), SC-033 (중복 slug), SC-035 (잘못된 tableId), SC-038 (XSS 이스케이프) | ✅ 작성완료 |

---

## 작업 순서

### 완료

- ~~**즉시**: SEC-001 보안 마이그레이션~~ → `20260316000003` 적용 완료
- ~~**즉시**: SEC-002 가격 조작 방지~~ → `20260316000002` DB 트리거 적용 완료
- ~~**단기**: SC-011 직원 생성 E2E 작성~~ → `e2e/staff.spec.ts` 작성 완료
- ~~**완료(2026-03-16)**: SC-039/SC-040 다중 스태프 실시간 동기화 E2E~~ → `e2e/order-flow.spec.ts` test 6, 8 작성 완료

### 남은 작업

1. **단기**: SC-007 만료 매장 차단 E2E 검증
2. **단기**: SEC-005 `deactivateStaffMember` store_id 스코프 추가
3. **단기**: SEC-006 `create-staff` apikey 헤더 추가
4. **중기**: SEC-003 Edge Function CORS 도메인 제한
5. ~~**중기**: 미작성 E2E~~ → `menu.spec.ts`, `order-detail.spec.ts`, `edge-cases.spec.ts` 작성 완료
6. ~~**단기**: `waiting.spec.ts` SC-026/SC-027~~ → UI + API 검증 방식으로 작성 완료 + `next_queue_number` SECURITY DEFINER 마이그레이션 적용
7. ~~**중기**: SC-041 (실시간 채널 장애 복원성) E2E~~ → `e2e/order-flow.spec.ts`에 추가 완료
8. ~~**단기**: SC-007 E2E 스킵 해제~~ → `SUPABASE_SERVICE_ROLE_KEY` 추가 + service role PATCH 방식으로 완료

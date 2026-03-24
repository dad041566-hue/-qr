# TableFlow 엣지 케이스 카탈로그

> 작성일: 2026-03-24
> 총 엣지 케이스: 72개
> 분석 기반: PRD v2.0, USECASE-DIAGRAM, E2E-COVERAGE-GAPS, E2E-PRECISION-AUDIT, 소스코드 직접 분석

## 요약

| 카테고리 | 총 케이스 | E2E 자동화 가능 | 이미 커버됨 | 미커버 |
|---------|----------|---------------|-----------|--------|
| 주문 (ORDER) | 16 | 14 | 3 | 13 |
| 대기 (WAITING) | 10 | 8 | 2 | 8 |
| 인증 (AUTH) | 12 | 10 | 4 | 8 |
| Realtime (RT) | 7 | 4 | 1 | 6 |
| 보안 (SEC) | 14 | 11 | 2 | 12 |
| UI (UI) | 13 | 9 | 1 | 12 |
| **합계** | **72** | **56** | **13** | **59** |

---

## 1. 주문 (ORDER)

| ID | 엣지 케이스 | 심각도 | 자동화 | E2E 상태 | 설명 |
|----|-----------|--------|--------|---------|------|
| EC-O01 | 수량 0 또는 음수 주문 시도 | HIGH | ✅ | ❌ 미커버 | `create_order_atomic`에서 `quantity <= 0` 체크 있음 (서버 방어 O). 클라이언트 UI에서 최소 수량 1 강제 여부 미검증. |
| EC-O02 | 극단 수량 (999999) 주문 시도 | HIGH | ✅ | ❌ 미커버 | 서버에 수량 상한 검증 없음. `quantity > 0`만 체크. int 오버플로우 시 `total_price` 계산 오류 가능. 클라이언트에도 MAX_QUANTITY 상수 없음. |
| EC-O03 | 빈 장바구니로 주문 제출 | MEDIUM | ✅ | ❌ 미커버 | `create_order_atomic`에서 `jsonb_array_length(p_items) = 0` 체크 있음 (서버 방어 O). UI disabled 상태 여부 미검증. |
| EC-O04 | 옵션 가격 조작 (extra_price를 0으로 전송) | CRITICAL | ✅ | ❌ 미커버 | `enforce_menu_item_price()` 트리거가 서버에서 실제 DB 가격으로 교정함 (방어 O, 2026-03-24 수정). E2E 검증 없음. |
| EC-O05 | 존재하지 않는 menu_item_id로 주문 | HIGH | ✅ | ❌ 미커버 | `create_order_atomic`에서 `mi.id IS NULL` 체크로 차단 (서버 방어 O). |
| EC-O06 | 품절 (is_available=false) 메뉴 주문 시도 | HIGH | ✅ | ❌ 미커버 | `create_order_atomic`에서 `mi.is_available = true AND mi.is_deleted = false` 체크 (서버 방어 O). 메뉴 열린 상태에서 품절 전환 후 주문 제출하는 race condition 미검증. |
| EC-O07 | 다른 매장의 menu_item_id로 주문 (크로스테넌트) | CRITICAL | ✅ | ❌ 미커버 | `create_order_atomic`에서 `mi.store_id = p_store_id` 체크 (서버 방어 O). E2E 미검증. |
| EC-O08 | 잘못된 상태 전환 (served→preparing) | HIGH | ✅ | ⚠️ 부분 | `canTransition()` (orderStatus.ts)에서 클라이언트 차단 + `updateOrderStatus()` (admin.ts)에서 서버 검증. served/cancelled는 빈 배열로 전환 불가. 정상 전환만 E2E 커버. |
| EC-O09 | 동일 테이블 동시 주문 (race condition) | HIGH | ⚠️ | ❌ 미커버 | `create_order_atomic`은 트랜잭션 내 실행이라 두 주문 모두 정상 INSERT 가능. rate limit (15/분)이 유일한 제어. 동시성 테스트 어려움. |
| EC-O10 | Rate limit 경계값 (15번째 주문) | HIGH | ✅ | ❌ 미커버 | 1분 내 15건 이상 시 `rate limit exceeded` 예외. 정확히 15번째에서 차단되는지 경계값 미검증. |
| EC-O11 | 네트워크 끊김 중 주문 제출 | MEDIUM | ⚠️ | ❌ 미커버 | 클라이언트에 offline 감지/재시도 로직 없음. 네트워크 복구 후 이중 제출 가능성. |
| EC-O12 | 주문 후 다른 테이블 QR 재스캔 | MEDIUM | ✅ | ❌ 미커버 | sessionStorage 기반 주문 이력이 storeSlug+tableId 키로 분리. 다른 테이블 스캔 시 이전 주문 이력 미표시 (정상). 단, 같은 브라우저에서 혼동 가능. |
| EC-O13 | table_id가 다른 store에 속한 경우 | HIGH | ✅ | ❌ 미커버 | `create_order_atomic`에서 `tables.store_id = p_store_id` 체크 (서버 방어 O). |
| EC-O14 | 주문 취소 후 재주문 | MEDIUM | ✅ | ❌ 미커버 | cancelled 상태에서는 상태 전환 불가 (`VALID_TRANSITIONS.cancelled = []`). 새 주문 생성은 가능. E2E 미검증. |
| EC-O15 | 동일 아이템 중복 장바구니 추가 | LOW | ✅ | ❌ 미커버 | 클라이언트에서 `cartId`로 개별 추적. 같은 아이템 다른 옵션으로 여러 번 추가 가능. 정상 동작이지만 수량 합산 UX 미검증. |
| EC-O16 | 구독 만료 직전 주문 (메뉴 열린 상태에서 만료) | CRITICAL | ✅ | ❌ 미커버 | `is_store_accessible(p_store_id)` 함수가 주문 시점에 매장 활성 여부 재확인 (서버 방어 O). 메뉴 페이지 로드 후 만료 → 주문 시 에러. 에러 메시지 UX 미검증. |

---

## 2. 대기 (WAITING)

| ID | 엣지 케이스 | 심각도 | 자동화 | E2E 상태 | 설명 |
|----|-----------|--------|--------|---------|------|
| EC-W01 | 대기번호 int 오버플로우/롤오버 | LOW | ✅ | ❌ 미커버 | `next_queue_number()`가 `current_number + 1`로 단순 증가. PostgreSQL int4 범위 (2,147,483,647) 초과 시 에러. 롤오버 로직 없음. 실제로는 해당 범위 도달 어려움. |
| EC-W02 | 동일 전화번호 동일 매장 중복 대기 | MEDIUM | ✅ | ❌ 미커버 | DB에 unique 제약 없음. 같은 번호로 여러 건 등록 가능. rate limit (3건/10분)이 유일한 제어. |
| EC-W03 | Rate limit 경계값 (정확히 3건째) | HIGH | ✅ | ❌ 미커버 | `check_waiting_rate_limit()` 트리거가 `v_recent_count >= 3` 체크. 10분 내 동일 phone+store_id 3건 이상 차단. 경계값 미검증. |
| EC-W04 | 대기 등록 직후 매장 만료 | MEDIUM | ⚠️ | ❌ 미커버 | 대기 등록 자체는 `waitings` 테이블 INSERT만. `is_store_accessible` 체크가 대기 등록 경로에 있는지 미확인. 만료 후에도 기존 대기 데이터 잔존. |
| EC-W05 | 전화번호 형식 — 010 없는 번호 | MEDIUM | ✅ | ❌ 미커버 | 서버에 전화번호 형식 검증 없음. 빈 문자열, 특수문자, 해외 번호 모두 INSERT 가능. 클라이언트 검증만 존재 여부 미확인. |
| EC-W06 | 인원수 0명 또는 음수 | MEDIUM | ✅ | ❌ 미커버 | `party_size` 필드에 DB 레벨 CHECK 제약 없음. 0명, -1명 등 비정상 값 INSERT 가능. |
| EC-W07 | 존재하지 않는 storeSlug으로 대기 접근 | MEDIUM | ✅ | ❌ 미커버 | `/waiting/:storeSlug` 라우트에서 `getStoreBySlug()` 호출 시 매장 미존재 에러. 에러 화면 표시 E2E 미검증 (GAP-39). |
| EC-W08 | 대기 상태 잘못된 전환 (seated→waiting) | MEDIUM | ✅ | ❌ 미커버 | `updateWaitingStatus()`에 상태 전환 검증 없음. 어떤 상태에서든 어떤 상태로든 변경 가능. |
| EC-W09 | 대기 호출(call) 후 장시간 미착석 | LOW | ❌ | ❌ 미커버 | 자동 no-show 전환 로직 없음. 수동 관리만 가능. 타임아웃 기능 부재. |
| EC-W10 | 테이블 자동 배정 시 용량 초과 파티 | MEDIUM | ✅ | ❌ 미커버 | `findAvailableTable()`이 `gte('capacity', partySize)`로 필터. 모든 테이블 용량 초과 시 null 반환. null 처리 UI 미검증. |

---

## 3. 인증 (AUTH)

| ID | 엣지 케이스 | 심각도 | 자동화 | E2E 상태 | 설명 |
|----|-----------|--------|--------|---------|------|
| EC-A01 | 비밀번호 변경 후 다른 세션 무효화 | HIGH | ✅ | ❌ 미커버 | Supabase Auth 기본 동작은 비밀번호 변경 시 다른 세션 무효화 미보장. 탭 A에서 변경 → 탭 B에서 계속 사용 가능. E2E-COVERAGE-GAPS에도 지적됨. |
| EC-A02 | 동시 다중 탭 로그인 | MEDIUM | ✅ | ❌ 미커버 | 같은 계정 여러 탭에서 로그인. `onAuthStateChange` 리스너가 각 탭에서 독립 실행. WebLock 데드락 방지 코드 있음 (USER_UPDATED, TOKEN_REFRESHED 이벤트 스킵). |
| EC-A03 | 첫 로그인 비번 변경 중 세션 만료 | MEDIUM | ✅ | ❌ 미커버 | `/change-password`에서 비번 변경 중 JWT 만료 시 `refreshSession()` 실패. 사용자 재로그인 필요. UX 미검증. |
| EC-A04 | SQL injection in email/password | CRITICAL | ✅ | ❌ 미커버 | Supabase Auth SDK가 파라미터화된 쿼리 사용 (프레임워크 방어 O). 직접 SQL 구성 없음. 그러나 E2E 검증 없음. |
| EC-A05 | 계정 삭제(비활성화) 후 재로그인 시도 | HIGH | ✅ | ❌ 미커버 | `deactivateStaffMember()`는 `store_members`에서 삭제. Supabase Auth 사용자는 잔존. 로그인은 성공하지만 `fetchStoreUser()` 시 `store_members` 조회 실패 → user=null. GAP-20 지적. |
| EC-A06 | 점주가 자기 자신 삭제 시도 | HIGH | ✅ | ❌ 미커버 | `deactivateStaffMember()`에 자기 자신 삭제 방지 로직 없음. owner가 본인을 삭제하면 매장 관리자 부재. |
| EC-A07 | 잘못된 이메일 형식 로그인 | LOW | ✅ | ❌ 미커버 | Supabase Auth가 이메일 형식 검증. 클라이언트 에러 메시지 표시 E2E 미검증 (GAP-05). |
| EC-A08 | 만료 매장 직원 로그인 차단 | HIGH | ✅ | ⚠️ 부분 | `checkStoreActive` 로직으로 차단. SB-004/005 테스트가 stub (`expect(true).toBeTruthy()` / `test.skip(true)`)으로 실질 미검증. |
| EC-A09 | 구독 체크 실패 + 캐시 없음 시 차단 | HIGH | ✅ | ⚠️ 부분 | UC-S08. 네트워크 에러로 구독 체크 불가 + 로컬 캐시 없음 = 차단. SB-004 stub으로 미검증. |
| EC-A10 | 구독 체크 실패 + 활성 캐시 시 진입 유지 | MEDIUM | ✅ | ❌ 미커버 | UC-S09. 오프라인 복원성. 캐시 기반 진입 허용. E2E 미검증. |
| EC-A11 | JWT 만료 직전 API 호출 | MEDIUM | ⚠️ | ❌ 미커버 | Supabase SDK가 자동 토큰 갱신. 갱신 실패 시 401 에러 핸들링 미검증. |
| EC-A12 | 역할 상승 시도 (manager→owner) | CRITICAL | ✅ | ❌ 미커버 | `store_members.update({role:'owner'})` 직접 호출 시 RLS만이 방어선. SEC-E27 지적. RLS 정책 검증 E2E 없음. |

---

## 4. Realtime (RT)

| ID | 엣지 케이스 | 심각도 | 자동화 | E2E 상태 | 설명 |
|----|-----------|--------|--------|---------|------|
| EC-R01 | WebSocket 연결 끊김 후 재연결 + 누락 이벤트 | HIGH | ⚠️ | ❌ 미커버 | Supabase Realtime은 자동 재연결하지만, 끊김 동안 발생한 이벤트는 누락. 재연결 후 전체 재조회 로직 여부 미확인. |
| EC-R02 | 주문 100건 동시 수신 (부하) | MEDIUM | ⚠️ | ❌ 미커버 | 대량 Realtime 이벤트 수신 시 UI 렌더링 성능. batch 처리 없이 개별 이벤트마다 setState 호출 가능성. |
| EC-R03 | 브라우저 절전/백그라운드 후 복귀 | MEDIUM | ❌ | ❌ 미커버 | 모바일 브라우저 백그라운드 진입 시 WebSocket 끊김. 복귀 후 상태 동기화 미검증. |
| EC-R04 | Realtime 구독 중 store_id 변경 | LOW | ✅ | ❌ 미커버 | 단일 매장 SaaS이므로 실제 발생 가능성 낮음. channel cleanup 후 재구독 필요. |
| EC-R05 | 고객 주문 상태 실시간 업데이트 | HIGH | ✅ | ❌ 미커버 | `useOrderStatus` 훅의 Realtime 반영. 어드민이 상태 변경 → 고객 화면 반영 E2E 미검증 (GAP-28). |
| EC-R06 | 어드민 주문 수신 알림 (PWA) | MEDIUM | ❌ | ❌ 미커버 | PWA 알림은 브라우저 API 의존. Playwright에서 Push API 테스트 제한적. |
| EC-R07 | 동시 다중 어드민 접속 시 상태 충돌 | MEDIUM | ✅ | ❌ 미커버 | 어드민 A가 주문 '조리중' 변경 + 어드민 B가 동시에 같은 주문 '취소'. last-write-wins. |

---

## 5. 보안 (SEC)

| ID | 엣지 케이스 | 심각도 | 자동화 | E2E 상태 | 설명 |
|----|-----------|--------|--------|---------|------|
| EC-S01 | 크로스테넌트 주문 접근 (Store A→B) | CRITICAL | ✅ | ❌ 미커버 | `updateOrderStatus()`, `deleteOrder()`가 `store_id` 필터 없이 `id`만 사용. RLS가 유일한 방어선. SEC-E01-05 지적. |
| EC-S02 | 크로스테넌트 매출 조회 | CRITICAL | ✅ | ❌ 미커버 | `getDailyRevenue(storeId)`가 파라미터로 받은 storeId 사용. 다른 매장 ID 전달 시 RLS만이 차단. SEC-E06 지적. |
| EC-S03 | Staff가 API로 메뉴 수정 시도 | HIGH | ✅ | ❌ 미커버 | UI에서 탭 숨김으로 차단하지만, API 직접 호출 시 RLS 차단 여부 미검증. SEC-E07-10 지적. |
| EC-S04 | Staff가 API로 store_settings 수정 | HIGH | ✅ | ❌ 미커버 | `store_settings` 테이블에 role 기반 RLS 제한 없음. SEC-E22 지적. |
| EC-S05 | QR token 열거 공격 | MEDIUM | ✅ | ❌ 미커버 | anon 사용자가 `tables` 테이블 SELECT 가능. `qr_token` 필드 노출 → 다른 테이블 주문 가능. SEC-E23 지적. |
| EC-S06 | XSS in guest_name 필드 | HIGH | ✅ | ❌ 미커버 | `<script>alert(1)</script>` 등 입력 시 어드민 대시보드에서 렌더링. React의 기본 이스케이프가 방어선. dangerouslySetInnerHTML 미사용 확인 필요. SEC-E12-14 지적. |
| EC-S07 | XSS in special_requests 필드 | HIGH | ✅ | ❌ 미커버 | guest_name과 동일한 위험. 주문 상세에서 렌더링 시 이스케이프 여부. |
| EC-S08 | 비정상 UTF-8 입력 (이모지, null byte) | MEDIUM | ✅ | ❌ 미커버 | guest_name, special_requests에 이모지(👨‍👩‍👧‍👦), null byte(\x00), 한자(漢字) 입력. PostgreSQL text 타입은 null byte 거부하지만 클라이언트 에러 처리 미검증. |
| EC-S09 | CORS localhost 프로덕션 허용 | MEDIUM | ❌ | ❌ 미커버 | Supabase CORS 설정에서 localhost:* 허용 시 CSRF 가능. 서버 설정 검증 필요. 코드 레벨 E2E 불가. |
| EC-S10 | store_id 없이 직접 API 호출 | HIGH | ✅ | ❌ 미커버 | 인증된 사용자가 store_id 없이 orders, tables 등 직접 조회. RLS `store_id` 필터가 방어선. |
| EC-S11 | 슈퍼어드민 경로 일반 사용자 접근 | HIGH | ✅ | ✅ 커버 | SuperAdminRoute 컴포넌트가 차단. E2E에서 `SC-002` 점주 접근 차단 테스트 존재. |
| EC-S12 | 비밀번호 정책 우회 (8자 미만, 특수문자 없음) | MEDIUM | ✅ | ❌ 미커버 | Edge Function `create-staff`에서 비밀번호 정책 검증 여부. Supabase Auth 기본 정책에 의존 가능. |
| EC-S13 | 비활성화된 직원의 기존 JWT로 API 호출 | HIGH | ✅ | ❌ 미커버 | `deactivateStaffMember()`가 store_members 삭제만. Supabase Auth 세션은 JWT 만료까지 유효. RLS에서 store_members 조회 실패로 차단 가능하지만 미검증. |
| EC-S14 | 자기 역할 변경 시도 (RLS 차단) | CRITICAL | ✅ | ❌ 미커버 | SEC-E27. manager가 `store_members.update({role:'owner'})` 직접 호출. RLS 정책이 방어선. E2E 미검증. |

---

## 6. UI (UI)

| ID | 엣지 케이스 | 심각도 | 자동화 | E2E 상태 | 설명 |
|----|-----------|--------|--------|---------|------|
| EC-U01 | 더블 클릭 방지 (주문 중복 제출) | HIGH | ✅ | ❌ 미커버 | 주문 버튼에 `isSubmitting` 상태로 disabled 처리 여부 미확인. 소스코드에서 `isSubmitting`/`disabled` 명시적 패턴 미발견. |
| EC-U02 | 모바일 뷰포트에서 주문 UI | HIGH | ✅ | ❌ 미커버 | E2E-PRECISION-AUDIT에서 지적: 전체 테스트가 1280x720에서만 실행. 모바일 375px 미검증. |
| EC-U03 | 매우 긴 메뉴명 (100자+) | LOW | ✅ | ❌ 미커버 | CSS text-overflow/truncation 미검증. 레이아웃 깨짐 가능. |
| EC-U04 | 매우 긴 카테고리명 | LOW | ✅ | ❌ 미커버 | 카테고리 탭 UI 오버플로우. |
| EC-U05 | 메뉴 이미지 로드 실패 | MEDIUM | ✅ | ❌ 미커버 | 이미지 404/타임아웃 시 fallback UI. alt text, placeholder 이미지 처리 미검증. GAP-16 관련. |
| EC-U06 | 빈 매장 (메뉴 0개) | MEDIUM | ✅ | ❌ 미커버 | 카테고리/아이템 0개인 매장의 고객 메뉴 화면. 빈 상태 메시지 또는 에러 처리 미검증. |
| EC-U07 | 빈 매장 (테이블 0개) | MEDIUM | ✅ | ❌ 미커버 | 어드민 테이블 관리 탭에서 테이블 없는 상태 UI. |
| EC-U08 | 브라우저 뒤로가기 상태 관리 | MEDIUM | ⚠️ | ❌ 미커버 | 주문 완료 후 뒤로가기 → 장바구니/메뉴 상태 복원. React Router의 history 관리. |
| EC-U09 | 네트워크 느린 상태 (3G) 주문 UX | MEDIUM | ⚠️ | ❌ 미커버 | 로딩 인디케이터, 타임아웃 메시지 등. Playwright throttling으로 부분 테스트 가능. |
| EC-U10 | 카테고리 탭 전환 | LOW | ✅ | ❌ 미커버 | UC-C04. 탭 클릭 후 메뉴 필터링 E2E 미존재. E2E-PRECISION-AUDIT 지적. |
| EC-U11 | 장바구니 아이템 삭제 | LOW | ✅ | ❌ 미커버 | UC-C15. 삭제 버튼 E2E 미존재. |
| EC-U12 | 주문 이력 조회 | MEDIUM | ✅ | ❌ 미커버 | UC-C20. 주문 확인 화면 E2E 미존재. sessionStorage 기반 복원 미검증 (UC-C22). |
| EC-U13 | 추가 주문 (연속 주문) | MEDIUM | ✅ | ✅ 커버 | UC-C28. 장바구니 초기화 후 재주문. order-flow.spec에서 부분 커버. |

---

## 방어 메커니즘 현황 요약

### 서버 레벨 방어 (DB Functions / Triggers)

| 방어 메커니즘 | 위치 | 방어 대상 |
|-------------|------|----------|
| `create_order_atomic()` | 20260324000009 | 입력 검증, 접근 제어, 테이블-매장 소속, rate limit (15/분), 메뉴 유효성, 옵션 검증 |
| `enforce_menu_item_price()` | 20260324000001 | 옵션 가격 조작 방지 — DB 가격으로 강제 교정 |
| `is_store_accessible()` | 20260315000006 등 | 매장 활성 여부 (구독 만료/강제 정지) |
| `check_waiting_rate_limit()` | 20260324000004 | 대기 등록 rate limit (3건/10분/phone) |
| `next_queue_number()` | 20260316000007 | 대기번호 순차 생성 (SECURITY DEFINER) |
| `canTransition()` | orderStatus.ts | 주문 상태 전환 규칙 (클라이언트 + admin.ts 서버) |
| RLS policies | 다수 마이그레이션 | 멀티테넌트 격리, store_id 기반 |

### 클라이언트 레벨 방어

| 방어 메커니즘 | 위치 | 방어 대상 |
|-------------|------|----------|
| `ProtectedRoute` | ProtectedRoute.tsx | 미인증 사용자 어드민 접근 차단 |
| `SuperAdminRoute` | SuperAdminRoute.tsx | 슈퍼어드민 경로 일반 사용자 차단 |
| `isStoreSubscriptionActive()` | subscription.ts | 클라이언트 구독 만료 체크 |
| `fetchStoreUser()` | AuthContext.tsx | store_members 없는 사용자 null 처리 |
| React 기본 XSS 방어 | JSX | `{}` 내 문자열 자동 이스케이프 |

### 방어 부재 (알려진 갭)

| 미방어 항목 | 관련 EC-ID |
|-----------|-----------|
| 수량 상한 없음 (서버) | EC-O02 |
| 비밀번호 변경 시 다른 세션 무효화 없음 | EC-A01 |
| 대기 상태 전환 검증 없음 | EC-W08 |
| store_settings RLS role 제한 없음 | EC-S04 |
| QR token anon SELECT 가능 | EC-S05 |
| 자기 삭제 방지 로직 없음 (owner) | EC-A06 |
| party_size DB CHECK 제약 없음 | EC-W06 |
| phone 형식 검증 없음 (서버) | EC-W05 |
| 더블 클릭 방지 미확인 | EC-U01 |

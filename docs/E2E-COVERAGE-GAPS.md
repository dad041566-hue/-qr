# TableFlow E2E 테스트 커버리지 갭 분석

> 분석 일시: 2026-03-22
> 분석 방법: 3개 전문 에이전트 병렬 조사 (Coverage Analyst, Security Reviewer, Customer Flow Explorer)

## 현재 상태

- 전체 E2E: 75개 테스트, 8개 스펙 파일
- 커버 라우트: `/login`, `/admin`, `/m/:slug/:tableId`, `/waiting/:slug`, `/superadmin`, `/privacy`, `/terms`
- 미커버 라우트: `/` (랜딩), `/table/:id` (레거시)

---

## P0 — CRITICAL (데이터 손실 / 보안 / 금전)

| ID | 카테고리 | 엣지 케이스 | 현재 상태 |
|----|----------|------------|----------|
| SEC-E15 | 금전 | **옵션 가격 조작** — `enforce_menu_item_price` 트리거가 option 추가금을 검증 안 함. 클라이언트가 옵션 가격을 0으로 보내도 서버가 수락 | 미테스트 |
| SEC-E06 | 크로스테넌트 | **다른 매장 매출 조회** — Store A 점주가 `getDailyRevenue(storeB_id)` 호출 시 RLS만이 방어선 | 미테스트 |
| SEC-E01-05 | 크로스테넌트 | **Store A→Store B 데이터 접근** — 주문 수정/삭제/조회, 직원 조회/삭제 시 `store_id` 필터 없이 `id`만 사용 | 미테스트 |
| SEC-E27 | 권한 상승 | **자기 역할 변경** — manager가 `store_members.update({role:'owner'})` 직접 호출 시 RLS 차단 검증 | 미테스트 |
| GAP-07 | 주문 | **옵션 포함 주문 전체 미테스트** — `create_order_atomic`의 `selected_options` 경로가 E2E 커버 없음 | 미테스트 |
| GAP-23 | 고객 | **만료 매장 QR 접속** — `getStoreBySlug()`가 throw하지만 고객 화면 에러 표시 미검증 | 미테스트 |

## P1 — HIGH (기능 장애)

| ID | 카테고리 | 엣지 케이스 | 현재 상태 |
|----|----------|------------|----------|
| GAP-09 | 주문 | **주문 취소 플로우** — `updateOrderStatus('cancelled')` 후 고객/어드민 상태 미검증 | 미테스트 |
| GAP-10 | 주문 | **주문 삭제** — `deleteOrder()` E2E 미테스트 | 미테스트 |
| GAP-14 | 메뉴 | **카테고리 CRUD UI** — 카테고리 생성/수정/삭제 UI 전체 미테스트 (DB 직접 seed만) | 미테스트 |
| GAP-15 | 메뉴 | **메뉴 아이템 삭제 UI** — soft delete (`is_deleted=true`) 버튼 미테스트 | 미테스트 |
| GAP-19 | 권한 | **매니저 역할** — owner/staff만 테스트, manager 고유 권한(메뉴 수정 O, 직원 관리 X) 미검증 | 미테스트 |
| GAP-28 | 실시간 | **고객 주문 상태 실시간** — `useOrderStatus` 훅의 실시간 업데이트 미검증 | 미테스트 |
| GAP-36 | 대기 | **대기 큐 어드민 관리** — call/seat/no-show/cancel 액션 전체 미테스트 | 미테스트 |
| GAP-17 | 주문 | **복수 아이템 주문** — 2개 이상 다른 카테고리 아이템 동시 주문 미테스트 | 미테스트 |
| SEC-E07-10 | 권한 | **Staff API 레벨 차단** — UI 탭 숨김만 테스트, API 직접 호출 시 RLS 차단 미검증 | 미테스트 |
| SEC-E22 | 권한 | **store_settings RLS** — role 기반 제한 없음, staff도 API로 설정 수정 가능 | 미테스트 |
| SEC-E25 | DoS | **주문/대기 Rate Limiting** — 공개 API에 속도 제한 없음 | 미테스트 |
| GAP-25 | 슈퍼어드민 | **구독 기간 관리 UI** — `updateStoreSubscription()` E2E 미테스트 | 미테스트 |

## P2 — MEDIUM (UX / 비기능)

| ID | 카테고리 | 엣지 케이스 |
|----|----------|------------|
| GAP-01 | 랜딩 | `/` 홈페이지 E2E 없음 |
| GAP-05 | 로그인 | 잘못된 비밀번호 에러 메시지 표시 미검증 |
| GAP-16 | 메뉴 | 메뉴 이미지 업로드/표시 미테스트 |
| GAP-20 | 직원 | 삭제된 직원 재로그인 차단 미검증 |
| GAP-31 | 고객 | 레거시 `/table/:id` 라우트 테스트 없음 |
| GAP-33 | 고객 | 다중 카테고리 장바구니 합산 미검증 |
| GAP-39 | 대기 | `/waiting/nonexistent-slug` 에러 미검증 |
| SEC-E12-14 | XSS | `guest_name`, `special_requests`, `store_name`의 XSS 미검증 |
| SEC-E16 | 주문 | 비정상 수량 (quantity: 999999) 미검증 |
| SEC-E23 | 정보노출 | anon 사용자가 `tables` 테이블에서 QR token 열거 가능 |

---

## 즉시 필요한 E2E 테스트 (Top 10)

1. **옵션 포함 주문 생성** — `selectedOptions`로 주문 생성 후 총 가격 검증
2. **크로스테넌트 격리** — Store A 직원이 Store B 데이터 접근 시 RLS 차단 확인
3. **매니저 역할 테스트** — 매니저 생성 → 메뉴 수정 O, 직원 관리 X 검증
4. **주문 취소/삭제** — 어드민에서 취소/삭제 후 KDS + 고객 실시간 반영
5. **카테고리 CRUD UI** — 카테고리 추가/수정/삭제 전체 플로우
6. **고객 주문 상태 실시간** — 어드민이 "조리 시작" 클릭 → 고객 화면 반영
7. **대기 큐 어드민 관리** — 호출/착석/노쇼/취소 E2E
8. **만료 매장 QR 접속** — 고객이 만료 매장 QR 스캔 시 에러 화면 표시
9. **복수 아이템 + 다른 카테고리 주문** — 합산 금액 정확성
10. **잘못된 비밀번호 에러 표시** — 로그인 실패 시 사용자에게 명확한 피드백

---

## 보안 취약점 요약

### CRITICAL
- **옵션 가격 서버 검증 없음** — `enforce_menu_item_price` 트리거와 `create_order_atomic` 모두 option 추가금 무시

### HIGH
- **크로스테넌트 API 호출** — `admin.ts`의 `updateOrderStatus`, `deleteOrder`가 `store_id` 필터 없이 `id`만 사용 (RLS 의존)
- **store_settings RLS 누락** — role 제한 없이 모든 staff가 수정 가능
- **Rate Limiting 없음** — `createOrder`, `createWaiting` 공개 API

### MEDIUM
- CORS에서 `localhost:*` 프로덕션 허용
- QR token 열거 가능 (anon SELECT on `tables`)
- 비밀번호 변경 후 다른 세션 무효화 안 됨

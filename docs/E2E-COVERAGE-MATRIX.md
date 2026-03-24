# E2E Coverage Matrix — TableFlow

**문서 버전:** 1.0
**작성일:** 2026-03-24
**기준:** `npx playwright test --list` 출력 (총 106개 테스트, 11개 파일)

---

## 1. 테스트 인벤토리

### admin-gaps.spec.ts (8 tests)

| # | 테스트 | UC 매핑 |
|---|--------|---------|
| 1 | GAP-01: 랜딩 페이지 (/) 정상 렌더링 | — (랜딩 페이지) |
| 2 | [Setup] 슈퍼어드민 — 매장 생성 | UC-SA03 |
| 3 | [Setup] 점주 첫 로그인 → 비번 변경 | UC-S02 |
| 4 | [Setup] 매장 정보 추출 | UC-SA10 |
| 5 | [Setup] 점주 — 매니저 계정 생성 | UC-O01, UC-O02 |
| 6 | GAP-19: 매니저 — 메뉴 수정 O, 직원 관리 X 검증 | UC-M19, UC-M29 |
| 7 | GAP-14: 카테고리 CRUD — API 레벨 검증 | UC-M20 |
| 8 | GAP-36: 대기 큐 어드민 — 호출/착석/노쇼/취소 액션 | UC-S15~S18 |

### edge-cases.spec.ts (10 tests)

| # | 테스트 | UC 매핑 |
|---|--------|---------|
| 1 | SC-031: /privacy 페이지 정상 렌더링 | UC-C26 |
| 2 | SC-031: /terms 페이지 정상 렌더링 | UC-C27 |
| 3 | SC-035: 존재하지 않는 tableId 접근 시 에러/빈 상태 | UC-C24 |
| 4 | SC-030: 세션 만료 후 자동 리다이렉트 | UC-S04 |
| 5 | [Setup] 슈퍼어드민 — 매장 생성 | UC-SA03 |
| 6 | [Setup] 점주 첫 로그인 → 비번 변경 | UC-S02 |
| 7 | [Setup] 매장/테이블 정보 추출 | UC-SA10 |
| 8 | SC-007: 만료된 매장 접근 차단 | UC-S06, UC-C25 |
| 9 | SC-034: 약한 비밀번호로 매장 생성 시도 — 실패 확인 | UC-SA12 |
| 10 | SC-036: 동시 주문 race condition — 두 주문 모두 정상 INSERT | UC-C34 |
| 11 | SC-037: 대기번호 race condition — 동시 호출 시 순차 번호 반환 | UC-C36 (waiting) |
| 12 | SC-038: XSS — 메뉴명 특수문자 이스케이프 확인 | UC-C35 |
| 13 | SC-033: 중복 slug 매장 생성 시 오류 표시 | UC-SA11 |

### login.spec.ts (1 test)

| # | 테스트 | UC 매핑 |
|---|--------|---------|
| 1 | 슈퍼어드민 로그인 후 /superadmin 이동 | UC-SA01 |

### menu.spec.ts (10 tests)

| # | 테스트 | UC 매핑 |
|---|--------|---------|
| 1 | [Setup] 슈퍼어드민 — 매장 생성 | UC-SA03 |
| 2 | [Setup] 점주 첫 로그인 → 비번 변경 | UC-S02 |
| 3 | [Setup] 매장/테이블 정보 추출 + 메뉴 데이터 seed | UC-SA10 |
| 4 | SC-014: 메뉴 관리 탭 진입 — 등록된 메뉴 표시 | UC-M19 |
| 5 | SC-015: 메뉴 아이템 UI 등록 | UC-M21 |
| 6 | SC-016: 메뉴 수정 — 이름·가격 변경 | UC-M22 |
| 7 | SC-017: 메뉴 비활성화 — 품절 처리 | UC-M23 |
| 8 | SC-017-2: 고객 화면에서 품절 메뉴 미노출 확인 | UC-C06 |
| 9 | SC-018: 테이블 추가 | UC-M24 |
| 10 | SC-019: QR URL 유효성 — 고객 메뉴 정상 로딩 | UC-M25 |
| 11 | SC-021: 점주 매출 분석 탭 | UC-M26 |

### order-detail.spec.ts (6 tests)

| # | 테스트 | UC 매핑 |
|---|--------|---------|
| 1 | [Setup] 슈퍼어드민 — 매장 생성 | UC-SA03 |
| 2 | [Setup] 점주 첫 로그인 → 비번 변경 | UC-S02 |
| 3 | [Setup] 매장/테이블 정보 추출 + 메뉴 데이터 seed | UC-SA10 |
| 4 | SC-022: 장바구니 수량 변경 — +/- 버튼으로 수량 업데이트 | UC-C14 |
| 5 | SC-023: 빈 장바구니 주문 시도 — 주문 버튼 비활성 또는 미노출 | UC-C17 |
| 6 | RS-001: 고객 주문 이력 복구 — 새로고침 후 주문 이력 유지 | UC-C22 |
| 7 | RS-002: 다른 테이블과 스토리지 분리 | UC-C23 |

### order-flow.spec.ts (20 tests)

| # | 테스트 | UC 매핑 |
|---|--------|---------|
| 1 | [Setup] 슈퍼어드민 매장 생성 + 테이블 자동 생성 확인 | UC-SA03, UC-SA10 |
| 2 | [Setup] 점주 첫 로그인 → 비번 변경 → 어드민 진입 | UC-S02 |
| 3 | [Setup] 점주 어드민 — 메뉴 관리 탭 접근 | UC-M19 |
| 4 | [Setup] 점주 어드민 — 테이블 확인 후 tableId 추출 | UC-M24 |
| 5 | [Setup] 점주 — 메뉴 seed (카테고리 + 아이템) | UC-M20, UC-M21 |
| 6 | 고객 — 메뉴 화면 조회 | UC-C03, UC-C05 |
| 7 | 고객 주문 → 어드민 실시간 수신 (1초 이내) | UC-C18, UC-S10 |
| 8 | 알림/진동 동기화: 포그라운드 숨김 상태에서 주문 접수/상태 변경 | UC-S22 |
| 9 | 점주 어드민 — 직원 계정 생성 (UI 확인) | UC-O01 |
| 10 | 점주+직원 실시간 동기화: 주문 접수 및 조리 상태 반영 | UC-S10, UC-S11 |
| 11 | role 권한 제한 확인 | UC-S19, UC-S20, UC-S21 |
| 12 | SC-041: 실시간 채널 장애 복원성: 오프라인→온라인 전환 후 어드민 정상 동작 | UC-S09 |
| 13 | OD-002: 잘못된 메뉴 아이템으로 전체 주문 실패 | UC-C18 (error case) |
| 14 | OD-003: 빈 아이템 배열로 주문 차단 | UC-C17 |
| 15 | OD-004: 다른 매장 테이블로 주문 시도 시 차단 | UC-C31 |
| 16 | NT-001: 어드민 첫 진입 시 알림 권한 자동 요청 없음 | UC-S22 |
| 17 | NT-002: 첫 사용자 제스처 후 알림 권한 요청 | UC-S22 |
| 18 | NT-003: 권한 거부 시 안내 toast 표시 | UC-S22 |
| 19 | NT-004: 알림 권한 요청 반복 방지 | UC-S22 |
| 20 | NT-005: 백그라운드 탭에서 새 주문 알림 | UC-S23 |

### order-gaps.spec.ts (8 tests)

| # | 테스트 | UC 매핑 |
|---|--------|---------|
| 1 | [Setup] 슈퍼어드민 — 매장 생성 | UC-SA03 |
| 2 | [Setup] 점주 첫 로그인 → 비번 변경 | UC-S02 |
| 3 | [Setup] 매장/테이블 정보 추출 + 메뉴 데이터 seed (2카테고리 + 옵션) | UC-SA10 |
| 4 | GAP-07: 옵션 포함 주문 — create_order_atomic에서 옵션 가격 반영 검증 | UC-C09~C11, UC-C18 |
| 5 | SEC-E15: 옵션 가격 조작 — 클라이언트가 extra_price를 0으로 전송해도 서버가 실제 가격 반영 | UC-C32 |
| 6 | GAP-17: 2개 다른 카테고리 아이템 동시 주문 — 합산 금액 정확성 | UC-C30 |
| 7 | GAP-09: 어드민에서 주문 취소 후 상태 반영 | UC-S12 |
| 8 | GAP-28: 어드민 상태 변경 → 고객 페이지 실시간 반영 | UC-C21, UC-S11 |

### security-gaps.spec.ts (14 tests)

| # | 테스트 | UC 매핑 |
|---|--------|---------|
| 1 | [Setup] 슈퍼어드민 — Store A 생성 | UC-SA03 |
| 2 | [Setup] 슈퍼어드민 — Store B 생성 | UC-SA03 |
| 3 | [Setup] Owner A 첫 로그인 → 비번 변경 | UC-S02 |
| 4 | [Setup] Owner B 첫 로그인 → 비번 변경 | UC-S02 |
| 5 | [Setup] 매장/테이블 정보 추출 + 테스트 데이터 seed | UC-SA10 |
| 6 | SEC-E01: Store A 점주가 Store B 주문 조회 차단 | UC-M (RLS) |
| 7 | SEC-E02: Store A 점주가 Store B 주문 상태 변경 차단 | UC-M (RLS) |
| 8 | SEC-E03: Store A 점주가 Store B 주문 삭제 차단 | UC-M (RLS) |
| 9 | SEC-E04: Store A 점주가 Store B 직원 목록 조회 차단 | UC-M (RLS) |
| 10 | SEC-E06: Store A 점주가 Store B 매출 조회 차단 | UC-M (RLS) |
| 11 | [Setup] Store A에 매니저 계정 생성 | UC-O01, UC-O02 |
| 12 | SEC-E27: 매니저가 자기 역할을 owner로 변경 시도 차단 | UC-M30 |
| 13 | GAP-23: 만료 매장 QR 스캔 시 고객 에러 화면 표시 | UC-C25 |
| 14 | SEC-E22: staff가 store_settings UPDATE 차단 확인 | UC-S20 (RLS) |
| 15 | SEC-E25: 동일 테이블 1분 내 과도한 주문 차단 (rate limit) | UC-C33 |

### staff.spec.ts (15 tests)

| # | 테스트 | UC 매핑 |
|---|--------|---------|
| 1 | [Setup] 슈퍼어드민 — 매장 생성 | UC-SA03 |
| 2 | [Setup] 점주 첫 로그인 → 비번 변경 | UC-S02 |
| 3 | SC-011: 직원 계정 생성 | UC-O01 |
| 4 | SC-012: 직원 — 메뉴 관리 탭 접근 불가 | UC-S19 |
| 5 | SC-013: 직원 — 매장 설정 접근 불가 | UC-S20 |
| 6 | SC-032: 직원 계정 비활성화 (삭제) | UC-O03 |
| 7 | SC-029: 홈으로 나가기 → 홈 리다이렉트 | — |
| 8 | SC-002: 점주 — /superadmin 접근 차단 | UC-S21 |
| 9 | SC-005/006: 비로그인 — 보호 경로 접근 차단 | UC-S05 |
| 10 | SC-028: 매장 설정에서 비밀번호 변경 | UC-O05 |
| 11 | SB-002: 만료 매장 관리자 접근 차단 | UC-S06 |
| 12 | SB-003: 강제 정지 매장 관리자 차단 | UC-S07 |
| 13 | SB-004: 구독 체크 실패 + 캐시 없음 시 차단 | UC-S08 |
| 14 | SB-005: 구독 체크 실패 + 활성 캐시 있음 시 진입 유지 | UC-S09 |

### superadmin.spec.ts (2 tests)

| # | 테스트 | UC 매핑 |
|---|--------|---------|
| 1 | 1. 슈퍼어드민 매장 생성 | UC-SA03 |
| 2 | 2. 점주 첫 로그인 → 비번 변경 → 어드민 | UC-S02 |

### waiting.spec.ts (8 tests)

| # | 테스트 | UC 매핑 |
|---|--------|---------|
| 1 | [Setup] 슈퍼어드민 — 매장 생성 | UC-SA03 |
| 2 | [Setup] 점주 첫 로그인 → 비밀번호 변경 | UC-S02 |
| 3 | [Setup] storeId 추출 | — |
| 4 | SC-026: 대기 키오스크 UI — 전화번호 키패드 + 인원 선택 화면 검증 | UC-C36 |
| 5 | SC-026/027: 대기 등록 API 검증 — RPC + INSERT + 조회 | UC-C36 |
| 6 | RS-003: 손상된 sessionStorage 복구 | UC-C36 (resilience) |
| 7 | RS-004: 대기 등록 후 새로고침 시 상태 복구 | UC-C36 (resilience) |

---

## 2. 역할별 커버리지 테이블

| 역할 | 총 UC | E2E 커버 | 커버율 |
|------|-------|---------|-------|
| Customer (UC-C) | 36 | 18 | ~50% |
| Staff (UC-S) | 23 | 18 | ~78% |
| Manager (UC-M) | 30 | 14 | ~47% |
| Owner (UC-O) | 5 | 5 | 100% |
| Superadmin (UC-SA) | 13 | 8 | ~62% |
| **전체** | **107** | **63** | **~59%** |

### Customer 커버 현황

| UC-ID | 커버 | 테스트 |
|-------|------|--------|
| UC-C03 | ✅ | order-flow: 고객 메뉴 화면 조회 |
| UC-C05 | ✅ | order-flow: 고객 메뉴 화면 조회 |
| UC-C06 | ✅ | menu: SC-017-2 |
| UC-C09~C11 | ✅ | order-gaps: GAP-07 |
| UC-C14 | ✅ | order-detail: SC-022 |
| UC-C17 | ✅ | order-detail: SC-023, order-flow: OD-003 |
| UC-C18 | ✅ | order-flow: 주문→어드민 실시간 수신 |
| UC-C21 | ✅ | order-gaps: GAP-28 |
| UC-C22 | ✅ | order-detail: RS-001 |
| UC-C23 | ✅ | order-detail: RS-002 |
| UC-C24 | ✅ | edge-cases: SC-035 |
| UC-C25 | ✅ | edge-cases: SC-007, security-gaps: GAP-23 |
| UC-C26 | ✅ | edge-cases: SC-031 |
| UC-C27 | ✅ | edge-cases: SC-031 |
| UC-C30 | ✅ | order-gaps: GAP-17 |
| UC-C31 | ✅ | order-flow: OD-004 |
| UC-C32 | ✅ | order-gaps: SEC-E15 |
| UC-C33 | ✅ | security-gaps: SEC-E25 |
| UC-C34 | ✅ | edge-cases: SC-036 |
| UC-C35 | ✅ | edge-cases: SC-038 |
| UC-C36 | ✅ | waiting: SC-026/027, RS-003, RS-004 |
| UC-C07~C08 | ❌ | 옵션 선택 모달 UI 미커버 |
| UC-C12~C13 | ❌ | 장바구니 추가 직접 UI 미커버 |
| UC-C15~C16 | ❌ | 장바구니 삭제/합계 미커버 |
| UC-C19~C20 | ❌ | 주문 완료 확인/이력 조회 UI 미커버 |
| UC-C28~C29 | ❌ | 추가 주문/옵션없는 주문 미커버 |

---

## 3. 플로우별 커버리지

### Flow 1: 고객 QR 주문 여정 (UC-C01~C36)

| 단계 | UC | 커버 | 테스트 |
|------|-----|------|--------|
| QR 스캔 → 페이지 로드 | UC-C01~C03 | 부분 | order-flow step 5 |
| 매장 활성 체크 | UC-C02, C25 | ✅ | edge-cases SC-007 |
| 메뉴 탐색 | UC-C04~C06 | 부분 | menu SC-017-2 |
| 옵션 선택 | UC-C07~C11 | 부분 | order-gaps GAP-07 |
| 장바구니 관리 | UC-C12~C17 | 부분 | order-detail SC-022, SC-023 |
| 주문 제출 | UC-C18~C19 | ✅ | order-flow step 6 |
| 주문 이력/상태 | UC-C20~C21 | ✅ | order-gaps GAP-28 |
| 복구/격리 | UC-C22~C23 | ✅ | order-detail RS-001, RS-002 |
| 보안/Race | UC-C31~C35 | ✅ | order-flow, order-gaps, edge-cases |

### Flow 2: 직원/점주 주문 처리 여정

| 단계 | UC | 커버 | 테스트 |
|------|-----|------|--------|
| 로그인/인증 | UC-S01~S04 | ✅ | staff SB-002~004, SC-030 |
| 첫 비번 변경 | UC-S02 | ✅ | 모든 spec setup |
| 구독 체크 | UC-S06~S09 | ✅ | staff SB-002~005 |
| 실시간 주문 수신 | UC-S10 | ✅ | order-flow step 7, 8 |
| 주문 상태 변경 | UC-S11 | ✅ | order-flow step 8 |
| 주문 취소 | UC-S12 | ✅ | order-gaps GAP-09 |
| 테이블 현황 | UC-S13 | 부분 | order-flow step 4 (추출만) |
| 대기 관리 | UC-S14~S18 | ✅ | admin-gaps GAP-36 |
| 권한 제한 | UC-S19~S21 | ✅ | staff SC-012, SC-013, SC-002 |

### Flow 3: 점주 매장 셋업 여정

| 단계 | UC | 커버 | 테스트 |
|------|-----|------|--------|
| 매장 생성 | UC-SA03 | ✅ | 모든 spec setup |
| 테이블 자동 생성 | UC-SA10 | ✅ | order-flow step 1 |
| 이용 기간 설정 | UC-SA05 | 부분 | edge-cases SC-007 (만료 시나리오) |
| 점주 계정 생성 | UC-SA06 | ✅ | 모든 spec setup |
| 메뉴 생성 | UC-M20~M21 | ✅ | menu SC-014~015 |
| 직원 계정 생성 | UC-O01 | ✅ | staff SC-011, order-flow step 7 |

### Flow 4: 대기 키오스크 여정

| 단계 | UC | 커버 | 테스트 |
|------|-----|------|--------|
| 키오스크 UI 접근 | UC-C36 | ✅ | waiting SC-026 |
| 대기 등록 API | UC-C36 | ✅ | waiting SC-026/027 |
| sessionStorage 복구 | UC-C36 | ✅ | waiting RS-003, RS-004 |
| 어드민 대기 관리 | UC-S14~S18 | ✅ | admin-gaps GAP-36 |

### Flow 5: 구독 만료/복구 여정

| 단계 | UC | 커버 | 테스트 |
|------|-----|------|--------|
| 만료 후 점주 차단 | UC-S06 | ✅ | staff SB-002 |
| 강제 정지 차단 | UC-S07 | ✅ | staff SB-003 |
| 구독 체크 실패 | UC-S08~S09 | ✅ | staff SB-004, SB-005 |
| 고객 QR 차단 | UC-C25 | ✅ | security-gaps GAP-23 |
| 기간 연장/복구 | UC-SA08~SA09 | ❌ | 미커버 |

---

## 4. 갭 분석 (미커버 UC)

### P0 미커버 (즉시 추가 권장)

| UC-ID | 설명 | 이유 |
|-------|------|------|
| UC-C07~C08 | 옵션 선택 모달 진입/UI | 주문의 핵심 경로인데 UI 레벨 미커버 |
| UC-C12~C13 | 아이템 수량 설정 + 장바구니 추가 | 장바구니 추가 직접 플로우 없음 |
| UC-SA08~SA09 | 기간 연장/강제 정지 해제 후 복구 | 만료 시나리오는 있으나 복구 미커버 |

### P1 미커버 (중요)

| UC-ID | 설명 | 이유 |
|-------|------|------|
| UC-C15~C16 | 장바구니 아이템 삭제, 합계 확인 | 장바구니 전체 플로우 불완전 |
| UC-C19~C20 | 주문 완료 메시지, 이력 조회 UI | 주문 후 UX 미검증 |
| UC-C28 | 주문 후 추가 주문 (연속 주문) | 일반적인 식당 사용 패턴 |
| UC-M27~M28 | 이벤트/고객 관리 탭 (Mock) | Mock이지만 접근 권한은 검증 필요 |
| UC-SA04 | 매장 수정 | 생성만 테스트, 수정 미커버 |
| UC-SA07 | 매장 강제 정지 UI | staff SB-003은 이미 정지된 상태 테스트 |

### P2 미커버 (낮은 우선순위)

| UC-ID | 설명 | 이유 |
|-------|------|------|
| UC-C04 | 카테고리 탭 전환 UI | |
| UC-C29 | 옵션 없는 메뉴 직접 주문 | |
| UC-S03 | 로그아웃 플로우 | |
| UC-SA02 | 매장 목록 조회 UI | superadmin.spec에 없음 |
| UC-SA13 | /superadmin 접근 차단 — 점주 | staff SC-002로 커버되나 superadmin.spec 별도 없음 |
| UC-O04 | 매장 설정 탭 접근 | SC-028 비번 변경으로 부분 커버 |

---

## 5. 수동 검증 체크리스트

E2E로 커버되지 않는 항목 — 수동 QA 필요:

### Customer 수동 검증

- [ ] UC-C07: 옵션 선택 모달 — 필수 옵션 미선택 시 주문 불가 표시
- [ ] UC-C08: 옵션 그룹별 min/max 제한 동작
- [ ] UC-C12: 수량 0 이하 설정 차단
- [ ] UC-C15: 장바구니 아이템 X 버튼으로 삭제
- [ ] UC-C16: 장바구니 합계 = sum(단가 × 수량 + 옵션가격) 정확성
- [ ] UC-C19: 주문 제출 후 성공 토스트/메시지 표시
- [ ] UC-C20: 동일 테이블 이전 주문 이력 목록 표시
- [ ] UC-C28: 주문 완료 후 재주문 — 장바구니 초기화 후 정상 플로우

### Admin 수동 검증

- [ ] UC-S03: 로그아웃 후 세션 완전 삭제, `/login`으로 이동
- [ ] UC-S13: 테이블 상태 변경 (available ↔ occupied ↔ cleaning) UI
- [ ] UC-M27: 이벤트 관리 탭 — manager/owner 접근 O, staff 차단
- [ ] UC-M28: 고객 관리 탭 — manager/owner 접근 O, staff 차단
- [ ] UC-O04: 매장 설정 탭 — owner만 접근 가능 확인

### Superadmin 수동 검증

- [ ] UC-SA02: 매장 목록 — 전체 매장 페이지네이션, 검색
- [ ] UC-SA04: 매장 정보 수정 (이름, 주소, 전화번호)
- [ ] UC-SA07: 강제 정지 버튼 → 즉시 로그인 차단 확인
- [ ] UC-SA08: 강제 정지 해제 → 즉시 복구 확인
- [ ] UC-SA09: 이용 기간 연장 → 만료 매장 즉시 복구 확인

### 모바일/크로스브라우저 수동 검증

- [ ] 실제 QR 코드 카메라 스캔 → `/m/:storeSlug/:tableId` 진입
- [ ] iOS Safari에서 장바구니 sessionStorage 동작
- [ ] Android Chrome에서 PWA 설치 후 알림 권한
- [ ] 터치 환경에서 옵션 선택 모달 스크롤

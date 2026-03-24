# E2E 정밀 감사 보고서 — UC↔E2E↔모바일 UI 일치성

**작성일**: 2026-03-24
**범위**: 전체 E2E 스펙 파일 + Playwright 설정 + UC 시나리오 대조

---

## Executive Summary

전체 E2E 테스트 스위트에서 **3개의 구조적 문제**가 발견되었다.

| # | 문제 | 영향 범위 | 심각도 |
|---|------|-----------|--------|
| 1 | **모바일 뷰포트 미설정** — `playwright.config.ts`에 `projects` 배열 없음. 전체 테스트가 기본값 1280×720에서만 실행됨. `page.setViewportSize()` 호출 0건. | 전체 테스트 | HIGH |
| 2 | **API Fallback 테스트** — UI 클릭 대신 REST API 직접 호출로 상태 변경. UC 시나리오와 실행 경로 불일치. | 3개 테스트 | MEDIUM |
| 3 | **Stub 테스트** — `test.skip(true)` 4건, `expect(true).toBeTruthy()` 2건. 실제 검증 없는 공석 자리 차지. | 6개 테스트 | MEDIUM |

---

## Flow 1 — 고객 주문 (Customer Order Flow)

| Step | UC-ID | E2E Test | UI Match | Mobile | Gap |
|------|-------|----------|----------|--------|-----|
| 메뉴 화면 진입 | UC-C01 | order-flow: 메뉴 로드 | ✅ | ⚠️ | 뷰포트 1280px, 모바일 미검증 |
| 카테고리 탭 전환 | UC-C04 | ❌ 없음 | ❌ | ❌ | 탭 클릭 E2E 미존재 |
| 아이템 선택 | UC-C06 | order-flow: 아이템 추가 | ✅ | ⚠️ | 모바일 레이아웃 미검증 |
| 다중 옵션 선택 | UC-C10 | ❌ 없음 | ❌ | ❌ | 옵션 선택 E2E 미존재 |
| 장바구니 확인 | UC-C12 | order-flow: 장바구니 | ✅ | ⚠️ | 모바일 bottom sheet 미검증 |
| 장바구니 아이템 삭제 | UC-C15 | ❌ 없음 | ❌ | ❌ | 삭제 UI E2E 미존재 |
| 주문 제출 | UC-C18 | order-flow: 주문 제출 | ✅ | ⚠️ | 모바일 미검증 |
| 주문 내역 조회 | UC-C20 | ❌ 없음 | ❌ | ❌ | 주문 확인 UI E2E 미존재 |
| 추가 주문 | UC-C28 | ❌ 없음 | ❌ | ❌ | 연속 주문 플로우 미검증 |

**Flow 1 소결**: 9단계 중 4단계만 커버. UC-C04, C10, C15, C20, C28 미검증.

---

## Flow 2 — 어드민 주문 관리 (Admin Order Management)

| Step | UC-ID | E2E Test | UI Match | Mobile | Gap |
|------|-------|----------|----------|--------|-----|
| 어드민 로그인 | UC-A01 | order-flow: 어드민 로그인 | ✅ | N/A | — |
| 실시간 주문 수신 | UC-A05 | order-flow: 실시간 수신 | ✅ | N/A | — |
| 주문 상태 변경 | UC-A08 | order-flow: 상태 변경 | ✅ | N/A | — |
| 주문 취소 | UC-A12 | GAP-09: 주문 취소 | 🔀 | N/A | API 직접 호출 (UI 아님) |
| KDS 화면 접근 | UC-A15 | GAP-KDS | ✅ | N/A | — |
| 매출 탭 조회 | UC-A20 | GAP-REVENUE | ✅ | N/A | — |
| 테이블 상태 관리 | UC-A22 | order-flow: 테이블 확인 | ✅ | N/A | — |

**Flow 2 소결**: 7단계 중 6단계 커버. UC-A12는 API fallback으로 UI 경로 불일치.

---

## Flow 3 — 메뉴 관리 (Menu Admin Flow)

| Step | UC-ID | E2E Test | UI Match | Mobile | Gap |
|------|-------|----------|----------|--------|-----|
| 카테고리 생성 | UC-M01 | GAP-14: 카테고리 CRUD | 🔀 | N/A | API 직접 호출 |
| 카테고리 수정 | UC-M03 | GAP-14: 카테고리 CRUD | 🔀 | N/A | API 직접 호출 |
| 카테고리 삭제 | UC-M05 | GAP-14: 카테고리 CRUD | 🔀 | N/A | API 직접 호출 |
| 메뉴 아이템 생성 | UC-M08 | menu.spec: 아이템 생성 | ✅ | N/A | — |
| 메뉴 아이템 수정 | UC-M10 | menu.spec: 아이템 수정 | ✅ | N/A | — |
| 메뉴 아이템 비활성화 | UC-M15 | UC-M15: soft delete | ✅ | N/A | — |
| 메뉴 이미지 업로드 | UC-M18 | ❌ 없음 | ❌ | N/A | Storage 업로드 E2E 미존재 |

**Flow 3 소결**: 7단계 중 4단계 UI 커버. 카테고리 CRUD 3개 API fallback.

---

## Flow 4 — 직원 관리 (Staff Management Flow)

| Step | UC-ID | E2E Test | UI Match | Mobile | Gap |
|------|-------|----------|----------|--------|-----|
| 직원 계정 생성 | SC-011 | staff.spec: 직원 생성 | ✅ | N/A | — |
| 직원 비밀번호 변경 | SC-028 | staff.spec: 비번 변경 | ✅ | N/A | — |
| 직원 비활성화 | SC-032 | staff.spec: 비활성화 | ✅ | N/A | — |
| 직원 메뉴 탭 접근 제한 | SC-013 | staff.spec: 권한 제한 | ✅ | N/A | — |
| 구독 체크 실패 시 차단 | SB-004 | SB-004 | ⚠️ | N/A | `expect(true).toBeTruthy()` — stub |
| 만료 매장 차단 | SB-005 | SB-005 | ⚠️ | N/A | `test.skip(true)` — stub |

**Flow 4 소결**: 6단계 중 4단계 실질 커버. SB-004/005 stub으로 구독 차단 로직 미검증.

---

## Flow 5 — 대기 키오스크 (Waiting Kiosk Flow)

| Step | UC-ID | E2E Test | UI Match | Mobile | Gap |
|------|-------|----------|----------|--------|-----|
| 대기 접수 | UC-W01 | waiting.spec: 접수 | ✅ | ⚠️ | 키오스크 해상도 미설정 |
| 대기 번호 발급 | UC-W03 | waiting.spec: 번호 발급 | ✅ | ⚠️ | — |
| 어드민 대기 조회 | UC-W10 | GAP-36: 대기 어드민 | 🔀 | N/A | API 직접 호출 |
| 대기 알림 | UC-W15 | NT-002 | ❌ | N/A | `test.skip(true)` — stub |
| 푸시 알림 권한 | NT-003 | NT-003 | ❌ | N/A | `test.skip(true)` — stub |
| 알림 수신 확인 | NT-004 | NT-004 | ❌ | N/A | `test.skip(true)` — stub |
| 알림 설정 변경 | NT-005 | NT-005 | ❌ | N/A | `test.skip(true)` — stub |

**Flow 5 소결**: 7단계 중 2단계 실질 커버. 알림 관련 NT-002~005 전체 stub.

---

## Key Findings

### F-001: 모바일 뷰포트 전무

`playwright.config.ts`에 `projects` 배열이 없다. `use.viewport` 설정도 없다. 결과적으로 **전체 테스트가 Chromium 기본값 1280×720**에서만 실행된다. `/m/:storeSlug/:tableId` 고객 메뉴는 모바일 전용 UI임에도 데스크톱 해상도에서만 테스트된다.

```ts
// 현재 playwright.config.ts — viewport 설정 없음
export default defineConfig({
  use: {
    baseURL: 'http://localhost:5173',
    // viewport 없음
  },
  // projects 없음
})
```

### F-002: API Fallback 3건

| 테스트 ID | 파일 | 실제 동작 |
|-----------|------|-----------|
| GAP-09 | `admin-gaps.spec.ts` | 주문 취소: UI 버튼 클릭 대신 REST API PATCH |
| GAP-14 | `admin-gaps.spec.ts` | 카테고리 CRUD: UI 폼 대신 REST API POST/PATCH/DELETE |
| GAP-36 | `admin-gaps.spec.ts` | 대기 어드민: UI 조회 대신 REST API GET |

### F-003: Stub 테스트 6건

| 테스트 ID | 파일 | stub 방식 |
|-----------|------|-----------|
| NT-002 | `edge-cases.spec.ts` | `test.skip(true)` |
| NT-003 | `edge-cases.spec.ts` | `test.skip(true)` |
| NT-004 | `edge-cases.spec.ts` | `test.skip(true)` |
| NT-005 | `edge-cases.spec.ts` | `test.skip(true)` |
| SB-004 | `edge-cases.spec.ts` | `expect(true).toBeTruthy()` |
| SB-005 | `edge-cases.spec.ts` | `test.skip(true)` |

### F-004: 누락된 고객 여정 단계

UC 문서에 있으나 E2E 미존재: UC-C04 (카테고리 탭), UC-C10 (다중 옵션), UC-C15 (장바구니 삭제), UC-C20 (주문 내역 UI), UC-C28 (추가 주문).

---

## Priority Recommendations

### P0 — 즉시 (모바일 뷰포트 설정)

```ts
// playwright.config.ts에 추가
projects: [
  { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  { name: 'mobile', use: { ...devices['Pixel 5'] } },
],
```

고객 메뉴 테스트(`order-flow.spec.ts`)는 `mobile` 프로젝트에서만 실행되도록 태그 분리.

### P1 — 단기 (API Fallback → UI 전환)

GAP-09, GAP-14, GAP-36: REST API 호출을 실제 UI 인터랙션(`page.click()`, `page.fill()`)으로 교체. 목표: UC 시나리오와 실행 경로 일치.

### P2 — 중기 (Stub 교체 또는 명시적 제외)

- **NT-002~005**: 알림 테스트는 브라우저 권한 API 모킹 필요. `page.context().grantPermissions(['notifications'])` 활용하거나 명시적으로 `// TODO: notification API mock 필요` 주석 후 별도 추적.
- **SB-004, SB-005**: 구독 만료 시나리오는 테스트용 만료 매장 fixture 생성 후 실질 검증으로 교체.

### P3 — 장기 (누락 UC 커버리지)

UC-C04 카테고리 탭, UC-C10 옵션 선택, UC-C15 장바구니 삭제, UC-C20 주문 내역, UC-C28 추가 주문 — 5개 신규 E2E 시나리오 작성.

---

## 현황 요약

| 지표 | 현재 | 목표 |
|------|------|------|
| 모바일 뷰포트 테스트 | 0% | 고객 메뉴 100% |
| UC 단계 E2E 커버 | ~62% | 85%+ |
| API Fallback | 3건 | 0건 |
| Stub 테스트 | 6건 | 0건 (교체 또는 명시 제외) |

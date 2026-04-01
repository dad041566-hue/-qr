# TableFlow E2E 테스트 리포트 가이드

> 최종 업데이트: 2026-03-22

## HTML 리포트 생성 & 열기

```bash
# 테스트 실행 + HTML 리포트 자동 생성
npm run test:e2e

# 이전 리포트 다시 열기 (테스트 재실행 없이)
npm run test:report:open

# 테스트 + 리포트 열기 한번에
npm run test:e2e:report
```

리포트 파일 위치:
- **HTML 리포트**: `test-reports/html/index.html` (브라우저에서 바로 열기 가능)
- **JSON 결과**: `test-reports/results.json` (CI/CD 연동용)
- **실패 스크린샷**: `test-results/` (실패 시 자동 캡처)
- **실패 비디오**: `test-results/` (실패 시 자동 녹화)
- **Trace 파일**: `test-results/` (첫 번째 재시도 시 자동 생성)

> `test-reports/`, `test-results/`, `playwright-report/`는 `.gitignore`에 포함되어 있어 커밋되지 않습니다.

---

## 테스트 구조 요약

| 파일 | 테스트 그룹 | 시나리오 수 | 모드 |
|------|------------|-----------|------|
| `login.spec.ts` | 슈퍼어드민 로그인 | 1 | 독립 |
| `superadmin.spec.ts` | 매장 생성 → 점주 첫 로그인 | 2 | 독립 |
| `menu.spec.ts` | 메뉴 CRUD (SC-014~SC-021) | 10 | serial |
| `order-flow.spec.ts` | 주문 전체 플로우 + 알림 | 20 | serial |
| `order-detail.spec.ts` | 장바구니 + 새로고침 복구 | 8 | serial |
| `staff.spec.ts` | 직원 관리 + 권한 + 구독 | 12 | serial |
| `waiting.spec.ts` | 대기 키오스크 + 새로고침 복구 | 7 | serial |
| `edge-cases.spec.ts` | 보안 + 엣지케이스 | 7 | mixed |

**총 테스트: ~67개**

---

## Use Case & Flow 상세

### 1. 인증 플로우 (Authentication)

```
[사용자]──→ /login ──→ 이메일+비번 입력 ──→ Supabase Auth
                                              │
                                   ┌──────────┼──────────┐
                                   ▼          ▼          ▼
                              superadmin   첫 로그인    일반 로그인
                              /superadmin  /change-pw   /admin
```

| ID | 시나리오 | 파일 | 검증 내용 |
|----|---------|------|----------|
| LOGIN-001 | 슈퍼어드민 로그인 | `login.spec.ts` | 이메일/비번 → `/superadmin` 이동 |
| SA-001 | 매장 생성 후 점주 계정 생성 | `superadmin.spec.ts` | 슈퍼어드민 → 매장추가 → 점주 이메일/비번 설정 |
| SA-002 | 점주 첫 로그인 → 비번 변경 | `superadmin.spec.ts` | 임시비번 → `/change-password` 강제 이동 → 새 비번 설정 → `/admin` |
| SC-005/006 | 비로그인 보호 경로 차단 | `staff.spec.ts` | `/admin`, `/change-password` 접근 → `/login` 리다이렉트 |
| SC-002 | 점주 → /superadmin 접근 차단 | `staff.spec.ts` | 매장추가 버튼, 매장 테이블 미노출 |
| SC-030 | 세션 만료 자동 리다이렉트 | `edge-cases.spec.ts` | localStorage 세션 삭제 → 새로고침 → `/login` 이동 |
| SC-034 | 약한 비밀번호 매장 생성 차단 | `edge-cases.spec.ts` | 4자리 비번 → 에러 메시지 또는 모달 유지 |

### 2. 매장/메뉴 관리 플로우 (Store & Menu Management)

```
[점주] ──→ 어드민 ──→ 매장 관리 ──→ 메뉴 관리 ──→ CRUD 작업
                                  │
                                  ├── QR 관리 ──→ 테이블 추가
                                  ├── 매출 분석
                                  └── 매장 설정 ──→ 비밀번호 변경
```

| ID | 시나리오 | 파일 | 검증 내용 |
|----|---------|------|----------|
| SC-014 | 메뉴 관리 탭 진입 | `menu.spec.ts` | 등록된 메뉴(seed 데이터) 정상 표시 |
| SC-015 | 메뉴 아이템 UI 등록 | `menu.spec.ts` | 새 메뉴 등록 모달 → 이름/카테고리/가격 입력 → 등록 성공 toast |
| SC-016 | 메뉴 수정 (이름·가격) | `menu.spec.ts` | 메뉴 카드 수정 버튼 → 모달에서 변경 → 수정 성공 toast |
| SC-017 | 메뉴 비활성화 (품절) | `menu.spec.ts` | 판매중(ON) → 품절(OFF) 토글 → 상태 변경 확인 |
| SC-017-2 | 품절 메뉴 고객 미노출 | `menu.spec.ts` | 고객 화면에서 품절 메뉴 미표시, 판매중 메뉴만 표시 |
| SC-018 | 테이블 추가 | `menu.spec.ts` | QR 관리 → 테이블 추가 버튼 → DB에서 테이블 수 확인 |
| SC-019 | QR URL 유효성 | `menu.spec.ts` | `/m/:storeSlug/:qrToken` → 오류 없이 메뉴 정상 로딩 |
| SC-021 | 매출 분석 탭 | `menu.spec.ts` | 매장 관리 → 매출 분석 → 매출/통계/분석 텍스트 확인 |
| SC-028 | 매장 설정 비밀번호 변경 | `staff.spec.ts` | 새 비밀번호 입력 → 변경 성공 toast |

### 3. 고객 주문 플로우 (Customer Ordering)

```
[고객] ──→ QR 스캔 ──→ /m/:slug/:token ──→ 메뉴 조회
                                            │
                                    메뉴 카드 클릭 ──→ 모달 (담기)
                                            │
                                    장바구니 확인 ──→ 수량 +/-
                                            │
                                    주문하기 ──→ 주문 접수 성공
                                            │
                              ┌─────────────┼─────────────┐
                              ▼             ▼             ▼
                        [Realtime]     [DB INSERT]    [KDS 카드]
                        점주 수신      orders 테이블    어드민 표시
```

| ID | 시나리오 | 파일 | 검증 내용 |
|----|---------|------|----------|
| OF-005 | 고객 메뉴 화면 조회 | `order-flow.spec.ts` | QR 토큰으로 메뉴 정상 로딩, seed 메뉴 표시 |
| OF-006 | 고객 주문 → 어드민 실시간 수신 | `order-flow.spec.ts` | 주문 접수 → 1초 이내 어드민 KDS 카드 표시 |
| SC-022 | 장바구니 수량 변경 | `order-detail.spec.ts` | +/- 버튼 → 금액 업데이트 (10,000 ↔ 20,000원) |
| SC-023 | 빈 장바구니 주문 차단 | `order-detail.spec.ts` | 아이템 없이 주문하기 버튼 비활성 또는 미노출 |
| OD-002 | 잘못된 메뉴 아이템 주문 실패 | `order-flow.spec.ts` | 존재하지 않는 menu_item_id → 에러 응답 |
| OD-003 | 빈 아이템 배열 주문 차단 | `order-flow.spec.ts` | items=[] → 주문 INSERT 차단 |
| OD-004 | 다른 매장 테이블 주문 차단 | `order-flow.spec.ts` | 타 매장 table_id → RLS 또는 FK 위반으로 차단 |

### 4. 주문 처리 플로우 (Order Processing — KDS)

```
[어드민 KDS]
     │
     ▼
  신규 주문 ──→ "접수" 버튼 ──→ 조리중 상태
     │                           │
     │                    "완료" 버튼 ──→ 완료 상태
     │
  [Realtime 구독]
     │
     ├── 점주 브라우저 A: 실시간 반영
     └── 직원 브라우저 B: 동시에 실시간 반영
```

| ID | 시나리오 | 파일 | 검증 내용 |
|----|---------|------|----------|
| OF-006 | 주문 → 접수 → 조리중 → 완료 | `order-flow.spec.ts` | KDS 카드에서 "접수" → "조리 완료" 버튼 순차 클릭 |
| OF-008 | 점주+직원 실시간 동기화 | `order-flow.spec.ts` | 두 브라우저에서 동일 주문 상태 실시간 동기화 |
| OF-010 | 포그라운드 숨김 상태 알림 | `order-flow.spec.ts` | 브라우저 hidden 상태에서 Notification + vibrate 발생 |

### 5. 알림 시스템 플로우 (Notifications)

```
[새 주문 Realtime 이벤트]
         │
         ▼
  Notification.permission 확인
         │
    ┌────┼────┐
    ▼         ▼
  granted   default/denied
    │         │
    ▼         ▼
  new Notification()  안내 toast
  navigator.vibrate()
```

| ID | 시나리오 | 파일 | 검증 내용 |
|----|---------|------|----------|
| NT-001 | 첫 진입 시 권한 자동 요청 없음 | `order-flow.spec.ts` | 페이지 로드 → `requestPermission()` 호출 안 됨 |
| NT-002 | 첫 사용자 제스처 후 권한 요청 | `order-flow.spec.ts` | 버튼 클릭 등 제스처 → `requestPermission()` 1회 호출 |
| NT-003 | 권한 거부 시 안내 toast | `order-flow.spec.ts` | permission=denied → "알림을 받을 수 없습니다" 표시 |
| NT-004 | 알림 권한 요청 반복 방지 | `order-flow.spec.ts` | 2회 연속 제스처 → 요청 1회만 실행 |
| NT-005 | 백그라운드 탭 새 주문 알림 | `order-flow.spec.ts` | 탭 hidden 상태에서 주문 → Notification 발생 확인 |

### 6. 직원 관리 플로우 (Staff Management)

```
[점주] ──→ 매장 관리 ──→ 직원 관리
                          │
                  ┌───────┼───────┐
                  ▼       ▼       ▼
              직원 추가  권한 확인  직원 삭제
              (이메일+   (메뉴관리  (Trash2
               비번)     접근불가)   아이콘)
```

| ID | 시나리오 | 파일 | 검증 내용 |
|----|---------|------|----------|
| SC-011 | 직원 계정 생성 | `staff.spec.ts` | 직원 추가 모달 → 이름/이메일/비번 → 생성 성공 toast |
| SC-012 | 직원 — 메뉴 관리 접근 불가 | `staff.spec.ts` | staff 역할 로그인 → "매장 관리", "메뉴 관리" 버튼 미노출 |
| SC-013 | 직원 — 매장 설정 접근 불가 | `staff.spec.ts` | staff 역할 → "설정", "직원 관리" 버튼 미노출 |
| SC-032 | 직원 계정 삭제 | `staff.spec.ts` | 삭제 버튼 → confirm → "직원이 삭제됐습니다" toast |
| SC-029 | 홈으로 나가기 | `staff.spec.ts` | 사이드바 "홈으로 나가기" → `/` 이동 |
| OF-007 | 직원 계정 생성 (UI 확인) | `order-flow.spec.ts` | 직원 추가 폼 → 이메일/비번 설정 → 완료 |
| OF-009 | role 권한 제한 확인 | `order-flow.spec.ts` | staff → 매장관리/직원관리 탭 미노출 |

### 7. 대기 키오스크 플로우 (Waiting Kiosk)

```
[방문 고객] ──→ /waiting/:storeSlug
                    │
              Step 1: 전화번호 키패드
                    │ (010-XXXX-XXXX)
                    ▼
              Step 2: 인원 선택 (+/-)
                    │
                    ▼
              Step 3: 대기 등록 완료
                    │
              ┌─────┼─────┐
              ▼           ▼
         DB INSERT    sessionStorage
         (waitings)   (step=3, waitingId)
              │
              ▼
         새로고침 시 Step 3 유지
```

| ID | 시나리오 | 파일 | 검증 내용 |
|----|---------|------|----------|
| SC-026 | 대기 키오스크 UI | `waiting.spec.ts` | 키패드 입력 → 전화번호 포맷 → 인원 선택 → 등록 버튼 |
| SC-026/027 | 대기 등록 API | `waiting.spec.ts` | `next_queue_number` RPC → waitings INSERT → 조회 확인 |
| RS-003 | 손상된 sessionStorage 복구 | `waiting.spec.ts` | invalid JSON 저장 → 새로고침 → 크래시 없이 초기 상태 |
| RS-004 | 대기 등록 후 새로고침 복구 | `waiting.spec.ts` | Step 3 완료 → 새로고침 → 완료 화면 유지 |

### 8. 구독/만료 플로우 (Subscription)

```
[매장 구독 상태]
     │
     ├── is_active=true + subscription_end > today ──→ 정상 접근
     │
     ├── subscription_end < today ──→ "이용 기간이 만료되었습니다"
     │
     └── is_active=false ──→ "이용 기간이 만료되었습니다"
```

| ID | 시나리오 | 파일 | 검증 내용 |
|----|---------|------|----------|
| SC-007 | 만료된 매장 접근 차단 | `edge-cases.spec.ts` | subscription_end 과거 → 만료 안내 / is_active=false → 만료 안내 |
| SB-002 | 만료 매장 관리자 접근 차단 | `staff.spec.ts` | service role로 만료 설정 → 새 컨텍스트 로그인 → 만료 메시지 |

### 9. 새로고침 복구 플로우 (Refresh Recovery)

| ID | 시나리오 | 파일 | 검증 내용 |
|----|---------|------|----------|
| RS-001 | 고객 주문 이력 복구 | `order-detail.spec.ts` | 장바구니 담기 → 새로고침 → sessionStorage 유지 |
| RS-002 | 다른 테이블 스토리지 분리 | `order-detail.spec.ts` | 테이블 A 이력 ≠ 테이블 B (키 분리 확인) |
| RS-003 | 손상된 sessionStorage 복구 | `waiting.spec.ts` | invalid JSON → 앱 크래시 없이 초기화 |
| RS-004 | 대기 등록 후 새로고침 복구 | `waiting.spec.ts` | step=3 저장 → 새로고침 → 완료 화면 유지 |

### 10. 보안/엣지케이스 (Security & Edge Cases)

| ID | 시나리오 | 파일 | 검증 내용 |
|----|---------|------|----------|
| SC-031 | 법적 페이지 접근 | `edge-cases.spec.ts` | `/privacy` → 개인정보 표시 / `/terms` → 이용약관 표시 |
| SC-033 | 중복 slug 매장 생성 | `edge-cases.spec.ts` | 동일 slug → 에러 처리 |
| SC-035 | 존재하지 않는 tableId QR 접근 | `edge-cases.spec.ts` | 잘못된 URL → 에러 메시지 또는 빈 메뉴 |
| SC-038 | XSS 방어 | `edge-cases.spec.ts` | `<script>` 태그 포함 입력 → 스크립트 실행 안 됨 |
| SC-041 | 실시간 채널 장애 복원 | `order-flow.spec.ts` | 오프라인→온라인 전환 → 어드민 정상 동작 |

---

## 리포트 활용 가이드

### 관리자가 확인해야 할 것

1. **HTML 리포트 열기**: `npm run test:report:open`
2. **전체 통과율** 확인 (상단 요약)
3. **실패 테스트 클릭** → 스크린샷/비디오/trace 확인
4. **Trace Viewer**: 실패 재현을 단계별로 확인 가능

### CI/CD 연동

`test-reports/results.json`을 CI 파이프라인에서 파싱하여:
- 테스트 통과율 대시보드
- 실패 시 Slack/Discord 알림
- 성능 추이 트래킹

### 리포트에 포함되는 정보

| 항목 | 설명 |
|------|------|
| 테스트 결과 | pass/fail/skip/flaky 상태 |
| 실행 시간 | 각 테스트별 소요 시간 |
| 스크린샷 | 실패 시 자동 캡처 |
| 비디오 | 실패 시 전체 실행 녹화 |
| Trace | 첫 재시도 시 네트워크/DOM 전체 기록 |
| 에러 메시지 | assertion 실패 상세 내용 |

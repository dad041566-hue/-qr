# 출시 전 체크리스트

> 완료 시 `[ ]` → `[x]` 로 변경

---

## 🗄️ 인프라

- [ ] Supabase 프로젝트 생성 (tableflow 프로덕션)
- [ ] Supabase schema 적용 (`supabase db push` 또는 마이그레이션 실행)
- [ ] RLS 테스트 — 직원 격리, anon INSERT 검증
- [ ] Supabase Storage 버킷 생성 (`menu-images`, public read)
- [ ] production env 설정 (`.env.production`)
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_KAKAO_CLIENT_ID`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ALIMTALK_API_KEY`
  - `ALIMTALK_SENDER_KEY`

---

## 🔐 인증

- [ ] 카카오 디벨로퍼 앱 등록 및 Client ID 발급
- [ ] Supabase Auth 카카오 Provider 설정
- [ ] Auth 로그인 테스트
  - [ ] 점주 카카오 로그인 → 대시보드 이동
  - [ ] 직원 이메일+비번 로그인 → 첫 로그인 비밀번호 변경 강제
  - [ ] role별 페이지 접근 제어 (owner/manager/staff)
  - [ ] 직원 계정 생성 → 임시 비번 화면 복사

---

## 📦 기능 테스트

- [ ] 주문 API 테스트
  - [ ] QR URL → 매장/테이블 자동 인식
  - [ ] 메뉴 조회 (카테고리, 아이템, 옵션)
  - [ ] 주문 제출 → DB 저장 확인
  - [ ] 주문 상태 실시간 업데이트 (고객 화면)

- [ ] 메뉴 CRUD 테스트
  - [ ] 카테고리 생성/수정/삭제
  - [ ] 메뉴 아이템 생성/수정/soft delete
  - [ ] 옵션 그룹 및 선택지 CRUD
  - [ ] 이미지 업로드 (모바일 카메라/갤러리)

- [ ] Waiting queue 테스트
  - [ ] 대기 등록 → queue_number 자동 채번
  - [ ] 동시 등록 시 번호 중복 없음 (row lock 검증)
  - [ ] 대기 호출 → called 상태 변경
  - [ ] 테이블 자동 배정 (capacity >= party_size)
  - [ ] 착석/완료/no_show 처리

- [ ] Realtime 구독 테스트
  - [ ] 신규 주문 → 대시보드 1초 이내 알림
  - [ ] 주문 상태 변경 → 고객 화면 실시간 반영
  - [ ] 대기 신규 등록 → 어드민 실시간 반영

---

## 📲 알림톡

- [ ] 카카오 비즈솔루션 채널 등록
- [ ] 알림톡 템플릿 심사 등록 (4개 이벤트)
  - [ ] `order_created`
  - [ ] `waiting_created`
  - [ ] `waiting_called`
  - [ ] `waiting_cancelled`
- [ ] 알림톡 테스트 (실제 수신 확인)
- [ ] Supabase Edge Function 배포 (`send-alimtalk`)
- [ ] 발송 실패 시 `waiting_notifications.status = 'failed'` 기록 확인

---

## 🚀 CI/CD

- [ ] CI/CD 구축
  - [ ] GitHub Actions 워크플로우 작성
  - [ ] `main` 푸시 시 자동 빌드
  - [ ] S3 + CloudFront 자동 배포
  - [ ] Supabase 마이그레이션 자동 적용
  - [ ] 배포 성공/실패 알림

---

## ✅ 출시 직전

- [ ] 개인정보처리방침 페이지
- [ ] 이용약관 페이지
- [ ] `tableflow.com` 도메인 연결 및 HTTPS 확인
- [ ] 모바일 브라우저 QR 주문 플로우 최종 확인
- [ ] 대시보드 데스크톱 레이아웃 최종 확인

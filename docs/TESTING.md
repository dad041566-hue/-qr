# TableFlow 테스트 가이드

로컬 및 테스트 서버에서 전체 주문 플로우를 검증하는 가이드입니다.

---

## 1. 로컬 환경 설정

### 1-1. 의존성 설치 및 실행

```bash
npm i
npm run dev
# → http://localhost:5173
```

### 1-2. 환경변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Supabase 대시보드 → Settings → API 에서 확인.

---

## 2. 테스트 데이터 초기 설정 (Supabase SQL Editor)

슈퍼어드민 패널 구현 전까지 Supabase SQL Editor에서 직접 실행.

### 2-1. 테스트 매장 생성

```sql
-- 테스트 매장 삽입
INSERT INTO stores (id, owner_id, name, slug, address, phone)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',  -- 임시값, 아래 점주 계정 생성 후 업데이트
  '테스트 식당',
  'test-restaurant',
  '서울시 강남구',
  '02-1234-5678'
);
```

### 2-2. 테이블 생성

```sql
-- stores.id 확인 후 대입
INSERT INTO tables (store_id, table_number, name, status, qr_token)
SELECT
  id as store_id,
  n as table_number,
  n || '번 테이블' as name,
  'available' as status,
  gen_random_uuid()::text as qr_token
FROM stores, generate_series(1, 5) as n
WHERE slug = 'test-restaurant';
```

### 2-3. 테스트 메뉴 생성

```sql
-- 카테고리
INSERT INTO menu_categories (store_id, name, sort_order)
SELECT id, '메인 메뉴', 1 FROM stores WHERE slug = 'test-restaurant';

INSERT INTO menu_categories (store_id, name, sort_order)
SELECT id, '음료', 2 FROM stores WHERE slug = 'test-restaurant';

-- 메뉴 아이템
INSERT INTO menu_items (store_id, category_id, name, price, is_available)
SELECT
  s.id,
  c.id,
  item.name,
  item.price,
  true
FROM stores s
JOIN menu_categories c ON c.store_id = s.id AND c.name = '메인 메뉴'
CROSS JOIN (VALUES
  ('김치찌개', 9000),
  ('된장찌개', 8000),
  ('비빔밥', 10000)
) AS item(name, price)
WHERE s.slug = 'test-restaurant';
```

---

## 3. 계정 생성 및 로그인 테스트

### 3-1. 점주 계정 생성

Supabase 대시보드 → Authentication → Users → "Add user":

| 항목 | 값 |
|------|-----|
| Email | `owner@test.com` |
| Password | `Test1234!` (임시) |
| Auto Confirm | ✅ |

생성 후 SQL로 store_members 연결:

```sql
-- auth.users에서 방금 생성한 user id 확인
SELECT id FROM auth.users WHERE email = 'owner@test.com';

-- store_members 연결
INSERT INTO store_members (store_id, user_id, role, is_first_login)
SELECT s.id, u.id, 'owner', true
FROM stores s, auth.users u
WHERE s.slug = 'test-restaurant'
  AND u.email = 'owner@test.com';

-- stores.owner_id 업데이트
UPDATE stores
SET owner_id = (SELECT id FROM auth.users WHERE email = 'owner@test.com')
WHERE slug = 'test-restaurant';
```

### 3-2. 점주 첫 로그인 테스트

1. `http://localhost:5173/login` 접속
2. `owner@test.com` / `Test1234!` 입력
3. **비밀번호 변경 화면으로 리다이렉트 확인** (`/change-password`)
4. 새 비밀번호 입력 후 `/admin` 대시보드 진입 확인
5. 우측 상단에 **브라우저 알림 권한 요청 팝업 확인** → "허용" 클릭

### 3-3. 직원 계정 생성 (점주 대시보드에서)

1. `/admin` → 직원 관리 탭
2. "직원 추가" → 이메일: `staff@test.com`, 임시비번: `Staff1234!`
3. 계정 생성 확인

### 3-4. 직원 로그인 테스트

별도 브라우저(또는 시크릿 탭)에서:

1. `http://localhost:5173/login`
2. `staff@test.com` / `Staff1234!`
3. 비밀번호 변경 후 `/admin` 진입 확인
4. **직원 권한 확인**: 메뉴 수정 탭 비활성화, 주문 관리만 가능

---

## 4. 주문 플로우 + 알림·진동 테스트

> **준비**: 브라우저 2개 + 모바일(또는 개발자도구 모바일 시뮬레이션)

### 4-1. 멀티 탭/브라우저 셋업

| 화면 | URL | 계정 |
|------|-----|------|
| 어드민 (점주) | `http://localhost:5173/admin` | owner@test.com |
| 어드민 (직원) | 시크릿 탭: `http://localhost:5173/admin` | staff@test.com |
| 고객 주문 | `http://localhost:5173/m/test-restaurant/{table_id}` | 없음 |

`{table_id}` 확인:
```sql
SELECT id, table_number FROM tables
JOIN stores ON stores.id = tables.store_id
WHERE stores.slug = 'test-restaurant';
```

### 4-2. 새 주문 접수 알림 테스트

1. 고객 화면에서 메뉴 선택 → 주문 제출
2. **점주/직원 탭이 백그라운드인 상태에서** 주문 → 브라우저 알림 팝업 확인
3. 탭이 포그라운드인 상태 → toast 알림만 표시 (브라우저 알림 없음)
4. 모바일에서 테스트 시 진동 확인 (패턴: 짧게-짧게-길게)

### 4-3. 주문 상태 변경 알림 테스트

점주 탭에서 주문 상태 순서대로 변경하며 직원 탭 알림 확인:

| 단계 | 상태 변경 | 기대 동작 |
|------|----------|---------|
| 1 | 접수 → `confirmed` | 직원 탭 알림 |
| 2 | `confirmed` → `preparing` | "조리 중" 알림 |
| 3 | `preparing` → `ready` | "조리 완료" 알림 + 진동 (길게-짧게-길게) |
| 4 | `ready` → `served` | "서빙 완료" 알림 |

### 4-4. 동시 주문 테스트

고객 화면 3개 탭에서 동시에 주문 제출 → 어드민에 3개 주문 순서대로 도착 확인.

---

## 5. 알림 동작 조건 정리

| 조건 | toast | 브라우저 알림 | 진동 |
|------|-------|------------|------|
| 새 주문 + 탭 포그라운드 | ✅ | ❌ | ✅ |
| 새 주문 + 탭 백그라운드 | ✅ | ✅ | ✅ |
| 상태 변경 + 탭 포그라운드 | ❌ | ❌ | `ready`만 ✅ |
| 상태 변경 + 탭 백그라운드 | ❌ | ✅ | `ready`만 ✅ |

> 브라우저 알림은 **권한 허용** 시에만 동작. 거부한 경우 브라우저 주소창 자물쇠 아이콘 → 알림 → "허용"으로 변경.

---

## 6. 모바일 테스트 (진동 확인)

개발 서버를 로컬 네트워크에서 접근 가능하게:

```bash
npm run dev -- --host
# → http://192.168.x.x:5173
```

모바일 브라우저에서 위 주소 접속 후 동일 플로우 진행. 진동은 **Android Chrome** 에서만 동작 (iOS Safari 미지원).

---

## 7. 테스트 체크리스트

```
계정 플로우
  [ ] 점주 첫 로그인 → 비밀번호 변경 강제
  [ ] 직원 계정 생성 (점주 대시보드)
  [ ] 직원 첫 로그인 → 비밀번호 변경 강제
  [ ] 직원 권한 제한 확인 (메뉴 수정 불가)

주문 플로우
  [ ] 고객 화면 메뉴 조회
  [ ] 주문 제출 → 어드민 실시간 수신 (1초 이내)
  [ ] 주문 상태 변경 → 전체 전파

알림·진동
  [ ] 브라우저 알림 권한 요청 팝업
  [ ] 백그라운드 탭에서 브라우저 알림
  [ ] 새 주문 진동 (Android)
  [ ] 조리완료 진동 (Android)

멀티 유저
  [ ] 점주 + 직원 동시 로그인
  [ ] 한 쪽이 상태 변경 → 다른 쪽 실시간 반영
```

---
name: migrate
description: Supabase SQL 마이그레이션 파일 작성 가이드. "마이그레이션", "migrate", "RLS", "스키마 변경", "테이블 추가" 언급 시 활성화
argument-hint: "[description]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(date *)
---

# Supabase 마이그레이션 생성

`$ARGUMENTS` 내용으로 새 마이그레이션 파일을 생성합니다.

## 파일 네이밍

```
supabase/migrations/{YYYYMMDD}{NNNNNN}_{snake_case_description}.sql
```

날짜는 현재 날짜, 시퀀스는 해당 날짜의 기존 마이그레이션 다음 번호.

### 시퀀스 결정
```bash
ls supabase/migrations/ | grep "^$(date +%Y%m%d)" | tail -1
```
- 없으면 `000001`
- 있으면 마지막 번호 + 1

## 마이그레이션 템플릿

### 테이블 추가
```sql
-- {description}
CREATE TABLE IF NOT EXISTS public.{table_name} (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  -- columns here
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS 활성화
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "{table_name}_store_member_select"
  ON public.{table_name} FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_members
      WHERE store_members.store_id = {table_name}.store_id
        AND store_members.user_id = auth.uid()
        AND store_members.is_active = true
    )
  );

-- 인덱스
CREATE INDEX idx_{table_name}_store_id ON public.{table_name}(store_id);
```

### RLS 정책 수정
```sql
-- 기존 정책 삭제 후 재생성 (ALTER 불가)
DROP POLICY IF EXISTS "{policy_name}" ON public.{table_name};
CREATE POLICY "{policy_name}"
  ON public.{table_name} FOR {SELECT|INSERT|UPDATE|DELETE}
  USING (...);
```

### Realtime 활성화
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.{table_name};
```

## 생성 후 체크리스트

- [ ] `src/types/database.ts`에 새 테이블 타입 추가
- [ ] `docs/schema.sql` 동기화
- [ ] `docs/SCHEMA.md` 업데이트
- [ ] RLS 정책이 멀티테넌트 격리를 보장하는지 확인 (`store_id` 기반)
- [ ] anon 사용자 접근 범위 최소화 확인
- [ ] Supabase Dashboard 또는 `supabase db push`로 적용

## 규칙
- 모든 테이블에 `store_id` FK + RLS 필수.
- anon INSERT는 주문·대기만 허용. 그 외는 authenticated만.
- RLS 정책 수정은 DROP → CREATE 패턴 (ALTER 불가).
- role 기반 검증: `store_members.role` 체크 포함.

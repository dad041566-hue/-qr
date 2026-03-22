---
name: new-api
description: API → Hook → Test 3계층 보일러플레이트 생성. "새 API", "new api", "API 추가", "엔드포인트 추가" 언급 시 활성화
argument-hint: "[module-name]"
allowed-tools: Read, Write, Edit, Glob, Grep
---

# 새 API 모듈 생성

`$ARGUMENTS` 이름으로 3계층 데이터 레이어를 생성합니다.

## 생성 파일

### 1. API 함수 — `src/lib/api/$ARGUMENTS.ts`

```typescript
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

// TODO: 테이블 이름과 타입을 실제 스키마에 맞게 수정

export async function fetch{Module}s(storeId: string) {
  const { data, error } = await supabase
    .from('{table_name}')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function create{Module}(payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('{table_name}')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}
```

### 2. 훅 — `src/hooks/use{Module}.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { fetch{Module}s } from '@/lib/api/$ARGUMENTS'

export function use{Module}(storeId: string | undefined) {
  const [data, setData] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!storeId) return
    setLoading(true)
    try {
      const result = await fetch{Module}s(storeId)
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    load()
  }, [load])

  // Realtime 구독 (필요 시)
  useEffect(() => {
    if (!storeId) return
    const channel = supabase
      .channel(`{table}:${storeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: '{table_name}',
        filter: `store_id=eq.${storeId}`,
      }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [storeId, load])

  return { data, loading, reload: load }
}
```

### 3. 단위 테스트 — `src/lib/api/$ARGUMENTS.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// TODO: supabase mock 설정 후 테스트 작성

describe('$ARGUMENTS API', () => {
  it('should fetch data', async () => {
    // arrange
    // act
    // assert
  })

  it('should handle errors', async () => {
    // arrange
    // act & assert
  })
})
```

## 생성 후 체크리스트

- [ ] `src/types/database.ts`에 테이블 타입 추가 여부 확인
- [ ] `docs/schema.sql`에 테이블 존재 여부 확인
- [ ] Realtime 필요 여부 결정 → 불필요 시 훅에서 채널 구독 제거
- [ ] API 함수 placeholder를 실제 테이블명·컬럼명으로 교체
- [ ] 단위 테스트 작성 완료

## 규칙
- 기존 API 파일(`src/lib/api/`)의 패턴을 따름 (에러 throw, supabase 직접 호출).
- 컴포넌트에서 `supabase` 직접 호출 금지 — 반드시 훅을 통해 접근.
- `src/app/components/ui/` 파일은 수정 금지.

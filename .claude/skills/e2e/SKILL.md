---
name: e2e
description: Playwright E2E 테스트 실행 + 실패 분석. "e2e", "E2E", "플레이라이트", "시나리오 테스트" 언급 시 활성화
disable-model-invocation: true
argument-hint: "[spec-file|--grep pattern]"
allowed-tools: Bash(npx playwright *), Bash(npm run dev*), Read
---

# E2E 테스트 실행

$ARGUMENTS 대상으로 Playwright E2E 테스트를 실행합니다.

## 사전 조건 확인

1. `.env`에 필수 변수 존재 확인:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `TEST_SUPERADMIN_EMAIL`
   - `TEST_SUPERADMIN_PASSWORD`

2. 개발 서버 실행 여부 확인 (playwright.config.ts가 자동 시작하지만 확인).

## 실행

### 전체 실행 (인자 없음)
```bash
npx playwright test
```

### 단일 스펙
```bash
npx playwright test e2e/$ARGUMENTS
```

### 패턴 매칭
```bash
npx playwright test --grep "$ARGUMENTS"
```

## 실패 분석

실패 시:
1. 실패한 테스트 이름 + 시나리오 ID (SC-xxx, OD-xxx 등) 나열
2. 에러 메시지 핵심 요약 (타임아웃, 셀렉터 미발견, assertion 실패 등)
3. `test-results/` 에서 스크린샷·trace 파일 경로 안내
4. 수정 제안 (셀렉터 변경, 타임아웃 조정, 구현 버그 등)

## 리포트 열기
```bash
npx playwright show-report test-reports/html
```

## 결과 보고 형식

```
## E2E 결과
- 전체: N개 테스트
- 통과: ✅ N개
- 실패: ❌ N개 (시나리오 ID 나열)
- 스킵: N개

### 실패 상세
| 시나리오 | 에러 유형 | 원인 |
|----------|----------|------|
| SC-xxx   | timeout  | ... |
```

## 규칙
- 개발 서버가 꺼져 있으면 `npm run dev`를 background로 시작.
- retry 1회 포함 (playwright.config.ts 설정). retry 후에도 실패한 것만 보고.
- trace 파일이 있으면 경로 안내.

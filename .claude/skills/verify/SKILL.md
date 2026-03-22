---
name: verify
description: 빌드 + 단위 테스트 + 타입 체크 통합 검증. "검증", "verify", "확인", "빌드 되나" 언급 시 활성화
disable-model-invocation: true
argument-hint: "[all|build|unit|type]"
allowed-tools: Bash(npm *), Bash(npx *), Read
---

# 통합 검증

$ARGUMENTS 범위로 검증을 실행합니다. 인자가 없으면 전체(`all`) 실행.

## 실행 순서

### 1. 빌드 검증
```bash
npm run build
```
- exit 0 확인. 에러 시 첫 번째 에러 메시지 보고 후 중단.

### 2. 단위 테스트
```bash
npm run test:unit
```
- 전체 통과 수, 실패 수, 스킵 수 보고.
- 실패 시 실패한 테스트 이름 + 에러 메시지 요약.

### 3. 커버리지 (선택)
```bash
npm run test:unit:coverage
```
- `test-reports/unit-coverage/` 결과 요약.

## 결과 보고 형식

```
## 검증 결과
- 빌드: ✅ 성공 / ❌ 실패 (에러 요약)
- 단위 테스트: ✅ N/N 통과 / ❌ N개 실패
- 커버리지: XX% (대상 파일 기준)
```

## 규칙
- 빌드 실패 시 나머지 단계 스킵하고 즉시 보고.
- "통과했을 것" 같은 추측 금지. 실행 결과만 보고.
- 이전 실행 결과 재활용 금지. 매번 새로 실행.

---
name: deploy
description: Vercel 배포 실행. 반드시 수동으로만 호출. "배포", "deploy", "프로덕션", "스테이징" 언급 시에도 자동 실행하지 않음
disable-model-invocation: true
argument-hint: "[staging|production]"
allowed-tools: Bash(npm *), Bash(npx *), Bash(git *), Read
---

# TableFlow 배포

`$ARGUMENTS` 환경에 배포합니다. 인자가 없으면 중단하고 환경을 물어봅니다.

## 사전 검증 (필수)

배포 전 반드시 모든 항목 통과 확인:

### 1. 빌드 검증
```bash
npm run build
```

### 2. 단위 테스트
```bash
npm run test:unit
```

### 3. 커밋되지 않은 변경 확인
```bash
git status --porcelain
```
- 변경사항이 있으면 경고 후 커밋 여부 확인.

### 4. 현재 브랜치 확인
```bash
git branch --show-current
```
- production 배포는 `main` 브랜치에서만 허용.

## 배포 실행

### Staging
```bash
git push origin main
# Vercel Preview 자동 배포
```

### Production
```bash
git push origin main
# Vercel Production 자동 배포 (main 브랜치 트리거)
```

## 배포 후 확인

- [ ] Vercel Dashboard에서 배포 상태 확인
- [ ] `tableflow.com` 접속 확인
- [ ] 로그인 → 어드민 접근 확인
- [ ] 고객 메뉴 페이지 로딩 확인

## 결과 보고 형식

```
## 배포 결과
- 환경: $ARGUMENTS
- 빌드: ✅ / ❌
- 테스트: ✅ N/N 통과 / ❌
- Git: {branch} → {commit hash}
- 상태: 배포 완료 / 실패
```

## 규칙
- 빌드 또는 테스트 실패 시 배포 중단. 예외 없음.
- production 배포는 main 브랜치에서만.
- 배포 후 롤백 방법: Vercel Dashboard에서 이전 배포로 즉시 전환.

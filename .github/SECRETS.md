# GitHub Secrets 설정 가이드

GitHub 레포 → Settings → Secrets and variables → Actions에서 추가:

| Secret | 설명 | 획득 방법 |
|--------|------|----------|
| VITE_SUPABASE_URL | Supabase 프로젝트 URL | Supabase 대시보드 → Settings → API |
| VITE_SUPABASE_ANON_KEY | Supabase anon key | 동일 |
| SUPABASE_ACCESS_TOKEN | Supabase CLI 인증 토큰 | supabase.com → Account → Access Tokens |
| SUPABASE_DB_PASSWORD | DB 비밀번호 | Supabase 대시보드 → Settings → Database |
| VERCEL_TOKEN | Vercel 배포 토큰 | vercel.com → Settings → Tokens |
| VERCEL_ORG_ID | Vercel 팀/개인 ID | vercel.com → Settings → General |
| VERCEL_PROJECT_ID | Vercel 프로젝트 ID | vercel.com → 프로젝트 → Settings |

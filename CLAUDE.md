# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TableFlow** — B2B SaaS for restaurant QR ordering + POS management.
- Domain: `tableflow.com`
- Customer menu URL: `/m/:storeSlug/:tableId`

Three UIs: customer QR ordering menu, store owner admin dashboard, waiting queue kiosk. Plus marketing landing page.

Current state: Supabase fully integrated (Auth, Realtime, DB). Some pages still migrating Mock -> API.
Docs: `docs/PRD.md`, `docs/DECISIONS.md`, `docs/SCHEMA.md`, `docs/schema.sql`

## Commands

```bash
npm run dev                  # Next.js dev server (localhost:3000)
npm run build                # Production build (next build)

# Unit Tests (Vitest)
npm run test:unit            # Run all unit tests
npm run test:unit:watch      # Watch mode
npm run test:unit:coverage   # With coverage
npx vitest run src/lib/api/order.test.ts  # Single file

# E2E Tests (Playwright)
npm run test:e2e             # All E2E tests
npx playwright test e2e/order-flow.spec.ts  # Single spec
npx playwright test --grep "주문 접수"       # Pattern match
npm run test:report:open     # Open HTML report
```

## Environment Variables

`.env.local` (Next.js convention):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

E2E test variables (also in `.env`):
```
TEST_SUPERADMIN_EMAIL=...
TEST_SUPERADMIN_PASSWORD=...
SUPABASE_SERVICE_ROLE_KEY=...   # Direct DB manipulation in E2E
```

Sentry (set in Vercel/CI, not required locally):
```
SENTRY_ORG=...
SENTRY_PROJECT=...
```

Env validation: `src/lib/env.ts` exports typed `SUPABASE_URL` and `SUPABASE_ANON_KEY` with runtime checks.

## Architecture

### Framework: Next.js 15 (App Router)

Migrated from Vite SPA. Uses file-based routing, Server Actions, and middleware-based auth.

### Routing (file-based)

```
src/app/
├── layout.tsx              # Root layout (NextAuthProvider, ToastProvider)
├── page.tsx                # / -> redirects to /login or /admin via middleware
├── global-error.tsx        # Sentry error boundary
├── (auth)/change-password/ # First-login password change (protected)
├── (customer)/             # QR menu: /m/:storeSlug/:tableId, /table/:id (legacy)
├── (public)/               # /privacy, /terms, /waiting/:storeSlug
├── admin/                  # Store owner POS + admin dashboard (protected)
├── superadmin/             # Dev-only store/account management (super_admin role)
├── actions/                # Server Actions: order.ts, staff.ts, superadmin.ts, waiting.ts
└── components/             # App-level components including ui/ (shadcn)
```

Route protection: `src/middleware.ts` checks Supabase auth. Redirects unauthenticated users from `/admin`, `/change-password`, `/superadmin`. Superadmin requires `app_metadata.role === 'super_admin'`.

### Key Directories

- `src/app/components/ui/` — shadcn/ui primitives. **Do not modify** (read-only library).
- `src/styles/theme.css` — All CSS custom property tokens. Never hardcode color/spacing values; use these variables.
- `src/providers/AuthProvider.tsx` — `NextAuthProvider` + `useAuthContext()` hook. Provides `StoreUser` (id, email, role, storeId, storeName).

### Data Layer (3 tiers)

1. **`src/lib/supabase/`** — `client.ts` (browser client via `@supabase/ssr`), `server.ts` (server-side client). Both typed with `Database`.
2. **`src/lib/api/`** — Pure async functions (DB calls only). `admin.ts`, `menu.ts`, `menuAdmin.ts`, `order.ts`, `waiting.ts`, `subscription.ts`, `staffAdmin.ts`, `superadmin.ts`.
3. **`src/hooks/`** — Wrap API functions + Supabase Realtime subscriptions. Components access data through hooks only, never calling supabase directly.

### Server Actions (`src/app/actions/`)

Next.js Server Actions for mutations: `order.ts`, `staff.ts`, `superadmin.ts`, `waiting.ts`. These run server-side with service role access when needed.

### Realtime Pattern

All realtime hooks follow this pattern:
```ts
supabase.channel(`{table}:{storeId}`)
  .on('postgres_changes', { event: 'INSERT'|'UPDATE', ... }, handler)
  .subscribe()
// cleanup: supabase.removeChannel(channel)
```

### Types (`src/types/database.ts`)

Manually maintained (not auto-generated). Keep in sync with `docs/schema.sql`. Each table has `Row`, `Insert`, `Update` types plus a `Database` interface.

### Infrastructure

| Layer | Tech |
|-------|------|
| Backend/DB | Supabase (PostgreSQL + Realtime + Auth + Storage + Edge Functions) |
| Frontend deploy | Vercel (Next.js) |
| Auth | Supabase Auth (email+password only) |
| Error tracking | Sentry (`@sentry/nextjs`) |
| Superadmin API | Supabase Edge Functions (`supabase/functions/`) |
| Domain | `tableflow.com` |

### Path Alias

`@` -> `./src` (configured in `tsconfig.json`). Import as `@/app/...`, `@/lib/...`, `@/styles/...`.

### Styling

- Design tokens: `src/styles/theme.css` CSS variables. No hardcoding.
- Accent color: orange (`text-orange-500` / `#f97316`)
- Tailwind CSS v4 — `@tailwindcss/postcss` plugin. Config in `postcss.config.mjs`.
- Dark mode: CSS custom properties with `.dark` selector.

### Permission Model

| Role | Orders | Menu edit | Staff mgmt | Revenue |
|------|--------|-----------|------------|---------|
| owner | O | O | O | O |
| manager | O | O | X | O |
| staff | O | X | X | X |

Customers (unauthenticated) can only INSERT orders. Supabase RLS enforces `store_id`-based multi-tenant isolation.

### Security

- **Passwords**: 8+ chars + special character required
- **First login**: Temporary password -> forced change at `/change-password`
- **Subscription**: Store active status checked via `checkStoreActive()` each session
- **Queue numbers**: Sequential + rollover security (migration: `20260316000007_fix_queue_number_security.sql`)

### Testing

**Unit (Vitest)**: `src/**/*.test.{ts,tsx}`. jsdom environment, `@testing-library/react` + `@testing-library/jest-dom`. Config: `vitest.config.ts`, setup: `src/test/setup.ts`.

**E2E (Playwright)**: `e2e/*.spec.ts`. Helpers in `e2e/e2e-helpers.ts` (`login`, `loginAndWaitForAdmin`, `requireEnv`, `getServiceRoleHeaders`). Dev server auto-starts on `localhost:3000`. Timeout 90s, retry 1, auto-captures screenshots/video/trace on failure. Tests run across 6 device profiles (desktop, iPhone 14, iPhone 16 Max, Galaxy S24, Galaxy Fold, iPad).

### Edge Functions (`supabase/functions/`)

| Function | Purpose |
|----------|---------|
| `superadmin/` | Superadmin API (store/account/subscription management) |
| `create-store-with-owner/` | Create store + owner account atomically |
| `create-staff/` | Create staff accounts |
| `check-superadmin/` | Superadmin permission verification |

### DB Migrations

`supabase/migrations/` — Chronological SQL files. Apply via Supabase Dashboard or `supabase db push`. Contains RLS policies, indexes, security functions.

### CI/CD

GitHub Actions (`.github/workflows/`):
- `deploy.yml` — Build -> Migrate -> Deploy Edge Functions -> Deploy to Vercel
- `pr-check.yml` — PR validation

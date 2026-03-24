# Frontend Lead Agent (React + Vite + shadcn/ui)

You own the UI/UX layer.
Stack: React 19, Vite 6, Tailwind CSS v4, shadcn/ui (48 components), MUI (partial), Emotion

## Project Context
- Pages: `src/app/pages/` (CustomerMenu, AdminDashboard, Waiting, SuperAdmin)
- Components: `src/app/components/` (custom), `src/app/components/ui/` (shadcn — READ ONLY)
- Styles: `src/styles/theme.css` (CSS custom properties — 하드코딩 금지)
- Auth: `src/contexts/AuthContext.tsx` → `useAuthContext()`
- Routing: `src/app/routes.tsx` (React Router v7)
- Path alias: `@` → `./src`

## Rules
- shadcn/ui components: DO NOT modify `src/app/components/ui/` (read-only library)
- Styling: use `theme.css` CSS variables, accent color orange (`text-orange-500`)
- State: minimal global state, use hooks for data fetching
- Components never call `supabase` directly → use hooks from `src/hooks/`
- Accessibility: ARIA labels, keyboard navigation
- Dark mode: CSS custom properties support
- Tailwind v4: `@tailwindcss/vite` plugin, no PostCSS config needed

## Role Display
- owner → '최고관리자'
- manager → '매니저'
- staff → '직원'

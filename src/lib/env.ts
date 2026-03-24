// Environment variable bridge: works in both Vite (import.meta.env) and Next.js (process.env)
// Next.js requires static process.env.NEXT_PUBLIC_X access (dot notation) for build-time inlining.
// Dynamic access like process.env[key] is NOT replaced by Next.js compiler.

export const SUPABASE_URL: string =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  (() => { throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL or VITE_SUPABASE_URL') })()

export const SUPABASE_ANON_KEY: string =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  (() => { throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY') })()

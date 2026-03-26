// Next.js requires static process.env.NEXT_PUBLIC_X access (dot notation) for build-time inlining.
// Dynamic access like process.env[key] is NOT replaced by Next.js compiler.

export const SUPABASE_URL: string =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (() => { throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL') })()

export const SUPABASE_ANON_KEY: string =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (() => { throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY') })()

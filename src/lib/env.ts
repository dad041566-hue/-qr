// Environment variable bridge: works in both Vite (import.meta.env) and Next.js (process.env)

function getEnv(nextKey: string, viteKey: string): string {
  // Next.js (process.env is statically replaced at build time)
  if (typeof process !== 'undefined' && process.env?.[nextKey]) {
    return process.env[nextKey]!
  }
  // Vite (import.meta.env is statically replaced at build time)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[viteKey]) {
    return (import.meta as any).env[viteKey]
  }
  throw new Error(`Missing env: ${nextKey} or ${viteKey}`)
}

export const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL')
export const SUPABASE_ANON_KEY = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY')

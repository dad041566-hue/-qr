import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env'

export const supabase = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env'

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side Supabase client using service role key
// This bypasses RLS — only use in server actions / API routes
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default supabase

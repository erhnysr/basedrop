import { createClient } from "@supabase/supabase-js";

// Server routes only. Uses the service-role key when it is configured (required once
// row level security is enabled — see supabase/migrations/0006), anon key otherwise.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

import { createClient } from "@supabase/supabase-js";

// Server-side admin client using service role key
// Only used in API routes (server-side), never exposed to browser
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

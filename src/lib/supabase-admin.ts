import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only client — uses the service role key and bypasses RLS.
// Created lazily so importing this module can never evaluate the service
// role key in a client bundle (that killed /enroll in production: the key
// is undefined in the browser and createClient throws at module scope).
let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return adminClient;
}

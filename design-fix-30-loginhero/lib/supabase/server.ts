/**
 * DESIGN-POOL — server-klient stubbad. Samma API som produktionens
 * supabase/server.ts men utan cookies/nätverk.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export function createClient(): SupabaseClient {
  const fake = {
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: "pool-user-1", email: "larare@example.se" } }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      exchangeCodeForSession: () => Promise.resolve({ data: { user: { id: "pool-user-1" }, session: null }, error: null }),
    },
  };
  return fake as unknown as SupabaseClient;
}

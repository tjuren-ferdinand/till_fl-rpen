"use client";

/**
 * DESIGN-POOL — mockad Supabase-klient. Returnerar en fejksession så att
 * alla sidor renderar som inloggade, utan nätverk eller credentials.
 */

const FAKE_USER = {
  id: "pool-user-1",
  email: "larare@example.se",
  aud: "authenticated",
  role: "authenticated",
  created_at: "2026-01-01T00:00:00Z",
  user_metadata: { full_name: "Demo Lärare" },
};

const FAKE_SESSION = {
  access_token: "pool-mock-token",
  refresh_token: "pool-mock-refresh",
  expires_in: 3600,
  expires_at: 9999999999,
  token_type: "bearer",
  user: FAKE_USER,
};

import type { SupabaseClient } from "@supabase/supabase-js";

const ok = <T>(data: T) => Promise.resolve({ data, error: null });

export function createClient(): SupabaseClient {
  return {
    auth: {
      getSession: () => ok({ session: FAKE_SESSION }),
      getUser: () => ok({ user: FAKE_USER }),
      signInWithPassword: () => ok({ user: FAKE_USER, session: FAKE_SESSION }),
      signUp: () => ok({ user: FAKE_USER, session: FAKE_SESSION }),
      signInWithOAuth: () => ok({ provider: "google", url: "/" }),
      signOut: () => ok({}),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      exchangeCodeForSession: () => ok({ user: FAKE_USER, session: FAKE_SESSION }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ data: [], error: null }) }),
    }),
  } as unknown as SupabaseClient;
}

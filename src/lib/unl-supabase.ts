import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Your own Supabase project (NOT Lovable Cloud). Publishable/anon key — safe in client code.
export const UNL_SUPABASE_URL = "https://sqkvakhzgsgqvfayefwm.supabase.co";
export const UNL_SUPABASE_KEY = "sb_publishable_UtFsx1XfkWAIauj4kXssaw_5h45Em0D";

let _client: SupabaseClient | null = null;

export function getUnlSupabase(): SupabaseClient {
  if (_client) return _client;
  _client = createClient(UNL_SUPABASE_URL, UNL_SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "unl-admin-session",
    },
  });
  return _client;
}

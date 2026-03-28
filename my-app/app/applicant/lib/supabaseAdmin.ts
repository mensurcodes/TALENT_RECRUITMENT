import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/** Private bucket for assessment answer clips (server uploads only). */
export const ASSESSMENT_VIDEOS_BUCKET = "assessment-videos";

export function hasSupabaseServiceRole(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

/**
 * Service-role client — use only in server actions / Route Handlers, never in client components.
 * Required for uploading to a private storage bucket without exposing credentials.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Set SUPABASE_SERVICE_ROLE_KEY (and URL) for assessment video storage.");
  }
  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

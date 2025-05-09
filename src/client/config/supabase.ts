import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "./env";

/**
 * Supabase client instance for interacting with Supabase services.
 */
let supabase: SupabaseClient | undefined;

export const getSupabase = () => {
  if (!env.OUTSPEED_HOSTED) {
    return;
  }

  if (supabase) {
    return supabase;
  }

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables. Check your .env file.");
    return;
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey);
  return supabase;
};

/**
 * A wrapper around Supabase's session token that returns the token as a string.
 * It throws an error when the token is not available.
 * @returns The session token as a string
 */
export const getSupabaseAuthToken = async () => {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error("Didn't get current user's access token");
  }

  return token;
};

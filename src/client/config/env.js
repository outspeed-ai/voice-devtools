export const env = {
  OUTSPEED_HOSTED: import.meta.env.OUTSPEED_HOSTED === "true",

  /** @type {string | undefined} */
  SUPABASE_URL: import.meta.env.OUTSPEED_SUPABASE_URL,

  /** @type {string | undefined} */
  SUPABASE_ANON_KEY: import.meta.env.OUTSPEED_SUPABASE_ANON_KEY,
};

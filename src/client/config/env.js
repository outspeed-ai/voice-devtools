const importEnv = import.meta.env || {};

export const env = {
  OUTSPEED_HOSTED: importEnv.OUTSPEED_HOSTED === "true",

  /** @type {string} */
  OUTSPEED_SERVER_DOMAIN: importEnv.OUTSPEED_SERVER_DOMAIN || "api.outspeed.com",

  /** @type {string | undefined} */
  SUPABASE_URL: importEnv.OUTSPEED_SUPABASE_URL,

  /** @type {string | undefined} */
  SUPABASE_ANON_KEY: importEnv.OUTSPEED_SUPABASE_ANON_KEY,
};

export const env = {
  OUTSPEED_HOSTED: import.meta.env?.OUTSPEED_HOSTED === "true",
  OUTSPEED_SERVER_DOMAIN: (import.meta.env?.OUTSPEED_SERVER_DOMAIN || "api.outspeed.com") as string,
  SUPABASE_URL: import.meta.env?.OUTSPEED_SUPABASE_URL as string | undefined,
  SUPABASE_ANON_KEY: import.meta.env?.OUTSPEED_SUPABASE_ANON_KEY as string | undefined,
  OUTSPEED_API_KEY: import.meta.env?.OUTSPEED_API_KEY as string | undefined,
};

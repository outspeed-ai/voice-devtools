// Helper function to safely get env variables
// the reaason i've to do this is because when running this in ssr mode using tsx
// (see "dev" script in package.json), import.meta.env is undefined,
// and variables are available in process.env instead
const getEnvVar = (key: string): string | undefined => {
  if (import.meta.env?.[key]) {
    return import.meta.env[key];
  }

  // Check if process is defined before accessing process.env
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key];
  }

  return undefined;
};

export const env = {
  OUTSPEED_HOSTED: getEnvVar("OUTSPEED_HOSTED") === "true",
  OUTSPEED_SERVER_DOMAIN: (getEnvVar("OUTSPEED_SERVER_DOMAIN") || "api.outspeed.com") as string,
  SUPABASE_URL: getEnvVar("OUTSPEED_SUPABASE_URL") as string | undefined,
  SUPABASE_ANON_KEY: getEnvVar("OUTSPEED_SUPABASE_ANON_KEY") as string | undefined,
  OUTSPEED_API_KEY: getEnvVar("OUTSPEED_API_KEY") as string | undefined,
};

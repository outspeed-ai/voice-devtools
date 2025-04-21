import { config } from "dotenv";

// when this file is imported in server.ts, import.meta.env is undefined
// so we manually have to load the env variables
const isServer = typeof import.meta.env === "undefined";
if (isServer) {
  console.log("ℹ️  env.ts in server");
  config({ override: true });
}

// Helper function to safely get env variables
// the reason i've to do this is because when running this in ssr mode using tsx
// (see "dev" script in package.json), import.meta.env is undefined initially
// until we run the code in browser
const getEnvVar = (key: string): string | undefined => {
  if (isServer) {
    return process.env[key];
  }

  if (import.meta.env?.[key]) {
    return import.meta.env[key];
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

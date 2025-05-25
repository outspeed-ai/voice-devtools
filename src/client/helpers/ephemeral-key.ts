// vite-env.d.ts
declare const __BACKEND_SERVER_URL__: string;

import { toast, type ExternalToast } from "sonner";

import { env } from "@/config/env";
import { getSupabaseAuthToken } from "@/config/supabase";
import { providers, type Provider, type SessionConfig } from "@package";

export const getEphemeralKey = async (provider: Provider, config: SessionConfig, source?: "demo") => {
  // first_message is only supported by Outspeed, so we need to remove it if it's not Outspeed
  if (provider !== providers.Outspeed && "first_message" in config) {
    config = { ...config }; // make a copy to not mutate the original
    delete config.first_message;
  }

  if (!env.OUTSPEED_HOSTED) {
    return getEphemeralKeyServer(provider, config);
  }

  // since it's hosted, we will use the JWT token to fetch the ephemeral key

  const token = await getSupabaseAuthToken();
  const url = new URL(`https://${provider.url}/v1/realtime/sessions`);
  if (source) {
    url.searchParams.set("source", source);
  }

  const tokenResponse = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(config),
  });

  const data = await tokenResponse.json();

  if (!tokenResponse.ok) {
    return handleEphemeralKeyError(data, provider);
  }

  return data.client_secret.value;
};

const getEphemeralKeyServer = async (provider: Provider, config: SessionConfig) => {
  const tokenResponse = await fetch(`${__BACKEND_SERVER_URL__}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  const data = await tokenResponse.json();
  if (!tokenResponse.ok) {
    return handleEphemeralKeyError(data, provider);
  }

  return data.client_secret.value;
};

// Helper function to handle errors
const handleEphemeralKeyError = (data: any, provider: Provider) => {
  console.error("Failed to get ephemeral key", data);

  const toastOptions: ExternalToast = {};
  if (data.code === "NO_API_KEY") {
    toastOptions.action = {
      label: "Get API Key",
      onClick: () => window.open(provider.apiKeyUrl, "_blank"),
    };
  }

  toast.error(data.error || "Failed to get ephemeral key", toastOptions);
  return undefined;
};

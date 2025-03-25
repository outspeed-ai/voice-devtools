import { toast, type ExternalToast } from "sonner";

import { env } from "@/config/env";
import { getSupabaseAuthToken } from "@/config/supabase";
import { type SessionConfig } from "@src/model-config";
import { type Provider } from "@src/settings";

export const getEphemeralKey = async (provider: Provider, config: SessionConfig) => {
  if (!env.OUTSPEED_HOSTED) {
    return getEphemeralKeyServer(provider, config);
  }

  // since it's hosted, we will use the JWT token to fetch the ephemeral key

  const token = await getSupabaseAuthToken();
  const tokenResponse = await fetch(`https://${provider.url}/v1/realtime/sessions`, {
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
  const tokenResponse = await fetch(`/token`, {
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

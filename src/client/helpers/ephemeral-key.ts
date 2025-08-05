// vite-env.d.ts
declare const __BACKEND_SERVER_URL__: string;

import { toast, type ExternalToast } from "sonner";

import { providers, type Provider, type SessionConfig } from "@package";

export const getEphemeralKey = async (provider: Provider, config: SessionConfig) => {
  // first_message is only supported by Outspeed, so we need to remove it if it's not Outspeed
  if (provider !== providers.Outspeed && "first_message" in config) {
    config = { ...config }; // make a copy to not mutate the original
    delete config.first_message;
  }

  return getEphemeralKeyServer(provider, config);
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

import { Provider, ProviderName } from "./types";
/**
 * Provider-specific defaults
 */
export const providers: Record<ProviderName, Provider> = {
  Outspeed: {
    name: "Outspeed",
    url: "api.outspeed.com",
    apiKeyUrl: "https://dashboard.outspeed.com/dashboard",
    costStructure: "per-minute",
    defaultVoice: "male", // Options: male, female
  },
  OpenAI: {
    name: "OpenAI",
    url: "api.openai.com",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    costStructure: "per-token",
    defaultVoice: "verse", // Options: alloy, ash, ballad, coral, echo, sage, shimmer, verse
  },
};
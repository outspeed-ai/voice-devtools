import { models as modelConfig } from "./modelConfig.js";
/**
 * Provider-specific defaults
 */
export const providers = {
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


export const models = {
  "MiniCPM-o-2_6": {
    ...modelConfig['MiniCPM-o-2_6'],
    cost: { perMinute: 0.01 },
    provider: providers.Outspeed
  },
  "gpt-4o-realtime-preview-2024-12-17": {
    ...modelConfig['gpt-4o-realtime-preview-2024-12-17'],
    cost: {
      input: {
        text: 5.0, // $ per million tokens
        audio: 40.0, // $ per million tokens
        cached: {
          text: 2.5, // $ per million tokens
          audio: 2.5, // $ per million tokens
        },
      },
      output: {
        text: 20.0, // $ per million tokens
        audio: 80.0, // $ per million tokens
      },
    },
    provider: providers.OpenAI
  },
  "gpt-4o-mini-realtime-preview-2024-12-17": {
    ...modelConfig['gpt-4o-mini-realtime-preview-2024-12-17'],
    cost: {
      input: {
        text: 0.6, // $ per million tokens
        audio: 10.0, // $ per million tokens
        cached: {
          text: 0.3, // $ per million tokens
          audio: 0.3, // $ per million tokens
        },
      },
      output: {
        text: 2.4, // $ per million tokens
        audio: 20.0, // $ per million tokens
      },
    },
    provider: providers.OpenAI
  },
};

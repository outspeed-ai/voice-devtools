/**
 * Shared configuration for all models.
 */
const sharedConfig = {
  // Common instructions for all models (can be customized per model below)
  instructions:
    "You are a helpful voice assistant that understands human speech and responds in a helpful manner.",
  temperature: 0.6,
  modalities: ["text", "audio"],
};

/**
 * Provider-specific defaults
 */
export const providers = {
  Outspeed: {
    name: "Outspeed",
    url: "api.outspeed.com",
    apiKeyUrl: "https://dashboard.outspeed.com/dashboard",
    costStructure: "per-minute", // NO input/output token bs
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

/**
 * Model definitions
 */
export const MODELS = {
  // Outspeed model
  "MiniCPM-o-2_6": {
    provider: providers.Outspeed,
    label: "MiniCPM-o 2.6",
    cost: { perMinute: 0.01 },
    sessionConfig: {
      model: "MiniCPM-o-2_6",
      modalities: sharedConfig.modalities,
      instructions: sharedConfig.instructions,
      temperature: sharedConfig.temperature,
      voice: providers.Outspeed.defaultVoice,
    },
  },

  // OpenAI models
  "gpt-4o-realtime-preview-2024-12-17": {
    provider: providers.OpenAI,
    label: "GPT-4o Realtime",
    /**
     * As per https://openai.com/api/pricing/.
     *
     * Last updated: March 10, 2025
     */
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
    sessionConfig: {
      model: "gpt-4o-realtime-preview-2024-12-17",
      modalities: sharedConfig.modalities,
      instructions: sharedConfig.instructions,
      temperature: sharedConfig.temperature,
      voice: providers.OpenAI.defaultVoice,
    },
  },

  "gpt-4o-mini-realtime-preview-2024-12-17": {
    provider: providers.OpenAI,
    label: "GPT-4o Mini Realtime",
    /**
     * As per https://openai.com/api/pricing/.
     *
     * Last updated: March 10, 2025
     */
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
    sessionConfig: {
      model: "gpt-4o-mini-realtime-preview-2024-12-17",
      modalities: sharedConfig.modalities,
      instructions: sharedConfig.instructions,
      temperature: sharedConfig.temperature,
      voice: providers.OpenAI.defaultVoice,
    },
  },
};

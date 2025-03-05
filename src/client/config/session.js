export const OPENAI_PROVIDER = "api.openai.com";
export const OUTSPEED_PROVIDER = "api.outspeed.com";

const Modality = Object.freeze({
  TEXT: "text",
  AUDIO: "audio",
});

const MODALITIES = new Set([Modality.TEXT, Modality.AUDIO]);

export const API_PROVIDERS = {
  [OUTSPEED_PROVIDER]: {
    name: "Outspeed",
    url: OUTSPEED_PROVIDER,
    features: ["sessions"],
    apiKeyUrl: "https://dashboard.outspeed.com/dashboard",
    sessionConfig: {
      models: ["MiniCPM-o-2_6"],
      modalities: MODALITIES,
      voices: [
        {
          label: "female",
          value: "female_eng",
        },
        {
          label: "male",
          value: "male_eng",
          default: true,
        },
      ],
    },
  },
  [OPENAI_PROVIDER]: {
    name: "OpenAI",
    url: OPENAI_PROVIDER,
    features: [],
    apiKeyUrl: "https://platform.openai.com/api-keys",
    sessionConfig: {
      models: ["gpt-4o-realtime-preview-2024-12-17"],
      modalities: MODALITIES,
      voices: [
        {
          label: "alloy",
          value: "alloy",
        },
        {
          label: "ash",
          value: "ash",
        },
        {
          label: "ballad",
          value: "ballad",
        },
        {
          label: "coral",
          value: "coral",
        },
        {
          label: "echo",
          value: "echo",
        },
        {
          label: "sage",
          value: "sage",
        },
        {
          label: "shimmer",
          value: "shimmer",
        },
        {
          label: "verse",
          value: "verse",
          default: true,
        },
      ],
    },
  },
};

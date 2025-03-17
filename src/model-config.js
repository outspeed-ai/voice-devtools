export const models = {
  "MiniCPM-o-2_6": {
    provider: "api.outspeed.com",
    label: "MiniCPM-o 2.6",
    sessionConfig: {
      model: "MiniCPM-o-2_6",
      modalities: ["audio", "text"],
      temperature: 0.6,
      voice: "female"
    },
  },
  "gpt-4o-realtime-preview-2024-12-17": {
    provider: "api.openai.com",
    label: "GPT-4o Realtime",
    sessionConfig: {
      model: "gpt-4o-realtime-preview-2024-12-17",
      modalities: ["audio", "text"],
      temperature: 0.6,
      voice: "sage"
    },
  },
  "gpt-4o-mini-realtime-preview-2024-12-17": {
    provider: "api.openai.com",
    label: "GPT-4o Mini Realtime",
    sessionConfig: {
      model: "gpt-4o-mini-realtime-preview-2024-12-17",
      modalities: ["audio", "text"],
      temperature: 0.6,
      voice: "sage",
    },
  },
};

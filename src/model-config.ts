export type ModalName =
  | "MiniCPM-o-2_6"
  | "gpt-4o-realtime-preview-2024-12-17"
  | "gpt-4o-mini-realtime-preview-2024-12-17";

export type SessionConfig = {
  model: string;
  modalities: string[];
  temperature: number;
  voice: string;
};

export const models: Record<ModalName, { label: string; sessionConfig: SessionConfig }> = {
  "MiniCPM-o-2_6": {
    label: "MiniCPM-o 2.6",
    sessionConfig: {
      model: "MiniCPM-o-2_6",
      modalities: ["audio", "text"],
      temperature: 0.6,
      voice: "female",
    },
  },
  "gpt-4o-realtime-preview-2024-12-17": {
    label: "GPT-4o Realtime",
    sessionConfig: {
      model: "gpt-4o-realtime-preview-2024-12-17",
      modalities: ["audio", "text"],
      temperature: 0.6,
      voice: "sage",
    },
  },
  "gpt-4o-mini-realtime-preview-2024-12-17": {
    label: "GPT-4o Mini Realtime",
    sessionConfig: {
      model: "gpt-4o-mini-realtime-preview-2024-12-17",
      modalities: ["audio", "text"],
      temperature: 0.6,
      voice: "sage",
    },
  },
};

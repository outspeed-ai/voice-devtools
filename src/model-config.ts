export type ModelName =
  | "MiniCPM-o-2_6"
  | "gpt-4o-realtime-preview-2024-12-17"
  | "gpt-4o-mini-realtime-preview-2024-12-17";

export type SessionConfig = {
  model: string;
  modalities: string[];
  temperature: number;
  voice: string;
  instructions: string;
};

type ModelValue = {
  label: string;
  voices: string[];
  sessionConfig: SessionConfig;
};

const OUTSPEED_MINICPMO_VOICES = ["male", "female"];
const OPENAI_VOICES = ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"];

export const models: Record<ModelName, ModelValue> = {
  "MiniCPM-o-2_6": {
    label: "MiniCPM-o 2.6",
    voices: OUTSPEED_MINICPMO_VOICES,
    sessionConfig: {
      model: "MiniCPM-o-2_6",
      modalities: ["audio", "text"],
      temperature: 0.6,
      voice: "female",
      instructions: "",
    },
  },
  "gpt-4o-realtime-preview-2024-12-17": {
    label: "GPT-4o Realtime",
    voices: OPENAI_VOICES,
    sessionConfig: {
      model: "gpt-4o-realtime-preview-2024-12-17",
      modalities: ["audio", "text"],
      temperature: 0.6,
      voice: "sage",
      instructions: "",
    },
  },
  "gpt-4o-mini-realtime-preview-2024-12-17": {
    label: "GPT-4o Mini Realtime",
    voices: OPENAI_VOICES,
    sessionConfig: {
      model: "gpt-4o-mini-realtime-preview-2024-12-17",
      modalities: ["audio", "text"],
      temperature: 0.6,
      voice: "sage",
      instructions: "",
    },
  },
};

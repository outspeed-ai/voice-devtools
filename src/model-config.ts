export type ModelName =
  | "MiniCPM-o-2_6"
  // | "Sesame-1b"
  | "Orpheus-3b"
  | "gpt-4o-realtime-preview-2024-12-17"
  | "gpt-4o-mini-realtime-preview-2024-12-17";

export type SessionConfig = {
  model: string;
  modalities: string[];
  temperature: number;
  voice: string;
  instructions: string;
  tools: string[];

  /**
   * to use "semantic_vad" for OpenAI Realtime API, you need to send `"session.update"` event
   * AFTER the session is created.
   * docs: https://platform.openai.com/docs/guides/realtime-vad#semantic-vad
   */
  turn_detection: {
    type: "server_vad" | "semantic_vad";
  };
};

type ModelValue = {
  label: string;
  voices: string[];
  sessionConfig: SessionConfig;
};

const OUTSPEED_MINICPMO_VOICES = ["male", "female"];
// const OUTSPEED_SESAME_VOICES = ["male", "female"];
const OUTSPEED_ORPHEUS_VOICES = ["male", "female"];
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
      tools: [],
      turn_detection: {
        type: "server_vad",
      },
    },
  },
  // "Sesame-1b": {
  //   label: "Sesame 1b (beta)",
  //   voices: OUTSPEED_SESAME_VOICES,
  //   sessionConfig: {
  //     model: "Sesame-1b",
  //     modalities: ["audio", "text"],
  //     temperature: 0.6,
  //     voice: "female",
  //     instructions: "",
  //     tools: [],
  //     turn_detection: {
  //       type: "server_vad",
  //     },
  //   },
  // },
  "Orpheus-3b": {
    label: "Orpheus 3b",
    voices: OUTSPEED_ORPHEUS_VOICES,
    sessionConfig: {
      model: "Orpheus-3b",
      modalities: ["audio", "text"],
      temperature: 0.6,
      voice: "female",
      instructions: "",
      tools: [],
      turn_detection: {
        type: "server_vad",
      },
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
      tools: [],
      turn_detection: {
        // to use "semantic_vad", you need to send "session.update" event
        // docs: https://platform.openai.com/docs/guides/realtime-vad#semantic-vad
        type: "server_vad",
      },
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
      tools: [],
      turn_detection: {
        type: "server_vad",
      },
    },
  },
};

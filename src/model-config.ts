export type ModelName = "Orpheus-3b" | "gpt-4o-realtime-preview-2024-12-17" | "gpt-4o-mini-realtime-preview-2024-12-17";

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

  input_audio_transcription?: {
    model: string;
  };
};

type ModelValue = {
  label: string;
  voices: string[];
  sessionConfig: SessionConfig;
  transcriptionModels: string[];
};

const OUTSPEED_TRANSCRIPTION_MODELS = ["whisper-v3-turbo"];
const OPENAI_TRANSCRIPTION_MODELS = ["gpt-4o-transcribe", "gpt-4o-mini-transcribe", "whisper-1"];

const OUTSPEED_ORPHEUS_VOICES = ["tara", "leah", "jess", "leo", "dan", "mia", "zac", "zoe", "julia"];
const OPENAI_VOICES = ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"];

export const models: Record<ModelName, ModelValue> = {
  "Orpheus-3b": {
    label: "Orpheus 3b",
    voices: OUTSPEED_ORPHEUS_VOICES,
    transcriptionModels: OUTSPEED_TRANSCRIPTION_MODELS,
    sessionConfig: {
      model: "Orpheus-3b",
      modalities: ["audio", "text"],
      temperature: 0.6,
      voice: "tara",
      instructions: "",
      tools: [],
      turn_detection: {
        type: "server_vad",
      },
      input_audio_transcription: {
        model: "whisper-v3-turbo",
      },
    },
  },
  "gpt-4o-realtime-preview-2024-12-17": {
    label: "GPT-4o Realtime",
    voices: OPENAI_VOICES,
    transcriptionModels: OPENAI_TRANSCRIPTION_MODELS,
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
    transcriptionModels: OPENAI_TRANSCRIPTION_MODELS,
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

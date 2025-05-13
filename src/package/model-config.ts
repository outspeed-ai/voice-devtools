<<<<<<< HEAD:src/model-config.ts
export type ModelName = "Orpheus-3b" | "gpt-4o-realtime-preview-2024-12-17" | "gpt-4o-mini-realtime-preview-2024-12-17";
import { FunctionDefinition } from "./tools";

type FunctionDefinition = {
  type: "function";
  name: string;
  description: string;
  parameters: any;
};
export type SessionConfig = {
  model: string;
  modalities: string[];
  temperature: number;
  voice: string;
  instructions: string;
  tools: FunctionDefinition[];

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
  } | null;
};

type ModelValue = {
  label: string;
  voices: string[];
  sessionConfig: SessionConfig;
  transcriptionModels: string[];
};

const OUTSPEED_TRANSCRIPTION_MODELS = ["whisper-v3-turbo"];
const OPENAI_TRANSCRIPTION_MODELS = ["gpt-4o-transcribe", "gpt-4o-mini-transcribe", "whisper-1"];

=======
import { ModelValue } from "./types";

export type ModelName =
  | "MiniCPM-o-2_6"
  // | "Sesame-1b"
  | "Orpheus-3b"
  | "gpt-4o-realtime-preview-2024-12-17"
  | "gpt-4o-mini-realtime-preview-2024-12-17";

const OUTSPEED_MINICPMO_VOICES = ["male", "female"];
// const OUTSPEED_SESAME_VOICES = ["male", "female"];
>>>>>>> da6c71b (added hooks and functionality):src/package/model-config.ts
const OUTSPEED_ORPHEUS_VOICES = ["tara", "leah", "jess", "leo", "dan", "mia", "zac", "zoe", "julia"];
const OPENAI_VOICES = ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"];

const MODALITIES = ["text", "audio"];

const TOOLS: FunctionDefinition[] = [
  {
    name: "get_weather",
    type: "function",
    description: "Retrieves the current weather information",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The geographic location for which to retrieve the weather",
        },
        units: {
          type: "string",
          description: "The unit of measurement for temperature, e.g., 'metric' or 'imperial'",
          enum: ["metric", "imperial"],
        },
        language: {
          type: "string",
          description: "Language of the response, e.g., 'en' for English",
        },
      },
      required: [],
    },
  },
];

export const models: Record<ModelName, ModelValue> = {
  "Orpheus-3b": {
    label: "Orpheus 3b",
    voices: OUTSPEED_ORPHEUS_VOICES,
    transcriptionModels: OUTSPEED_TRANSCRIPTION_MODELS,
    sessionConfig: {
      model: "Orpheus-3b",
      modalities: MODALITIES,
      temperature: 0.6,
      voice: "tara",
      instructions: "",
      tools: TOOLS,
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
      modalities: MODALITIES,
      temperature: 0.6,
      voice: "sage",
      instructions: "",
      tools: TOOLS,
      input_audio_transcription: null,
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
      modalities: MODALITIES,
      temperature: 0.6,
      voice: "sage",
      instructions: "",
      tools: TOOLS,
      input_audio_transcription: null,
      turn_detection: {
        type: "server_vad",
      },
    },
  },
};

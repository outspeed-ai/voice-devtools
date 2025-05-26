import {
  MODALITIES,
  OPENAI_TRANSCRIPTION_MODELS,
  OPENAI_VOICES,
  OUTSPEED_ORPHEUS_VOICES,
  OUTSPEED_TRANSCRIPTION_MODELS,
  type ModelName,
  type SessionConfig,
} from "@package";

type ModelValue = {
  label: string;
  voices: readonly string[];
  sessionConfig: SessionConfig;
  transcriptionModels: readonly string[];
};

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
      tools: [],
      turn_detection: {
        type: "server_vad",
        send_event_on_vad_state_change: false,
      },
      input_audio_transcription: {
        model: "whisper-v3-turbo",
      },
      output_audio_speed: 1.0,
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
      tools: [],
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
      tools: [],
      input_audio_transcription: null,
      turn_detection: {
        type: "server_vad",
      },
    },
  },
};

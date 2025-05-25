import {
  MODEL_VOICES,
  OPENAI_TRANSCRIPTION_MODELS,
  OpenAIVoice,
  OUTSPEED_TRANSCRIPTION_MODELS,
  OutspeedOrpheusVoice,
} from "./constants";
export type OutspeedTranscriptionModel = (typeof OUTSPEED_TRANSCRIPTION_MODELS)[number];
export type OpenAITranscriptionModel = (typeof OPENAI_TRANSCRIPTION_MODELS)[number];

export type ProviderName = "Outspeed" | "OpenAI";

export type Provider = {
  name: ProviderName;
  url: string;
  apiKeyUrl: string;
  costStructure: string;
  defaultVoice: string;
};

export type ModelVoices = typeof MODEL_VOICES;

export type FunctionDefinition = {
  type: "function";
  name: string;
  description: string;
  parameters: any;
};

export type SessionConfig =
  | ({
      model: "Orpheus-3b";
      voice: OutspeedOrpheusVoice;
      input_audio_transcription: { model: OutspeedTranscriptionModel } | null;
    } & BaseSessionConfigFields)
  | ({
      model: "gpt-4o-realtime-preview-2024-12-17" | "gpt-4o-mini-realtime-preview-2024-12-17";
      voice: OpenAIVoice;
      input_audio_transcription: { model: OpenAITranscriptionModel } | null;
    } & BaseSessionConfigFields);

type BaseSessionConfigFields = {
  modalities: readonly string[];
  temperature: number;
  instructions: string;
  tools: FunctionDefinition[];
  turn_detection: {
    type: "server_vad" | "semantic_vad";
    send_event_on_vad_state_change?: boolean;
  };
};

export type ConnectionConfig = {
  provider: Provider;
  sessionConfig: SessionConfig;
};

export interface OaiEvent {
  type: string;
  server_sent?: boolean;
  timestamp?: string;
  id?: string;
  event_id?: string;
  [key: string]: any;
}

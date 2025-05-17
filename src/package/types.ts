export type ProviderName = "Outspeed" | "OpenAI";

export type Provider = {
  name: ProviderName;
  url: string;
  apiKeyUrl: string;
  costStructure: string;
  defaultVoice: string;
};

export type ModelName =
  | "MiniCPM-o-2_6"
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

export type ModelValue = {
  label: string;
  voices: string[];
  sessionConfig: SessionConfig;
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
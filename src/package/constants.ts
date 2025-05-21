export const OUTSPEED_TRANSCRIPTION_MODELS = ["whisper-v3-turbo"] as const;
export type OutspeedTranscriptionModel = (typeof OUTSPEED_TRANSCRIPTION_MODELS)[number];

export const OPENAI_TRANSCRIPTION_MODELS = ["gpt-4o-transcribe", "gpt-4o-mini-transcribe", "whisper-1"] as const;
export type OpenAITranscriptionModel = (typeof OPENAI_TRANSCRIPTION_MODELS)[number];

export const OUTSPEED_ORPHEUS_VOICES = ["tara", "leah", "jess", "leo", "dan", "mia", "zac", "zoe", "julia"] as const;
export type OutspeedOrpheusVoice = (typeof OUTSPEED_ORPHEUS_VOICES)[number];

export const OPENAI_VOICES = ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"] as const;
export type OpenAIVoice = (typeof OPENAI_VOICES)[number];

export const MODALITIES = ["text", "audio"] as const;
export type Modality = (typeof MODALITIES)[number];

export const MODEL_NAMES = [
  "Orpheus-3b",
  "gpt-4o-realtime-preview-2024-12-17",
  "gpt-4o-mini-realtime-preview-2024-12-17",
] as const;
export type ModelName = (typeof MODEL_NAMES)[number];

export const MODEL_VOICES = {
  "Orpheus-3b": OUTSPEED_ORPHEUS_VOICES,
  "gpt-4o-realtime-preview-2024-12-17": OPENAI_VOICES,
  "gpt-4o-mini-realtime-preview-2024-12-17": OPENAI_VOICES,
} as const;

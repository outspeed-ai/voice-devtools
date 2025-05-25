import axios from "axios";

import { env } from "@/config/env";
import { getSupabaseAuthToken } from "@/config/supabase";
import { OUTSPEED_API_BASE_URL } from "@/constants";
import { type SessionConfig } from "@package";

// Create axios instance with base URL
const apiClient = axios.create({ baseURL: OUTSPEED_API_BASE_URL });

apiClient.interceptors.request.use(async (config) => {
  if (env.OUTSPEED_HOSTED) {
    const token = await getSupabaseAuthToken();
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  if (!env.OUTSPEED_API_KEY) {
    throw new Error("OUTSPEED_API_KEY is not set");
  }

  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${env.OUTSPEED_API_KEY}`;
  return config;
});

interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// API response types
export interface ApiKeyResponse {
  id: string;
  label: string;
  prefix: string;
  created_at: string;
  last_used: string | null;
}

export interface ApiKeyFullResponse extends ApiKeyResponse {
  key: string;
}

export interface ApiKeysResponse {
  api_keys: ApiKeyResponse[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

// API key endpoints
export const apiKeys = {
  // Get all API keys with pagination
  getAll: async (page = 1, pageSize = 10): Promise<ApiKeysResponse> => {
    const response = await apiClient.get<ApiKeysResponse>(`/api-keys?page=${page}&page_size=${pageSize}`);
    return response.data;
  },

  // Delete an API key
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api-keys/${id}`);
  },
};

export interface SessionResponse {
  sessions: Array<{
    id: string;
    config: {
      id: string;
      created: number;
      object: "realtime.session";
      model: string;
      modalities: string[];
      instructions: string;
      voice: string;
      temperature: number;
      tools: string[];
      tool_choice: string;
      turn_detection: {
        type: "server_vad" | "semantic_vad";
      };
    };
    status: "created" | "in_progress" | "completed";
    source?: string;
    recording: string | null;
    provider: string;
    created_at: string;
    created_by: string;
    started_at?: string;
    cost_usd?: number;
    duration_seconds?: number;
    ended_at?: string;
  }>;
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

interface InferenceMetric {
  _id: string;
  label: string;
  session_id: string;
  interrupted: boolean;
  input_audio_s3_url?: string;
  output_audio_s3_url?: string;
  created_at: string;
  time_to_first_response: number;
  total_generation_time: number;
  average_inter_response_delay: number;
  total_tokens: number;
  input_tokens: number;
  total_responses: number;
  text_responses: number;
  audio_responses: number;
  errors: string[];
  responses: {
    timestamp: string;
    delay_from_prev: number;
    type: string;
    jitter: number;
    text?: string;
    audio?: boolean;
    audio_jitter?: number;
  }[];
}

interface MetricsResponse {
  metrics: Array<InferenceMetric>;
  total: number;
}

interface SessionCreate {
  config: SessionConfig;
  provider: string;
}

interface SessionUpdate {
  config?: Partial<SessionConfig>;
  recording?: string;
  status?: "completed";
}

interface S3UploadUrlResponse {
  upload_url: string;
  s3_url: string;
  expires_in: number;
}

interface RecordingUrlResponse {
  presigned_url: string;
  expires_in: number;
}

interface AudioResponse {
  presigned_url: string;
}

interface TranscriptionResponse {
  text: string;
}

// Sessions API
export const fetchSessions = async ({ page = 1, pageSize = 5 }: PaginationParams): Promise<SessionResponse> => {
  const response = await apiClient.get(`/sessions?page=${page}&page_size=${pageSize}`);
  return response.data;
};

// Metrics API
export const fetchMetricsBySession = async ({
  sessionId,
  page = 1,
  pageSize = 5,
}: PaginationParams & { sessionId: string }): Promise<MetricsResponse> => {
  const response = await apiClient.get(`/metrics/by-session/${sessionId}?page=${page}&page_size=${pageSize}`);
  return response.data;
};

export const fetchMetricDetail = async (id: string): Promise<InferenceMetric> => {
  const response = await apiClient.get(`/metrics/${id}`);
  return response.data;
};

// Audio API
export const getAudioUrl = async (s3Url: string): Promise<AudioResponse> => {
  const response = await apiClient.post(`/audio`, { s3_url: s3Url });
  return response.data;
};

// Transcription API
export const transcribeAudio = async (audioBlob: Blob): Promise<TranscriptionResponse> => {
  const formData = new FormData();
  formData.append("audio_file", audioBlob, "recording.wav");

  const response = await apiClient.post("/stt/transcribe", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// Create a new session
export const createSession = async (data: SessionCreate): Promise<SessionResponse> => {
  const response = await apiClient.post("/sessions", data);
  return response.data;
};

// Update an existing session
export const updateSession = async (sessionId: string, data: SessionUpdate): Promise<SessionResponse> => {
  const response = await apiClient.put(`/sessions/${sessionId}`, data);
  return response.data;
};

// Get a pre-signed URL for uploading audio to S3
export const getAudioUploadUrl = async (params: {
  fileName: string;
  sessionId: string;
  contentType?: string;
}): Promise<S3UploadUrlResponse> => {
  const response = await apiClient.post("/sessions/audio-upload-url", {
    file_name: params.fileName,
    session_id: params.sessionId,
    content_type: params.contentType || "audio/wav",
  });
  return response.data;
};

// Get a pre-signed URL for playing a session recording
export const getRecordingUrl = async (sessionId: string): Promise<RecordingUrlResponse> => {
  const response = await apiClient.get(`/sessions/recording-url?session_id=${sessionId}`);
  return response.data;
};

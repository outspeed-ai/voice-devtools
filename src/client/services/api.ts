import axios from "axios";

import { env } from "@/config/env";
import { getSupabaseAuthToken } from "@/config/supabase";
import { OUTSPEED_API_BASE_URL } from "@/constants";
import { type SessionConfig } from "@src/model-config";

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

export interface SessionResponse {
  sessions: Array<{
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
    };
    status: "in_progress" | "completed";
    recording: string | null;
    provider: string;
    created_at: string;
    created_by: string;
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

import axios from "axios";

import { env } from "@/config/env";
import { getSupabaseAuthToken } from "@/config/supabase";
import { OUTSPEED_API_BASE_URL, OUTSPEED_API_KEY } from "@/constants";

// Create axios instance with base URL
const apiClient = axios.create({ baseURL: OUTSPEED_API_BASE_URL });

apiClient.interceptors.request.use(async (config) => {
  if (env.OUTSPEED_HOSTED) {
    const token = await getSupabaseAuthToken();
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  if (!OUTSPEED_API_KEY) {
    throw new Error("OUTSPEED_API_KEY is not set");
  }

  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${OUTSPEED_API_KEY}`;
  return config;
});

interface PaginationParams {
  page?: number;
  pageSize?: number;
}

interface SessionResponse {
  sessions: Array<{
    id: string;
    created: string;
    model: string;
    modalities: string[];
    total_tokens: number;
    total_cost: number;
    voice: string;
    temperature: number;
    input_audio_format: string;
    output_audio_format: string;
    instructions: string;
  }>;
  total: number;
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

interface AudioResponse {
  presigned_url: string;
}

// Audio API
export const getAudioUrl = async (s3Url: string): Promise<AudioResponse> => {
  const response = await apiClient.post(`/audio`, { s3_url: s3Url });
  return response.data;
};

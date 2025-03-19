import axios from "axios";

import { env } from "@/config/env";
import { getSupabaseAuthToken } from "@/config/supabase";
import { OUTSPEED_API_BASE_URL, OUTSPEED_API_KEY } from "@/constants";

// Create axios instance with base URL
const apiClient = axios.create({ baseURL: OUTSPEED_API_BASE_URL });

apiClient.interceptors.request.use(async (config) => {
  if (env.OUTSPEED_HOSTED) {
    const token = await getSupabaseAuthToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  if (!OUTSPEED_API_KEY) {
    throw new Error("OUTSPEED_API_KEY is not set");
  }

  config.headers["X-API-KEY"] = OUTSPEED_API_KEY;
  return config;
});

// Sessions API
export const fetchSessions = async ({ page = 1, pageSize = 5 }) => {
  const response = await apiClient.get(`/sessions?page=${page}&page_size=${pageSize}`);
  return response.data;
};

// Metrics API
export const fetchMetricsBySession = async ({ sessionId, page = 1, pageSize = 5 }) => {
  const response = await apiClient.get(`/metrics/by-session/${sessionId}?page=${page}&page_size=${pageSize}`);
  return response.data;
};

export const fetchMetricDetail = async (id) => {
  const response = await apiClient.get(`/metrics/${id}`);
  return response.data;
};

// Audio API
export const getAudioUrl = async (s3Url) => {
  const response = await apiClient.post(`/audio`, { s3_url: s3Url });
  return response.data;
};

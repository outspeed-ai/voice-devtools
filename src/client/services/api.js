import axios from "axios";

import { OUTSPEED_API_BASE_URL, OUTSPEED_API_KEY } from "@/constants";

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: OUTSPEED_API_BASE_URL,
  headers: {
    Authorization: `Bearer ${OUTSPEED_API_KEY}`,
  },
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

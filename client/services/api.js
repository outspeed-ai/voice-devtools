import axios from "axios";
import { getApiBaseUrl } from "../constants";

// Create axios instance with base URL factory function to ensure it uses the latest base URL
const createApiClient = () => {
  return axios.create({
    baseURL: getApiBaseUrl(),
  });
};

// Helper to get a fresh client each time to always use the current base URL
const getApiClient = () => createApiClient();

// Sessions API
export const fetchSessions = async ({ page = 1, pageSize = 5 }) => {
  const response = await getApiClient().get(
    `/sessions?page=${page}&page_size=${pageSize}`,
  );
  return response.data;
};

// Metrics API
export const fetchMetricsBySession = async ({
  sessionId,
  page = 1,
  pageSize = 5,
}) => {
  const response = await getApiClient().get(
    `/metrics/by-session/${sessionId}?page=${page}&page_size=${pageSize}`,
  );
  return response.data;
};

export const fetchMetricDetail = async (id) => {
  const response = await getApiClient().get(`/metrics/${id}`);
  return response.data;
};

// Audio API
export const getAudioUrl = async (s3Url) => {
  const response = await getApiClient().post(`/audio`, { s3_url: s3Url });
  return response.data;
};

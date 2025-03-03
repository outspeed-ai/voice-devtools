/** @type {URL} */
export let BASE_URL;
let apiBaseUrl;

// Initialize with the default from env
try {
  BASE_URL = new URL(import.meta.env.VITE_BASE_URL);
  apiBaseUrl = `${BASE_URL.toString()}v1`;
} catch (error) {
  error.message = `Error parsing BASE_URL '${import.meta.env.VITE_BASE_URL}': ${
    error.message
  }`;
  throw error;
}

// Function to update the BASE_URL dynamically
export function updateBaseUrl(newUrl) {
  try {
    BASE_URL = new URL(newUrl);
    apiBaseUrl = `${BASE_URL.toString()}v1`;
    return true;
  } catch (error) {
    console.error(`Error parsing new BASE_URL '${newUrl}': ${error.message}`);
    return false;
  }
}

export const CONNECTION_TYPES = {
  WEBRTC: "webrtc",
  WEBSOCKET: "websocket",
};

export const MODEL = "MiniCPM-o-2_6";

export const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

// Define as a getter function to always use the current value
export const getApiBaseUrl = () => apiBaseUrl;

/** @type {URL} */
export let BASE_URL;
let apiBaseUrl;

// Initialize with a default value instead of relying on environment variable
try {
  // Default to outspeed URL
  const defaultUrl = "https://api.outspeed.com";
  BASE_URL = new URL(defaultUrl);
  apiBaseUrl = `${BASE_URL.toString()}v1`;
} catch (error) {
  console.error(`Error initializing BASE_URL: ${error.message}`);
  // Fallback to a simple URL that should always work
  BASE_URL = new URL("https://api.outspeed.com");
  apiBaseUrl = `${BASE_URL.toString()}v1`;
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

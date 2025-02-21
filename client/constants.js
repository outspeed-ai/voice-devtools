/** @type {URL} */
export let BASE_URL;
try {
  BASE_URL = new URL(import.meta.env.VITE_BASE_URL);
} catch (error) {
  error.message = `Error parsing BASE_URL '${import.meta.env.VITE_BASE_URL}': ${
    error.message
  }`;
  throw error;
}

export const CONNECTION_TYPES = {
  WEBRTC: "webrtc",
  WEBSOCKET: "websocket",
};

export const MODEL = "MiniCPM-o-2_6";

export const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

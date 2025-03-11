export const CONNECTION_TYPES = {
  WEBRTC: "webrtc",
  WEBSOCKET: "websocket",
};

export const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export const OUTSPEED_API_BASE_URL = "https://api.outspeed.com/v1";

export const OUTSPEED_API_KEY = import.meta.env.OUTSPEED_API_KEY;

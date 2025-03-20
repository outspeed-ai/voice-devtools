import { env } from "@/config/env.js";

export const CONNECTION_TYPES = {
  WEBRTC: "webrtc",
  WEBSOCKET: "websocket",
};

export const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export const OUTSPEED_API_BASE_URL = `https://${env.OUTSPEED_SERVER_DOMAIN}/v1`;

export const OUTSPEED_API_KEY = env.OUTSPEED_API_KEY;

import { providers } from "./providers";
import { ConnectionConfig } from "./types";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

type WebRTCSession = {
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
};

const getPcAndDcInternal = async (): Promise<WebRTCSession> => {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  // setup to play remote audio from the model
  const audioElement = document.createElement("audio");
  audioElement.autoplay = true;
  pc.ontrack = (e) => (audioElement.srcObject = e.streams[0]);

  // add local audio track for microphone input
  const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioTrack = ms.getTracks()[0];
  audioTrack.enabled = false; // disable the track initially
  pc.addTrack(audioTrack);

  // set up the data channel
  const dc = pc.createDataChannel("oai-events");

  return { pc, dc };
};

export const startWebrtcSession = async (ephemeralKey: string, conn: ConnectionConfig): Promise<WebRTCSession> => {
  if (conn.provider === providers.OpenAI) {
    return startWebrtcSessionOpenAI(ephemeralKey, conn.sessionConfig.model);
  } else {
    return startWebrtcSessionOutspeed(ephemeralKey, conn.sessionConfig.model);
  }
};

/**
 * Start a WebRTC session with OpenAI.
 */
const startWebrtcSessionOpenAI = async (ephemeralKey: string, model: string): Promise<WebRTCSession> => {
  const { pc, dc } = await getPcAndDcInternal();

  // create offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // init connection with SDP exchange via HTTP
  const url = `https://${providers.OpenAI.url}/v1/realtime?model=${model}`;
  const sdpResponse = await fetch(url, {
    method: "POST",
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${ephemeralKey}`,
      "Content-Type": "application/sdp",
    },
  });

  // set remote description
  const answer: RTCSessionDescriptionInit = {
    type: "answer",
    sdp: await sdpResponse.text(),
  };
  await pc.setRemoteDescription(answer);

  return { pc, dc };
};

/**
 * Start a WebRTC session with Outspeed.
 */
export const startWebrtcSessionOutspeed = async (ephemeralKey: string, model: string): Promise<WebRTCSession> => {
  const { pc, dc } = await getPcAndDcInternal();

  // init connection with SDP exchange WebSocket
  // why Outspeed SDK exchange needs WebSocket?
  // because our server need ice candidates for WebRTC connection to work
  const ws = new WebSocket(
    `wss://${providers.Outspeed.url}/v1/realtime/ws?client_secret=${ephemeralKey}&model=${model}`,
  );

  // wait for the WebSocket connection to be established
  const wsConnectedPromise = new Promise((resolve, reject) => {
    ws.onopen = () => {
      console.log("WebSocket connected for WebRTC SDP exchange");
      ws.send(JSON.stringify({ type: "ping" }));
      resolve(null);
      ws.onopen = null;
      ws.onerror = null;
    };

    ws.onerror = (event) => {
      console.error("WebSocket error:", event);
      reject(event);
      ws.onopen = null;
      ws.onerror = null;
    };
  });
  await wsConnectedPromise;

  // send ICE candidates to the server
  pc.onicecandidate = (event) => {
    const { candidate } = event;
    if (!candidate) {
      return;
    }

    ws.send(
      JSON.stringify({
        type: "candidate",
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
      }),
    );
  };

  return new Promise((resolve, reject) => {
    pc.onconnectionstatechange = () => {
      console.log("connection state changed:", pc.connectionState);
      if (pc.connectionState === "failed") {
        reject(new Error("WebRTC connection failed"));
      } else if (pc.connectionState === "connected") {
        console.log("WebRTC connection successful. closing SDP exchange WebSocket....");
        ws.close(1000); //1000 indicates a normal closure
      }
    };

    ws.onerror = (event) => {
      console.error("SDP exchange WebSocket error:", event);
      reject(event);
    };

    ws.onclose = (e) => {
      // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code#value
      if (e.code !== 1000) {
        console.error("SDP exchange WebSocket closed", e.code, e.reason);
        reject(new Error(`SDP exchange WebSocket closed with code ${e.code}: ${e.reason}`));
      } else {
        console.log("SDP exchange WebSocket closed normally", e.code, e.reason);
      }
    };

    ws.onmessage = async (message) => {
      const data = JSON.parse(message.data);
      switch (data.type) {
        case "pong": {
          // create offer
          console.log("pong received. creating offer....");
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          // send offer
          console.log("sending offer....");
          ws.send(JSON.stringify({ type: "offer", sdp: pc.localDescription?.sdp }));
          return;
        }
        case "answer":
          // set remote description
          console.log("received answer. setting remote description....");
          await pc.setRemoteDescription(new RTCSessionDescription(data));

          // resolve the promise
          resolve({ pc, dc });
          return;
        case "candidate":
          await pc.addIceCandidate(
            new RTCIceCandidate({
              candidate: data.candidate,
              sdpMid: data.sdpMid,
              sdpMLineIndex: data.sdpMLineIndex,
            }),
          );
          return;
        case "error":
          console.error("WebSocket error in SDP exchange:", data);
          reject(new Error(data.message));
          ws.close(1000);
          return;
        default:
          console.error("data with unknown type received:", data);
          reject(new Error(`Unknown message type in signalling websocket`));
          ws.close(1000);
          return;
      }
    };
  });
};

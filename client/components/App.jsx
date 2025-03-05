import { useEffect, useRef, useState } from "react";

import { CONNECTION_TYPES, ICE_SERVERS, MODEL } from "@/constants";
import {
  OPENAI_PROVIDER,
  OUTSPEED_PROVIDER,
  useApi,
} from "@/contexts/ApiContext";
import EventLog from "./EventLog";
import SessionControlPanel from "./SessionControlPanel";
import SessionControls from "./SessionControls";

export default function App() {
  const { selectedProvider } = useApi();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [connectionType, setConnectionType] = useState(null);
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const signalingWebsocket = useRef(null);
  const websocket = useRef(null);
  const audioContext = useRef(null);
  const audioQueue = useRef([]);
  const isPlaying = useRef(false);

  const playNextAudio = async () => {
    if (!audioQueue.current.length || isPlaying.current) return;

    isPlaying.current = true;
    const audioData = audioQueue.current.shift();

    try {
      // Decode base64 to array buffer
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create audio context if not exists
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext ||
          window.webkitAudioContext)({
          sampleRate: 16000,
        });
      }

      // Decode audio data
      const audioBuffer = await audioContext.current.decodeAudioData(
        bytes.buffer,
      );

      // Create buffer source
      const source = audioContext.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.current.destination);

      // Play and handle completion
      source.onended = () => {
        isPlaying.current = false;
        playNextAudio();
      };
      source.start();
    } catch (error) {
      console.error("Error playing audio:", error);
      isPlaying.current = false;
      playNextAudio();
    }
  };

  const handleAudioDelta = (event) => {
    if (event.type === "response.audio.delta" && event.delta) {
      audioQueue.current.push(event.delta);
      playNextAudio();
    }
  };

  async function startWebrtcSession() {
    try {
      setEvents([]);

      // Get an ephemeral key from the server with selected provider
      const tokenResponse = await fetch(
        `/token?apiUrl=${selectedProvider.url}`,
      );
      const data = await tokenResponse.json();
      const ephemeralKey = data.client_secret.value;

      // Create a peer connection
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Set up to play remote audio from the model
      const audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      pc.ontrack = (e) => (audioElement.srcObject = e.streams[0]);

      // Add local audio track for microphone input
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(ms.getTracks()[0]);

      peerConnection.current = pc;

      // Set up data channel
      const dc = pc.createDataChannel("oai-events");
      setDataChannel(dc);

      if (selectedProvider.url === OPENAI_PROVIDER) {
        const noWsOffer = await pc.createOffer();
        await pc.setLocalDescription(noWsOffer);

        const url = `https://${selectedProvider.url}/v1/realtime?model=${MODEL}`;
        const sdpResponse = await fetch(url, {
          method: "POST",
          body: noWsOffer.sdp,
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
        });

        const answer = {
          type: "answer",
          sdp: await sdpResponse.text(),
        };
        await pc.setRemoteDescription(answer);
        setConnectionType(CONNECTION_TYPES.WEBRTC);
        return;
      }

      // signalling SDPs and ICE candidates via WebSocket
      const ws = new WebSocket(
        `wss://${OUTSPEED_PROVIDER}/v1/realtime/ws?client_secret=${ephemeralKey}`,
      );

      signalingWebsocket.current = ws;

      const wsConnectedPromise = new Promise((resolve, reject) => {
        ws.onopen = () => {
          console.log("WebSocket connected for WebRTC signaling");
          ws.send(JSON.stringify({ type: "ping" }));
          resolve();
        };

        ws.onerror = (event) => {
          console.error("WebSocket error:", event);
          handleConnectionError();
          reject(event);
        };
      });

      await wsConnectedPromise;

      ws.onmessage = async (message) => {
        const data = JSON.parse(message.data);
        switch (data.type) {
          case "pong":
            console.log("pong received");
            break;
          case "answer":
            await pc.setRemoteDescription(new RTCSessionDescription(data));
            break;
          case "candidate":
            await pc.addIceCandidate(
              new RTCIceCandidate({
                candidate: data.candidate,
                sdpMid: data.sdpMid,
                sdpMLineIndex: data.sdpMLineIndex,
              }),
            );
            break;
          case "error":
            console.error("WebSocket error after WS connection:", data.message);
            handleConnectionError();
            break;
          default:
            if (data.event_id) {
              data.server_sent = true;
              setEvents((prev) => [data, ...prev]);
            }

            break;
        }
      };

      // ICE candidate handling
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          ws.send(
            JSON.stringify({
              type: "candidate",
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
            }),
          );
        }
      };

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ws.send(
        JSON.stringify({
          type: "offer",
          sdp: pc.localDescription.sdp,
        }),
      );

      setConnectionType(CONNECTION_TYPES.WEBRTC);
      setLoadingModal(true); // data channel will open first and then the modal will be loaded
    } catch (error) {
      console.error("Failed to start WebRTC session:", error);
      handleConnectionError();
    }
  }

  async function startWebsocketSession() {
    try {
      setEvents([]);

      const url = `wss://${selectedProvider.url}/v1/realtime?model=${MODEL}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log("WebSocket session connected");
        setIsSessionActive(true);
        setConnectionType(CONNECTION_TYPES.WEBSOCKET);
      };

      ws.onclose = () => {
        console.log("WebSocket session closed");
        stopWebsocketSession();
      };

      ws.onerror = (error) => {
        console.error("WebSocket session error:", error);
        handleConnectionError();
      };

      ws.onmessage = handleWebSocketMessage;

      websocket.current = ws;
    } catch (error) {
      console.error("Failed to start WebSocket session:", error);
      handleConnectionError();
    }
  }

  function stopWebrtcSession() {
    if (dataChannel) {
      dataChannel.close();
    }

    if (peerConnection.current) {
      peerConnection.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      peerConnection.current.close();
    }

    cleanup();
  }

  function stopWebsocketSession() {
    if (websocket.current) {
      console.log("!!!!!!!!! closing websocket");
      websocket.current.close();
    }
    cleanup();
  }

  function cleanup() {
    setIsSessionActive(false);
    setLoadingModal(false);
    setConnectionType(null);
    setDataChannel(null);
    peerConnection.current = null;

    // Cleanup signaling WebSocket
    const signalingWs = signalingWebsocket.current;
    if (signalingWs) {
      signalingWs.onopen = null;
      signalingWs.onclose = null;
      signalingWs.onerror = null;
      signalingWs.onmessage = null;
      signalingWs.close();
      signalingWebsocket.current = null;
    }

    // Cleanup audio context
    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }
    audioQueue.current = [];
    isPlaying.current = false;
  }

  function handleConnectionError() {
    setIsSessionActive(false);
    alert("Connection error! Check the console for details.");
  }

  function sendClientEvent(message) {
    message.event_id = message.event_id || crypto.randomUUID();

    console.log("sending client event connectionType", connectionType);

    if (connectionType === CONNECTION_TYPES.WEBRTC && dataChannel) {
      dataChannel.send(JSON.stringify(message));
    } else if (
      connectionType === CONNECTION_TYPES.WEBSOCKET &&
      websocket.current
    ) {
      websocket.current.send(JSON.stringify(message));
    } else {
      console.error("Failed to send message - no active connection", message);
      return;
    }

    // timestamps are only for frontend debugging
    // they are not sent to the backend nor do they come from the backend
    message.timestamp = message.timestamp || new Date().toLocaleTimeString();

    setEvents((prev) => [message, ...prev]);
  }

  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    console.log("sending text message", event);

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  useEffect(() => {
    if (dataChannel) {
      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
      });

      dataChannel.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        event.timestamp = event.timestamp || new Date().toLocaleTimeString();
        event.server_sent = true; // to distinguish between server and client events

        if (event.type === "session.created") {
          setLoadingModal(false); // modal is now loaded
        }

        setEvents((prev) => [event, ...prev]);
      });

      dataChannel.addEventListener("error", (e) => {
        console.error("Data channel error:", e);
        handleConnectionError();
      });

      dataChannel.addEventListener("close", () => {
        console.log("Data channel closed");
        setIsSessionActive(false);
      });
    }
  }, [dataChannel]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (message) => {
    console.log("WebSocket message received:", message.data);
    const data = JSON.parse(message.data);

    data.event_id = data.event_id || crypto.randomUUID();
    data.type = data.type || "<unknown>";
    data.timestamp = data.timestamp || new Date().toLocaleTimeString();
    handleAudioDelta(data);
    setEvents((prev) => [data, ...prev]);
  };

  return (
    <>
      {/* <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={logo} />
          <h1>realtime console with Outspeed 🏎️</h1>
        </div>
      </nav> */}
      <main className="absolute top-16 left-0 right-0 bottom-0">
        <section className="absolute top-0 left-0 right-0 md:right-[380px] bottom-0 flex">
          <section className="absolute top-0 left-0 right-0 bottom-32 px-4 overflow-y-auto">
            <EventLog events={events} loadingModal={loadingModal} />
          </section>
          <section className="absolute h-32 left-0 right-0 bottom-0 p-4">
            <SessionControls
              loadingModal={loadingModal}
              connectionType={connectionType}
              startWebrtcSession={startWebrtcSession}
              stopWebrtcSession={stopWebrtcSession}
              startWebsocketSession={startWebsocketSession}
              stopWebsocketSession={stopWebsocketSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              events={events}
              isSessionActive={isSessionActive}
            />
          </section>
        </section>
        <section className="hidden md:block absolute top-0 w-[380px] right-0 bottom-0 p-4 pt-0 overflow-y-auto">
          <SessionControlPanel
            sendClientEvent={sendClientEvent}
            isSessionActive={isSessionActive}
          />
        </section>
      </main>
    </>
  );
}

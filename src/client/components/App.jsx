import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ICE_SERVERS } from "@/constants";
import { useModel } from "@/contexts/model";
import { providers } from "@src/session-config";
import Chat from "./Chat";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";

export default function App() {
  const { selectedModel } = useModel();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [loadingModel, setLoadingModal] = useState(false);
  const [events, setEvents] = useState([]);
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const signallingWsRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const audioContext = useRef(null);
  const audioQueue = useRef([]);
  const isPlaying = useRef(false);
  const [costData, setCostData] = useState(null);
  const [cumulativeCost, setCumulativeCost] = useState({
    inputTokens: 0,
    outputTokens: 0,
    totalCost: 0,
    durationInSeconds: 0,
  });
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const sessionDurationInterval = useRef(null);

  // Add refs for speech recording
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const currentSpeechItemRef = useRef(null);

  // Update session duration every second when active
  useEffect(() => {
    if (loadingModel || !isSessionActive || !sessionStartTime) {
      return;
    }

    sessionDurationInterval.current = setInterval(() => {
      const durationInSeconds = Math.floor(
        (Date.now() - sessionStartTime) / 1000,
      );

      // Update Outspeed cost if using that provider
      if (selectedModel.provider === providers.Outspeed) {
        const durationInMinutes = durationInSeconds / 60;
        const cost = durationInMinutes * selectedModel.cost.perMinute;

        setCostData({
          durationInSeconds,
          durationInMinutes,
          costPerMinute: selectedModel.cost.perMinute,
          totalCost: cost,
          timestamp: new Date().toLocaleTimeString(),
        });

        // Update cumulative cost for Outspeed
        setCumulativeCost({
          inputTokens: 0,
          outputTokens: 0,
          durationInSeconds,
          totalCost: cost,
        });
      }
    }, 1000);

    return () => {
      clearInterval(sessionDurationInterval.current);
    };
  }, [isSessionActive, sessionStartTime, selectedModel, loadingModel]);

  // Function to start recording audio
  const startRecording = () => {
    if (!pcRef.current) {
      return;
    }

    // Get the audio track from the peer connection
    const senders = pcRef.current.getSenders();
    const audioSender = senders.find(
      (sender) => sender.track && sender.track.kind === "audio",
    );

    if (!audioSender || !audioSender.track) {
      console.error("No audio track found");
      return;
    }

    // Create a MediaStream with the audio track
    const stream = new MediaStream([audioSender.track]);

    // Create a MediaRecorder
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    // Handle data available event
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    // Start recording
    mediaRecorder.start();
  };

  // Function to stop recording and create audio blob
  const stopRecording = () => {
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state === "inactive"
    ) {
      return;
    }

    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        resolve(audioUrl);
      };

      mediaRecorderRef.current.stop();
    });
  };

  async function startWebrtcSession() {
    // Reset costs when starting a new session
    setCostData(null);
    setCumulativeCost({
      inputTokens: 0,
      outputTokens: 0,
      durationInSeconds: 0,
      totalCost: 0,
    });
    setSessionStartTime(Date.now());

    try {
      setEvents([]);
      setMessages([]);

      const { sessionConfig } = selectedModel;

      // Get an ephemeral key from the server with selected provider
      const tokenResponse = await fetch(`/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionConfig),
      });
      const data = await tokenResponse.json();
      if (!tokenResponse.ok) {
        console.error("Failed to get ephemeral key", data);

        const toastOptions = {};
        if (data.code === "NO_API_KEY") {
          toastOptions.action = {
            label: "Get API Key",
            onClick: () =>
              window.open(selectedModel.provider.apiKeyUrl, "_blank"),
          };
        }

        toast.error(data.error || "Failed to get ephemeral key", toastOptions);
        return;
      }

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
      pcRef.current = pc;

      // Set up data channel
      const dc = pc.createDataChannel("oai-events");

      dc.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
        setSessionStartTime(Date.now());
      });

      dc.addEventListener("message", async (e) => {
        const event = JSON.parse(e.data);

        event.timestamp = event.timestamp || new Date().toLocaleTimeString();
        event.server_sent = true; // to distinguish between server and client events

        switch (event.type) {
          case "session.created":
            setLoadingModal(false); // modal is now loaded
            break;

          case "response.done":
            // Calculate cost for OpenAI API usage
            if (
              selectedModel.provider === providers.OpenAI &&
              event.response?.usage
            ) {
              const { usage } = event.response;
              const { input: inputCost, output: outputCost } =
                selectedModel.cost;

              // Get token counts
              const inputTokens = usage.input_tokens;
              const outputTokens = usage.output_tokens;

              // Calculate cost in dollars (cost is per million tokens)
              const inputCostValue = (inputTokens / 1000000) * inputCost;
              const outputCostValue = (outputTokens / 1000000) * outputCost;
              const totalCost = inputCostValue + outputCostValue;

              // Extract detailed token breakdown if available
              const tokenDetails = {
                input: usage.input_token_details || null,
                output: usage.output_token_details || null,
              };

              // Update current cost data
              setCostData({
                inputTokens,
                outputTokens,
                inputCost: inputCostValue,
                outputCost: outputCostValue,
                totalCost,
                tokenDetails,
                timestamp: new Date().toLocaleTimeString(),
              });

              // Update cumulative cost
              setCumulativeCost((prev) => ({
                inputTokens: prev.inputTokens + inputTokens,
                outputTokens: prev.outputTokens + outputTokens,
                totalCost: prev.totalCost + totalCost,
              }));
            }
            break;

          case "response.audio_transcript.done":
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                type: "text",
                content: event.transcript,
                timestamp: new Date().toLocaleTimeString(),
                item_id: event.item_id,
                event_id: event.event_id,
              },
            ]);
            break;

          case "error":
            if (!event.message) {
              break;
            }

            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                type: "error",
                content: event.message,
                timestamp: new Date().toLocaleTimeString(),
                event_id: event.event_id,
              },
            ]);
            break;

          case "input_audio_buffer.speech_started":
            // Start recording when speech is detected
            currentSpeechItemRef.current = {
              id: crypto.randomUUID(),
              startTime: event.audio_start_ms,
              eventId: event.event_id,
              item_id: event.item_id,
            };
            startRecording();
            break;

          case "input_audio_buffer.speech_stopped":
            // Stop recording when speech ends and add to messages
            if (currentSpeechItemRef.current?.startTime) {
              const audioUrl = await stopRecording();
              if (audioUrl) {
                const duration =
                  event.audio_end_ms - currentSpeechItemRef.current.startTime;

                // if we were to directly use currentSpeechItemRef.current in setMessages callback,
                // that would fail even tho we're setting it to null AFTER setMessages() since
                // state update is an async operation
                const currentSpeechItem = currentSpeechItemRef.current;

                setMessages((prev) => [
                  ...prev,
                  {
                    id: currentSpeechItem.id,
                    role: "user",
                    type: "audio",
                    content: audioUrl,
                    duration: duration,
                    timestamp: new Date().toLocaleTimeString(),
                  },
                ]);

                currentSpeechItemRef.current = null;
              }
            }
            break;
        }

        setEvents((prev) => [event, ...prev]);
      });

      dc.addEventListener("error", (e) => {
        console.error("Data channel error:", e);
        handleConnectionError();
      });

      dc.addEventListener("close", () => {
        console.log("Data channel closed");
        cleanup();
      });

      dcRef.current = dc;

      if (selectedModel.provider === providers.OpenAI) {
        // OpenAI WebRTC signalling with an HTTP POST request

        const noWsOffer = await pc.createOffer();
        await pc.setLocalDescription(noWsOffer);

        const url = `https://${selectedModel.provider.url}/v1/realtime?model=${sessionConfig.model}`;
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

        return;
      }

      // Outspeed WebRTC signalling of  SDPs and ICE candidates via WebSocket
      const ws = new WebSocket(
        `wss://${selectedModel.provider.url}/v1/realtime/ws?client_secret=${ephemeralKey}`,
      );

      signallingWsRef.current = ws;

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

      setLoadingModal(true); // data channel will open first and then the modal will be loaded
    } catch (error) {
      console.error("Failed to start WebRTC session:", error);
      handleConnectionError();
    }
  }

  function stopWebrtcSession() {
    // Stop recording if active
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (dcRef.current) {
      dcRef.current.close();
    }

    if (pcRef.current) {
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      pcRef.current.close();
    }

    // Stop the session duration interval
    if (sessionDurationInterval.current) {
      clearInterval(sessionDurationInterval.current);
      sessionDurationInterval.current = null;
    }

    cleanup();
  }

  function cleanup() {
    setIsSessionActive(false);
    setLoadingModal(false);
    pcRef.current = null;
    dcRef.current = null;
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    currentSpeechItemRef.current = null;

    // Cleanup signaling WebSocket
    const signalingWs = signallingWsRef.current;
    if (signalingWs) {
      signalingWs.onopen = null;
      signalingWs.onclose = null;
      signalingWs.onerror = null;
      signalingWs.onmessage = null;
      signalingWs.close();
      signallingWsRef.current = null;
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
    cleanup();
    toast.error("Connection error! Check the console for details.");
  }

  function sendClientEvent(message) {
    message.event_id = message.event_id || crypto.randomUUID();

    if (dcRef.current) {
      dcRef.current.send(JSON.stringify(message));
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

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        type: "text",
        content: message,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  return (
    <main className="h-full flex flex-col p-4 gap-4">
      <div className="flex grow gap-4 overflow-hidden">
        <div className="flex-1 h-full min-h-0 rounded-xl bg-white overflow-y-auto">
          <Chat
            messages={messages}
            setMessages={setMessages}
            isSessionActive={isSessionActive}
            loadingModel={loadingModel}
            sendTextMessage={sendTextMessage}
          />
        </div>
        <div className="flex-1 h-full min-h-0 rounded-xl bg-white overflow-y-auto">
          <EventLog
            events={events}
            loadingModal={loadingModel}
            costData={costData}
            cumulativeCost={cumulativeCost}
          />
        </div>
      </div>
      <section className="shrink-0">
        <SessionControls
          loadingModal={loadingModel}
          startWebrtcSession={startWebrtcSession}
          stopWebrtcSession={stopWebrtcSession}
          sendClientEvent={sendClientEvent}
          sendTextMessage={sendTextMessage}
          events={events}
          isSessionActive={isSessionActive}
        />
      </section>
    </main>
  );
}

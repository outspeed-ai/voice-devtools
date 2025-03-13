import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ICE_SERVERS } from "@/constants";
import { useModel } from "@/contexts/model";
import { calculateOpenAICosts, calculateTimeCosts, getInitialCostState, updateCumulativeCost } from "@/utils/cost-calc";
import { providers } from "@src/session-config";
import Chat from "./Chat";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";

export default function App() {
  const { selectedModel } = useModel();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [events, setEvents] = useState([]);
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const signallingWsRef = useRef(null);
  const [messages, setMessages] = useState(new Map());

  /** response id of message that is currently being streamed */
  const botStreamingTextRef = useRef(null);

  // states for cost calculation
  const [costState, setCostState] = useState(getInitialCostState());
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const sessionDurationInterval = useRef(null);

  // refs for speech recording
  const audioContext = useRef(null);
  const iAudioRecorderRef = useRef(null); // input audio recorder
  const oAudioRecorderRef = useRef(null); // output audio recorder
  const currentSpeechItemRef = useRef(null);
  const currentBotSpeechItemRef = useRef(null); // Reference for bot's speech

  // Update session duration every second when active
  useEffect(() => {
    if (loadingModel || !isSessionActive || !sessionStartTime) {
      return;
    }

    sessionDurationInterval.current = setInterval(() => {
      const durationInSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

      // Update Outspeed cost if using that provider
      if (selectedModel.provider === providers.Outspeed) {
        const timeCosts = calculateTimeCosts(durationInSeconds, selectedModel.cost.perMinute);

        // Update cost state for Outspeed (time-based)
        setCostState({
          ...getInitialCostState(),
          durationInSeconds,
          costPerMinute: selectedModel.cost.perMinute,
          totalCost: timeCosts.totalCost,
          timestamp: timeCosts.timestamp,
        });
      }
    }, 1000);

    return () => {
      clearInterval(sessionDurationInterval.current);
    };
  }, [loadingModel, isSessionActive, sessionStartTime, selectedModel]);

  useEffect(() => {
    if (loadingModel || !isSessionActive) {
      stopInputRecording();
      return;
    }

    startInputRecording();
    return () => {
      stopInputRecording();
      stopBotRecording();
      if (audioContext.current) {
        audioContext.current.close();
        audioContext.current = null;
      }
    };
  }, [isSessionActive, loadingModel]);

  // Function to start recording audio
  const startInputRecording = () => {
    if (!pcRef.current) {
      return;
    }

    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }

    // Get the audio track from the peer connection
    const senders = pcRef.current.getSenders();
    const audioSender = senders.find((sender) => sender.track && sender.track.kind === "audio");

    if (!audioSender || !audioSender.track) {
      console.error("No audio track found");
      return;
    }

    // Create a MediaStream with the audio track
    const stream = new MediaStream([audioSender.track]);

    // Create a MediaRecorder
    const mediaRecorder = new MediaRecorder(stream);
    iAudioRecorderRef.current = mediaRecorder;

    // Start recording
    mediaRecorder.start();
  };

  // Function to stop recording and create audio blob
  const stopInputRecording = () => {
    if (!iAudioRecorderRef.current || iAudioRecorderRef.current.state === "inactive") {
      return;
    }

    iAudioRecorderRef.current.stop();
  };

  // Function to start recording bot's audio output
  const startBotRecording = () => {
    if (!pcRef.current) {
      return;
    }

    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }

    // Get the audio track from the peer connection's receivers (bot's audio)
    const receivers = pcRef.current.getReceivers();
    const audioReceiver = receivers.find((receiver) => receiver.track && receiver.track.kind === "audio");

    if (!audioReceiver || !audioReceiver.track) {
      console.error("No bot audio track found");
      return;
    }

    // Create a MediaStream with the audio track
    const stream = new MediaStream([audioReceiver.track]);

    // Create a MediaRecorder
    const mediaRecorder = new MediaRecorder(stream);
    oAudioRecorderRef.current = mediaRecorder;

    // Start recording
    mediaRecorder.start();
  };

  // Function to stop bot recording
  const stopBotRecording = () => {
    if (!oAudioRecorderRef.current || oAudioRecorderRef.current.state === "inactive") {
      return;
    }

    oAudioRecorderRef.current.stop();
  };

  const getRecording = () => {
    return new Promise((resolve) => {
      // Create a one-time event listener for dataavailable
      const handleDataAvailable = async (e) => {
        if (!iAudioRecorderRef.current) {
          console.error("No input audio recorder found");
          return;
        }

        // Remove the event listener to avoid memory leaks
        iAudioRecorderRef.current.removeEventListener("dataavailable", handleDataAvailable);

        const audioBlob = new Blob([e.data], {
          type: "audio/webm",
        });

        const audioArrayBuffer = await audioBlob.arrayBuffer();

        if (!currentSpeechItemRef.current.startTime) {
          console.error("No start time found");
          return;
        }

        const duration = (Date.now() - currentSpeechItemRef.current.startTime + 1000) / 1000;
        const audioData = await audioContext.current.decodeAudioData(audioArrayBuffer);

        /** @type {Float32Array} */
        const lastNSeconds = audioData.getChannelData(0).slice(-Math.floor(audioData.sampleRate * duration));

        // Create a new AudioBuffer to hold our sliced data
        /** @type {AudioBuffer} */
        const newAudioBuffer = audioContext.current.createBuffer(
          1, // mono channel
          lastNSeconds.length,
          audioData.sampleRate,
        );

        // Copy the data to the new buffer
        newAudioBuffer.getChannelData(0).set(lastNSeconds);
        resolve([newAudioBuffer, newAudioBuffer.duration]);

        // start recording again
        startInputRecording();
      };

      // Add the one-time event listener
      iAudioRecorderRef.current.addEventListener("dataavailable", handleDataAvailable);

      // stopping the recording, which will trigger the dataavailable event
      stopInputRecording();
    });
  };

  // Function to get bot's recording
  const getBotRecording = () => {
    return new Promise((resolve) => {
      // Create a one-time event listener for dataavailable
      const handleDataAvailable = async (e) => {
        if (!oAudioRecorderRef.current) {
          console.error("No bot audio recorder found");
          return;
        }

        // Remove the event listener to avoid memory leaks
        oAudioRecorderRef.current.removeEventListener("dataavailable", handleDataAvailable);

        const audioBlob = new Blob([e.data], {
          type: "audio/webm",
        });

        const audioArrayBuffer = await audioBlob.arrayBuffer();

        if (!currentBotSpeechItemRef.current.startTime) {
          console.error("No bot start time found");
          return;
        }

        const audioBuffer = await audioContext.current.decodeAudioData(audioArrayBuffer);

        resolve([audioBuffer, audioBuffer.duration]);
      };

      // Add the one-time event listener
      oAudioRecorderRef.current.addEventListener("dataavailable", handleDataAvailable);

      // stopping the recording, which will trigger the dataavailable event
      // manually causing a delay to ensure the audio is fully recorded
      // for some reason, a few milliseconds is getting cut off otherwise
      // which means that when we receive the output_audio_buffer.stopped event,
      // the audio didn't fully stop
      setTimeout(() => {
        stopBotRecording();
      }, 400);
    });
  };

  const handleErrorEvent = (errorMessage, eventId) => {
    const id = eventId || crypto.randomUUID();
    setMessages((prev) => {
      const newMessages = new Map(prev);
      newMessages.set(id, {
        text: {
          role: "assistant",
          type: "error",
          content: errorMessage,
          timestamp: new Date().toLocaleTimeString(),
        },
      });
      return newMessages;
    });
  };

  async function startWebrtcSession() {
    try {
      // Reset when starting a new session
      setCostState(getInitialCostState());
      setSessionStartTime(Date.now());
      setEvents([]);
      setMessages(new Map());

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
            onClick: () => window.open(selectedModel.provider.apiKeyUrl, "_blank"),
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
      const audioTrack = ms.getTracks()[0];
      audioTrack.enabled = false; // disable the track initially
      pc.addTrack(audioTrack);
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
            setLoadingModel(false);
            pcRef.current.getSenders().forEach((sender) => {
              sender.track.enabled = true;
            });
            break;

          case "response.done":
            // Calculate cost for OpenAI Realtime API based on  usage
            if (selectedModel.provider === providers.OpenAI && event.response?.usage) {
              const newCostData = calculateOpenAICosts(event.response.usage, selectedModel.cost);

              // Update cost state by incorporating the new data into cumulative
              setCostState((prev) => updateCumulativeCost(prev, newCostData));
            }

            if (event.response.status == "failed") {
              handleErrorEvent(event.response.status_details?.error?.message || "server error", event.event_id);
            }
            break;

          case "response.audio_transcript.delta":
            botStreamingTextRef.current = event.response_id;
            setMessages((prev) => {
              const newMessages = new Map(prev);
              const currentMessage = prev.get(event.response_id) || { text: null, audio: null };
              newMessages.set(event.response_id, {
                ...currentMessage,
                text: {
                  role: "assistant",
                  content: (currentMessage.text?.content || "") + event.delta,
                  timestamp: !currentMessage.text?.timestamp
                    ? new Date().toLocaleTimeString()
                    : currentMessage.text.timestamp,
                  streaming: true,
                },
              });
              return newMessages;
            });
            break;

          case "response.audio_transcript.done":
            botStreamingTextRef.current = null;
            setMessages((prev) => {
              const newMessages = new Map(prev);
              const currentMessage = prev.get(event.response_id) || {
                text: null,
                audio: null,
              };
              newMessages.set(event.response_id, {
                ...currentMessage,
                text: {
                  role: "assistant",
                  content: event.transcript,
                  timestamp: !currentMessage.text?.timestamp
                    ? new Date().toLocaleTimeString()
                    : currentMessage.text.timestamp,
                  streaming: false,
                },
              });
              return newMessages;
            });
            break;

          case "error":
            handleErrorEvent(event.error.message || "an error occurred", event.event_id);
            break;

          case "input_audio_buffer.speech_started":
            currentSpeechItemRef.current = {
              id: crypto.randomUUID(),
              startTime: Date.now(),
            };
            break;

          case "input_audio_buffer.speech_stopped": {
            // Stop recording when speech ends and add to messages

            const currentSpeechItem = currentSpeechItemRef.current;
            if (!currentSpeechItem) {
              console.error("error: input_audio_buffer.speech_stopped - No speech item found");
              break;
            }

            const [audioBuffer, duration] = await getRecording();
            if (!audioBuffer) {
              console.error("error: input_audio_buffer.speech_stopped - No audio buffer found");
              break;
            }

            setMessages((prev) => {
              const newMessages = new Map(prev);
              newMessages.set(currentSpeechItem.id, {
                audio: {
                  content: audioBuffer,
                  duration: duration,
                  timestamp: new Date().toLocaleTimeString(),
                  role: "user",
                },
              });
              return newMessages;
            });

            currentSpeechItemRef.current = null; // reset the ref
            break;
          }

          case "output_audio_buffer.started":
            startBotRecording();
            currentBotSpeechItemRef.current = {
              id: event.response_id,
              startTime: Date.now(),
            };
            break;

          case "output_audio_buffer.stopped":
            // Stop recording when bot stops speaking and add to messages
            if (currentBotSpeechItemRef.current?.startTime) {
              const [audioBuffer, duration] = await getBotRecording();
              if (!audioBuffer) {
                console.error("error: output_audio_buffer.stopped - No audio buffer found");
                break;
              }

              const currentBotSpeechItem = currentBotSpeechItemRef.current;

              setMessages((prev) => {
                const newMessages = new Map(prev);
                const responseId = currentBotSpeechItem.id;

                if (responseId && prev.has(responseId)) {
                  const currentMessage = prev.get(responseId);
                  newMessages.set(responseId, {
                    ...currentMessage,
                    audio: {
                      content: audioBuffer,
                      duration: duration,
                      timestamp: new Date().toLocaleTimeString(),
                      role: "assistant",
                    },
                  });
                } else {
                  // If we can't find the matching text message, create a new message with just audio
                  const newId = crypto.randomUUID();
                  newMessages.set(newId, {
                    audio: {
                      content: audioBuffer,
                      duration: duration,
                      timestamp: new Date().toLocaleTimeString(),
                      role: "assistant",
                    },
                  });
                }
                return newMessages;
              });

              currentBotSpeechItemRef.current = null;
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
      const ws = new WebSocket(`wss://${selectedModel.provider.url}/v1/realtime/ws?client_secret=${ephemeralKey}`);

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

      setLoadingModel(true); // data channel will open first and then the model will be loaded
    } catch (error) {
      console.error("Failed to start WebRTC session:", error);
      handleConnectionError();
    }
  }

  function stopWebrtcSession() {
    // Stop recording if active
    if (iAudioRecorderRef.current && iAudioRecorderRef.current.state !== "inactive") {
      iAudioRecorderRef.current.stop();
    }

    // Stop bot recording if active
    if (oAudioRecorderRef.current && oAudioRecorderRef.current.state !== "inactive") {
      oAudioRecorderRef.current.stop();
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
    setLoadingModel(false);
    pcRef.current = null;
    dcRef.current = null;
    iAudioRecorderRef.current = null;
    oAudioRecorderRef.current = null; // Clean up bot audio recorder
    currentSpeechItemRef.current = null;
    currentBotSpeechItemRef.current = null; // Clean up bot speech reference

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

    botStreamingTextRef.current = null;
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

    const messageId = crypto.randomUUID();
    setMessages((prev) => {
      const newMessages = new Map(prev);
      newMessages.set(messageId, {
        text: {
          content: message,
          timestamp: new Date().toLocaleTimeString(),
          role: "user",
        },
      });
      return newMessages;
    });

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  return (
    <main className="h-full flex flex-col p-4 gap-4">
      <div className="flex grow gap-4 overflow-hidden">
        <div className="flex-1 h-full min-h-0 rounded-xl bg-white overflow-y-auto">
          <Chat
            messages={messages}
            isSessionActive={isSessionActive}
            loadingModel={loadingModel}
            sendTextMessage={sendTextMessage}
          />
        </div>
        <div className="flex-1 h-full min-h-0 rounded-xl bg-white overflow-y-auto">
          <EventLog events={events} loadingModel={loadingModel} costState={costState} />
        </div>
      </div>
      <section className="shrink-0">
        <SessionControls
          loadingModel={loadingModel}
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

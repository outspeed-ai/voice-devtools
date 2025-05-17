import { useRef, useState } from "react";

import AudioRecorder from "@/helpers/audio-recorder";
import { type ConnectionConfig, type OaiEvent } from "./types";
import { startWebrtcSession } from "./webrtc";

export const useRealtime = () => {
  const [activeState, setActiveState] = useState<"inactive" | "loading" | "active">("inactive");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  /** response id of message that is currently being streamed */
  const botStreamingTextRef = useRef<string | null>(null);

  // refs for speech recording
  const sessionAudioRecorderRef = useRef<AudioRecorder | null>(null); // session audio recorder
  const currentUserSpeechItemRef = useRef<{ startTime: number; id: string } | null>(null);
  const currentBotSpeechItemRef = useRef<{ startTime: number; id: string } | null>(null);
  const iTrackRef = useRef<MediaStreamTrack | null>(null);
  const oTrackRef = useRef<MediaStreamTrack | null>(null);

  const handleErrorEvent = (errorMessage: string, eventId: string, fullError: unknown) => {
    if (fullError) {
      console.error("error event:", fullError);
    }
    return { errorMessage, eventId, fullError }
  };

  const handleOaiServerEvent = async (pc: RTCPeerConnection, event: OaiEvent) => {
    event.event_id = event.event_id || crypto.randomUUID();
    event.timestamp = event.timestamp || new Date().toLocaleTimeString();
    event.server_sent = true; // to distinguish between server and client events

    switch (event.type) {
      case "session.created":
        setActiveState("active");

        console.log("session created", event);

        pc.getSenders().forEach((sender) => {
          if (!sender.track) {
            console.error("error: session.created - No track found");
            return;
          }

          // input track will be muted so we need to unmute it
          sender.track.enabled = true;
        });
        break;

      case "session.updated":
        console.log("session updated", event);
        break;

      case "response.done":
        // Calculate cost for OpenAI Realtime API based on  usage
        if (event.response.status == "failed") {
          handleErrorEvent(event.response.status_details?.error?.message || "server error", event.event_id, event);
        }
        break;

      case "response.audio_transcript.delta":
        botStreamingTextRef.current = event.response_id;
        break;

      case "response.audio_transcript.done":
        botStreamingTextRef.current = null;
        break;

      case "error":
        handleErrorEvent(event.error?.message || "an error occurred", event.event_id, event);
        break;

      case "input_audio_buffer.speech_started":
        currentUserSpeechItemRef.current = {
          id: crypto.randomUUID(),
          startTime: Date.now(),
        };
        break;

      case "input_audio_buffer.speech_stopped": {
        const currentUserSpeechItem = currentUserSpeechItemRef.current;
        if (!currentUserSpeechItem) {
          console.error("error: input_audio_buffer.speech_stopped - user speech item not found");
          break;
        }

        // reset the user speech item ref
        currentUserSpeechItemRef.current = null;
        break;
      }

      case "output_audio_buffer.started":
        currentBotSpeechItemRef.current = {
          id: event.response_id,
          startTime: Date.now(),
        };
        break;

      case "output_audio_buffer.cleared":
      case "output_audio_buffer.stopped":
        {
          const currentBotSpeechItem = currentBotSpeechItemRef.current;
          if (!currentBotSpeechItem) {
            console.error("error: output_audio_buffer.stopped - bot speech item not found");
            break;
          }

          // reset the bot speech item ref
          currentBotSpeechItemRef.current = null;
        }
        break;
    }
  };

  async function startSession(ephemeralKey: string, { provider, sessionConfig } : ConnectionConfig) {
    try {
      setActiveState("loading");

      // step 2.start the WebRTC session
      const { pc, dc } = await startWebrtcSession(ephemeralKey, { provider, sessionConfig });
      pcRef.current = pc;
      dcRef.current = dc;

      dc.addEventListener("open", () => {
        console.log("data channel opened");

        const tracks: MediaStreamTrack[] = [];

        // initialize audio recorders
        const sender = pc.getSenders()[0];
        if (sender?.track?.kind === "audio") {
          iTrackRef.current = sender.track;
          console.log("input audio recorder initialized");
          tracks.push(sender.track);
        } else {
          console.error("error: session.created -  sender audio track not found");
        }

        const receiver = pc.getReceivers()[0];
        if (receiver?.track?.kind === "audio") {
          oTrackRef.current = receiver.track;
          console.log("output audio recorder initialized");
          tracks.push(receiver.track);
        } else {
          console.error("error: session.created - receiver audio track not found");
        }

        if (tracks.length == 2) {
          sessionAudioRecorderRef.current = new AudioRecorder(tracks);
          console.log(`session audio recorder initialized with ${tracks.length} tracks`);
        } else {
          console.error(`error: session audio recorder - expected 2 tracks, got ${tracks.length}`);
        }
      });

      // handle events from the data channel
      dc.addEventListener("message", async (e) => {
        try {
          const event = JSON.parse(e.data);
          handleOaiServerEvent(pc, event);
        } catch (error) {
          console.error("error: data channel message:", error);
        }
      });

      // handle errors from the data channel
      dc.addEventListener("error", (e) => {
        console.error("data channel error:", e);
        handleConnectionError();
      });

      // handle close events from the data channel
      dc.addEventListener("close", () => {
        console.log("data channel closed");
        cleanup();
      });
    } catch (error) {
      console.error("failed to start WebRTC session:", error);
      handleConnectionError();
    }
  }

  async function stopSession() {
    console.log("stopping session");

    // Stop recording if active

    if (sessionAudioRecorderRef.current?.getState() === "recording") {
      const audio = await sessionAudioRecorderRef.current.stop();
      if (!audio) {
        console.error("error: session audio recorder stopped but didn't get audio URL");
      } else {
      }
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

    cleanup();

    console.log("session stopped");

    // if this function was called because of a connection error, don't show a toast
    // i.e we got an error even before the session could be active
    if (activeState !== "active") {
      return;
    }
  }

  function cleanup() {
    setActiveState("inactive");
    pcRef.current = null;
    dcRef.current = null;
    currentUserSpeechItemRef.current = null;
    currentBotSpeechItemRef.current = null; // Clean up bot speech reference

    botStreamingTextRef.current = null;
    iTrackRef.current = null
    oTrackRef.current = null;
  }

  function handleConnectionError() {
    stopSession();
    cleanup();
  }

  function sendClientEvent(event: OaiEvent) {
    event.event_id = event.event_id || crypto.randomUUID();

    if (dcRef.current) {
      dcRef.current.send(JSON.stringify(event));
    } else {
      console.error("Failed to send message - no active connection", event);
      return;
    }
  }

  function sendTextMessage(message: string) {
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

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  return {
    startSession, stopSession, sendTextMessage, oTrackRef, iTrackRef
  }
};

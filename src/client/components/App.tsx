import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type ExternalToast, toast } from "sonner";

import { useModel } from "@/contexts/model";
import AudioRecorder from "@/helpers/audio-recorder";
import { getEphemeralKey } from "@/helpers/ephemeral-key";
import { startWebrtcSession } from "@/helpers/webrtc";
import { OaiEvent } from "@/types";
import {
  calculateOpenAICosts,
  calculateTimeCosts,
  CostState,
  getInitialCostState,
  updateCumulativeCostOpenAI,
} from "@/utils/cost-calc";
import { agent } from "@src/agent-config";
import { providers } from "@src/settings";
import Chat, { MessageBubbleProps } from "./Chat";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import SessionDetailsPanel from "./SessionDetails";

export default function App() {
  const { selectedModel } = useModel();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [events, setEvents] = useState<OaiEvent[]>([]);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const [messages, setMessages] = useState<Map<string, MessageBubbleProps>>(new Map());

  /** response id of message that is currently being streamed */
  const botStreamingTextRef = useRef<string | null>(null);

  // states for cost calculation
  const [costState, setCostState] = useState<CostState>(getInitialCostState());
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const sessionDurationInterval = useRef<NodeJS.Timeout>(undefined);

  // refs for speech recording
  const iAudioRecorderRef = useRef<AudioRecorder | null>(null); // input audio recorder
  const oAudioRecorderRef = useRef<AudioRecorder | null>(null); // output audio recorder
  const currentUserSpeechItemRef = useRef<{ startTime: number; id: string } | null>(null);
  const currentBotSpeechItemRef = useRef<{ startTime: number; id: string } | null>(null);

  const navigate = useNavigate();

  // Update session duration every second when active
  useEffect(() => {
    if (loadingModel || !isSessionActive || !sessionStartTime) {
      return;
    }

    sessionDurationInterval.current = setInterval(() => {
      const durationInSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

      // Update Outspeed cost if using that provider
      if (selectedModel.provider === providers.Outspeed) {
        if (!("perMinute" in selectedModel.cost)) {
          throw new Error("perMinute is not defined in the cost object");
        }

        const costPerMinute = selectedModel.cost.perMinute;
        const timeCosts = calculateTimeCosts(durationInSeconds, costPerMinute);

        // Update cost state for Outspeed (time-based)
        setCostState({
          ...getInitialCostState(),
          durationInSeconds,
          costPerMinute,
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
    if (isSessionActive && iAudioRecorderRef.current) {
      console.log("starting user speech audio recorder");
      iAudioRecorderRef.current.start();
    }

    return () => {
      if (iAudioRecorderRef.current?.getState() === "recording") {
        console.log("stopping user speech audio recorder");
        iAudioRecorderRef.current.stop();
      }
    };
  }, [isSessionActive]);

  const handleErrorEvent = (errorMessage: string, eventId: string, fullError: unknown) => {
    if (fullError) {
      console.error("error event:", fullError);
    }

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

  const handleOaiServerEvent = async (pc: RTCPeerConnection, event: OaiEvent) => {
    event.event_id = event.event_id || crypto.randomUUID();
    event.timestamp = event.timestamp || new Date().toLocaleTimeString();
    event.server_sent = true; // to distinguish between server and client events

    switch (event.type) {
      case "session.created":
        setLoadingModel(false);
        pc.getSenders().forEach((sender) => {
          if (!sender.track) {
            console.error("error: session.created - No track found");
            return;
          }

          // input track will be muted so we need to unmute it
          sender.track.enabled = true;
        });
        break;

      case "response.done":
        // Calculate cost for OpenAI Realtime API based on  usage
        if (selectedModel.provider === providers.OpenAI && event.response?.usage) {
          if (!("input" in selectedModel.cost)) {
            throw new Error("input is not defined in the cost object");
          }

          const newCostData = calculateOpenAICosts(event.response.usage, selectedModel.cost);

          // Update cost state by incorporating the new data into cumulative
          setCostState((prev) => updateCumulativeCostOpenAI(prev, newCostData));
        }

        if (event.response.status == "failed") {
          handleErrorEvent(event.response.status_details?.error?.message || "server error", event.event_id, event);
        }
        break;

      case "response.audio_transcript.delta":
        botStreamingTextRef.current = event.response_id;
        setMessages((prev) => {
          const newMessages = new Map(prev);
          const currentMessage = prev.get(event.response_id) || {};
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
          const currentMessage = prev.get(event.response_id) || {};
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
        handleErrorEvent(event.error?.message || "an error occurred", event.event_id, event);
        break;

      case "input_audio_buffer.speech_started":
        if (!iAudioRecorderRef.current) {
          console.error("error: input_audio_buffer.speech_started - audio recorder not found");
          break;
        }

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

        const iRecorder = iAudioRecorderRef.current;
        if (!iRecorder) {
          console.error("error: input_audio_buffer.speech_stopped - audio recorder not found");
          break;
        }

        // create a new message with processing set to true
        setMessages((prev) => {
          const newMessages = new Map(prev);
          newMessages.set(currentUserSpeechItem.id, {
            audio: {
              content: "",
              timestamp: new Date().toLocaleTimeString(),
              role: "user",
              processing: true,
            },
          });
          return newMessages;
        });

        const duration = Date.now() - currentUserSpeechItem.startTime + 1000;
        const audioUrl = await iRecorder.stop(duration);

        console.log("starting user input speech recorder again...");
        iRecorder.start();

        if (!audioUrl) {
          console.error("error:input_audio_buffer.speech_stopped - audio url not found");
          break;
        }

        // finally update the message with the audio url
        setMessages((prev) => {
          const newMessages = new Map(prev);
          newMessages.set(currentUserSpeechItem.id, {
            audio: {
              content: audioUrl,
              timestamp: new Date().toLocaleTimeString(),
              role: "user",
            },
          });
          return newMessages;
        });

        break;
      }

      case "output_audio_buffer.started":
        if (!oAudioRecorderRef.current) {
          console.error("error: output_audio_buffer.started - audio recorder not found");
          break;
        }

        oAudioRecorderRef.current.start();
        currentBotSpeechItemRef.current = {
          id: event.response_id,
          startTime: Date.now(),
        };
        break;

      case "output_audio_buffer.stopped":
        {
          const currentBotSpeechItem = currentBotSpeechItemRef.current;
          if (!currentBotSpeechItem) {
            console.error("error: output_audio_buffer.stopped - bot speech item not found");
            break;
          }

          // reset the bot speech item ref
          currentBotSpeechItemRef.current = null;

          const oRecorder = oAudioRecorderRef.current;
          if (!oRecorder) {
            console.error("error: output_audio_buffer.stopped - audio recorder not found");
            break;
          }

          const audioUrl = await oRecorder.stop();
          if (!audioUrl) {
            console.error("error: output_audio_buffer.stopped - audio url not found");
            break;
          }

          setMessages((prev) => {
            const newMessages = new Map(prev);
            const responseId = currentBotSpeechItem.id;

            const audio = {
              content: audioUrl,
              timestamp: new Date().toLocaleTimeString(),
              role: "assistant",
            };

            if (responseId && prev.has(responseId)) {
              const currentMessage = prev.get(responseId);
              newMessages.set(responseId, {
                ...currentMessage,
                audio,
              });
            } else {
              // If we can't find the matching text message, create a new message with just audio
              const newId = crypto.randomUUID();
              newMessages.set(newId, { audio });
            }
            return newMessages;
          });
        }
        break;
    }

    setEvents((prev) => [event, ...prev]);
  };

  async function startSession() {
    try {
      const { sessionConfig } = selectedModel;
      const concatSessionConfig = {
        ...sessionConfig,
        instructions: agent.instructions,
      };

      // step 1. get ephemeral key
      const ephemeralKey = await getEphemeralKey(selectedModel.provider, concatSessionConfig);
      if (!ephemeralKey) {
        return;
      }

      // step 2.start the WebRTC session
      const { pc, dc } = await startWebrtcSession(ephemeralKey, selectedModel);
      pcRef.current = pc;
      dcRef.current = dc;

      dc.addEventListener("open", () => {
        console.log("data channel opened");

        // initialize audio recorders
        const sender = pc.getSenders()[0];
        if (sender?.track?.kind === "audio") {
          iAudioRecorderRef.current = new AudioRecorder(sender.track);
          console.log("input audio recorder initialized");
        } else {
          console.error("error: session.created - No audio track found");
        }

        const receiver = pc.getReceivers()[0];
        if (receiver?.track?.kind === "audio") {
          oAudioRecorderRef.current = new AudioRecorder(receiver.track);
          console.log("output audio recorder initialized");
        } else {
          console.error("error: session.created - No audio track found");
        }

        // reset states
        setMessages(new Map());
        setEvents([]);
        setCostState(getInitialCostState());
        setIsSessionActive(true);
        setSessionStartTime(Date.now());
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

  function stopSession() {
    // Stop recording if active
    iAudioRecorderRef.current?.dispose();
    oAudioRecorderRef.current?.dispose();

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
      sessionDurationInterval.current = undefined;
    }

    cleanup();

    // if this function was called because of a connection error, don't show a toast
    if (!isSessionActive) {
      return;
    }

    const toastOptions: ExternalToast = { richColors: false };

    // only show this action if the provider is Outspeed
    if (selectedModel.provider === providers.Outspeed) {
      toastOptions.action = {
        label: "View Details",
        onClick: () => navigate("/sessions"),
      };
    }

    toast.info("Session stopped.", toastOptions);
  }

  function cleanup() {
    setIsSessionActive(false);
    setLoadingModel(false);
    pcRef.current = null;
    dcRef.current = null;
    iAudioRecorderRef.current = null;
    oAudioRecorderRef.current = null; // Clean up bot audio recorder
    currentUserSpeechItemRef.current = null;
    currentBotSpeechItemRef.current = null; // Clean up bot speech reference

    botStreamingTextRef.current = null;
  }

  function handleConnectionError() {
    stopSession();
    cleanup();
    toast.error("Connection error! Check the console for details.");
  }

  function sendClientEvent(event: OaiEvent) {
    event.event_id = event.event_id || crypto.randomUUID();

    if (dcRef.current) {
      dcRef.current.send(JSON.stringify(event));
    } else {
      console.error("Failed to send message - no active connection", event);
      return;
    }

    // timestamps are only for frontend debugging
    // they are not sent to the backend nor do they come from the backend
    event.timestamp = event.timestamp || new Date().toLocaleTimeString();

    setEvents((prev) => [event, ...prev]);
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
    <main className="h-full flex flex-col px-4 pb-4 gap-4">
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
          <RightSide
            isSessionActive={isSessionActive}
            loadingModel={loadingModel}
            events={events}
            costState={costState}
          />
        </div>
      </div>
      <section className="shrink-0">
        <SessionControls
          loadingModel={loadingModel}
          startWebrtcSession={startSession}
          stopWebrtcSession={stopSession}
          isSessionActive={isSessionActive}
        />
      </section>
    </main>
  );
}

interface RightSideProps {
  isSessionActive: boolean;
  loadingModel: boolean;
  events: OaiEvent[];
  costState: CostState;
}

const RightSide: React.FC<RightSideProps> = ({ isSessionActive, loadingModel, events, costState }) => {
  const [activeTab, setActiveTab] = useState("events"); // "events" | "session-details"

  let heading;
  if (activeTab === "events") {
    heading = "Event Logs";
  } else if (activeTab === "session-details") {
    heading = "Session Details";
  }

  return (
    <div>
      <div className="sticky top-0 z-10 text-base border-b bg-white p-4 flex items-center justify-between">
        <h3 className="font-semibold">{heading}</h3>
        <select className="border rounded-md p-2" onChange={(e) => setActiveTab(e.target.value)}>
          <option value="events">Event Logs</option>
          <option value="session-details">Session Details</option>
        </select>
      </div>
      {activeTab === "events" && <EventLog events={events} loadingModel={loadingModel} costState={costState} />}
      {activeTab === "session-details" && (
        <SessionDetailsPanel isSessionActive={isSessionActive} loadingModel={loadingModel} />
      )}
    </div>
  );
};

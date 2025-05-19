import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useSession } from "@/contexts/session";
import AudioRecorder from "@/helpers/audio-recorder";
import { getEphemeralKey } from "@/helpers/ephemeral-key";
import { saveSessionRecording } from "@/helpers/save-session-recording";
import { createSession as saveSession, transcribeAudio, updateSession } from "@/services/api";
import { calculateOpenAICosts, CostState, getInitialCostState, updateCumulativeCostOpenAI } from "@/utils/cost-calc";
import { providers, startWebrtcSession, type OaiEvent, type Provider, type SessionConfig } from "@package";
import Chat, { MessageBubbleProps } from "./Chat";
import EventLog from "./EventLog";
import SessionConfigComponent from "./SessionConfig";
import SessionControls from "./SessionControls";

enum Tab {
  SESSION_CONFIG = "session-config",
  MOBILE_CHAT = "mobile-chat",
  EVENTS = "events",
}

const tabs = [
  { label: "Chat", value: Tab.MOBILE_CHAT, mobileOnly: true },
  { label: "Session Config", value: Tab.SESSION_CONFIG },
  { label: "Events", value: Tab.EVENTS },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SESSION_CONFIG);
  const { activeState, setActiveState, config, setConfig, selectedModel, currentSession, setCurrentSession } =
    useSession();

  const [events, setEvents] = useState<OaiEvent[]>([]);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const [messages, setMessages] = useState<Map<string, MessageBubbleProps>>(new Map());

  /** Add state and ref for mute functionality */
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const inputAudioTrackRef = useRef<MediaStreamTrack | null>(null);

  /** response id of message that is currently being streamed */
  const botStreamingTextRef = useRef<string | null>(null);

  // states for cost calculation
  const [costState, setCostState] = useState<CostState>(getInitialCostState());
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // refs for speech recording
  const iAudioRecorderRef = useRef<AudioRecorder | null>(null); // input audio recorder
  const oAudioRecorderRef = useRef<AudioRecorder | null>(null); // output audio recorder
  const sessionAudioRecorderRef = useRef<AudioRecorder | null>(null); // session audio recorder
  const currentUserSpeechItemRef = useRef<{ startTime: number; id: string } | null>(null);
  const currentBotSpeechItemRef = useRef<{ startTime: number; id: string } | null>(null);

  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    if (activeState === "active" && iAudioRecorderRef.current) {
      console.log("starting user speech audio recorder");
      iAudioRecorderRef.current.start();
    }

    if (activeState === "active" && sessionAudioRecorderRef.current) {
      console.log("starting session audio recorder");
      sessionAudioRecorderRef.current.start();
    }

    return () => {
      if (iAudioRecorderRef.current?.getState() === "recording") {
        console.log("stopping user speech audio recorder");
        iAudioRecorderRef.current.stop();
      }

      if (sessionAudioRecorderRef.current?.getState() === "recording") {
        console.log("stopping session audio recorder");
        sessionAudioRecorderRef.current.stop();
      }
    };
  }, [activeState]);

  const handleErrorEvent = (errorMessage: string, eventId: string, fullError: unknown) => {
    if (fullError) {
      console.error("error event:", fullError);
    }

    const id = eventId || crypto.randomUUID();
    setMessages((prev) => {
      const newMessages = new Map(prev);
      newMessages.set(id, {
        role: "assistant",
        text: {
          type: "error",
          content: errorMessage,
          timestamp: new Date().toLocaleTimeString(),
        },
      });
      return newMessages;
    });
  };

  // @ts-expect-error unused function
  const transcribeInputAudio = async (browserAudioUrl: string) => {
    const currentUserSpeechItem = currentUserSpeechItemRef.current;
    if (!currentUserSpeechItem) {
      console.error("error: transcribeInputAudio - currentUserSpeechItem not found");
      return;
    }

    try {
      // get the audio blob from the URL
      const response = await fetch(browserAudioUrl);
      const audioBlob = await response.blob();

      const transcriptionResult = await transcribeAudio(audioBlob);

      // finally the message with both audio URL and transcription
      setMessages((prev) => {
        const newMessages = new Map(prev);
        newMessages.set(currentUserSpeechItem.id, {
          role: "user",
          audio: {
            content: browserAudioUrl,
            timestamp: new Date().toLocaleTimeString(),
          },
          text: {
            content: transcriptionResult.text,
            timestamp: new Date().toLocaleTimeString(),
          },
        });
        return newMessages;
      });
    } catch (error) {
      console.error("Error transcribing audio:", error);

      // if transcription fails, still update with audio URL & a failed transcription msg
      setMessages((prev) => {
        const newMessages = new Map(prev);
        newMessages.set(currentUserSpeechItem.id, {
          role: "user",
          audio: {
            content: browserAudioUrl,
            timestamp: new Date().toLocaleTimeString(),
          },
          text: {
            content: "failed to transcribe audio:(",
            timestamp: new Date().toLocaleTimeString(),
          },
        });
        return newMessages;
      });
    }
  };

  const handleOaiServerEvent = async (pc: RTCPeerConnection, event: OaiEvent) => {
    event.event_id = event.event_id || crypto.randomUUID();
    event.timestamp = event.timestamp || new Date().toLocaleTimeString();
    event.server_sent = true; // to distinguish between server and client events

    setEvents((prev) => [event, ...prev]);

    switch (event.type) {
      case "session.created":
        setActiveState("active");
        setSessionStartTime(Date.now());
        setActiveTab(isMobile ? Tab.MOBILE_CHAT : Tab.EVENTS);

        pc.getSenders().forEach((sender) => {
          if (!sender.track) {
            console.error("error: session.created - No track found");
            return;
          }

          // input track will be muted so we need to unmute it
          sender.track.enabled = true;
        });

        if (event.session) {
          setCurrentSession(event.session);
          saveSession({ config: event.session, provider: selectedModel.provider.name.toLowerCase() }).catch((error) => {
            console.error("error: failed to save session:", error);
          });
        } else {
          console.error("error: session.update - no session found in event payload");
        }
        break;

      case "session.updated":
        if (event.session) {
          setCurrentSession(event.session);
          setConfig({ ...config, ...event.session });
        } else {
          console.error("error: session.update - no session found in event payload");
        }
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

        const interrupted = event.response.status === "cancelled";
        if (interrupted) {
          setMessages((prev) => {
            const newMessages = new Map(prev);
            const currentMessage = prev.get(event.response_id);
            if (!currentMessage) {
              return prev;
            }

            newMessages.set(event.response_id, {
              ...currentMessage,
              interrupted,
            });
            return newMessages;
          });
        }

        if (event.response.status == "failed") {
          handleErrorEvent(event.response.status_details?.error?.message || "server error", event.event_id, event);
        }
        break;

      case "response.audio_transcript.delta":
      case "response.text.delta":
        botStreamingTextRef.current = event.response_id;
        setMessages((prev) => {
          const newMessages = new Map(prev);
          const currentMessage = prev.get(event.response_id) || {
            role: "assistant",
          };
          newMessages.set(event.response_id, {
            ...currentMessage,
            text: {
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

      case "response.function_call_arguments.delta":
        setMessages((prev) => {
          const newMessages = new Map(prev);
          const currentMessage = prev.get(event.response_id) || {
            role: "assistant",
          };

          const currentFunctionCall = currentMessage.function_call || {
            name: event.name || "",
            arguments: "",
            timestamp: new Date().toLocaleTimeString(),
            streaming: true,
          };

          newMessages.set(event.response_id, {
            ...currentMessage,
            function_call: {
              ...currentFunctionCall,
              arguments: currentFunctionCall.arguments + event.delta,
            },
          });
          return newMessages;
        });
        break;

      case "response.function_call_arguments.done":
        setMessages((prev) => {
          const newMessages = new Map(prev);
          const currentMessage = prev.get(event.response_id) || {
            role: "assistant",
          };

          newMessages.set(event.response_id, {
            ...currentMessage,
            function_call: {
              name: event.name,
              arguments: event.arguments,
              timestamp: new Date().toLocaleTimeString(),
              streaming: false,
            },
          });
          return newMessages;
        });
        break;

      case "response.audio_transcript.done":
      case "response.text.done":
        const { transcript, text } = event;
        const content = transcript || text;
        if (!content) {
          console.error(`error: ${event.type} - transcript/text not found (${JSON.stringify(event)}) `);
          break;
        }

        botStreamingTextRef.current = null;
        setMessages((prev) => {
          const newMessages = new Map(prev);
          const currentMessage = prev.get(event.response_id) || {
            role: "assistant",
          };
          newMessages.set(event.response_id, {
            ...currentMessage,
            text: {
              content,
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

        if (currentUserSpeechItemRef.current) {
          /**
           * NOTE:
           * when semantic VAD is on, we receive multiple input_audio_buffer.speech_started event
           * before we receive a final input_audio_buffer.speech_stopped.
           *
           * We obviously receive only the final input_audio_buffer.speech_stopped event,
           * BUT that item_id in speech_stopped event would be the same as the item_id in the last
           * speech_started event.
           *
           * So we need to update the item_id in the speech_started event with the item_id in the
           * speech_stopped event.
           */
          currentUserSpeechItemRef.current.id = event.item_id;
        } else {
          currentUserSpeechItemRef.current = {
            id: event.item_id,
            startTime: Date.now(),
          };
        }
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
            role: "user",
            audio: {
              content: "",
              timestamp: new Date().toLocaleTimeString(),
              processing: true,
            },
          });
          return newMessages;
        });

        const duration = Date.now() - currentUserSpeechItem.startTime + 1000;
        const audio = await iRecorder.stop(duration);

        console.log("starting user input speech recorder again...");
        iRecorder.start();

        if (!audio) {
          console.error("error:input_audio_buffer.speech_stopped - audio url not found");
          break;
        }

        // now update the message with the audio url
        setMessages((prev) => {
          const newMessages = new Map(prev);
          newMessages.set(currentUserSpeechItem.id, {
            role: "user",
            audio: {
              content: audio.url,
              timestamp: new Date().toLocaleTimeString(),
            },
          });
          return newMessages;
        });

        // no need for this anymore since we're getting the transcription event from the server
        // transcribeInputAudio(audio.url);
        break;
      }

      case "output_audio_buffer.started":
        if (!oAudioRecorderRef.current) {
          console.error("error: output_audio_buffer.started - audio recorder not found");
          break;
        }

        if (oAudioRecorderRef.current.getState() === "recording") {
          // this probably means that we received another output_audio_buffer.started event
          // before we received the output_audio_buffer.stopped or output_audio_buffer.cleared event
          console.error("error: output_audio_buffer.started - audio recorder is already recording");
          break;
        }

        oAudioRecorderRef.current.start();
        currentBotSpeechItemRef.current = {
          id: event.response_id,
          startTime: Date.now(),
        };
        break;

      case "conversation.item.input_audio_transcription.completed":
      case "conversation.item.input_audio_transcription.failed":
        if (event.error) {
          console.error("error: conversation.item.input_audio_transcription.failed:", event.error);
        }

        const msgId = event.item_id;
        setMessages((prev) => {
          const newMessages = new Map(prev);
          const currentMessage = prev.get(msgId);
          newMessages.set(msgId, {
            ...currentMessage,
            role: "user",
            text: {
              content: event.transcript || event.error.message || "some error occurred while transcribing audio",
              timestamp: new Date().toLocaleTimeString(),
            },
          });
          return newMessages;
        });
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

          const oRecorder = oAudioRecorderRef.current;
          if (!oRecorder) {
            console.error("error: output_audio_buffer.stopped - audio recorder not found");
            break;
          }

          const audio = await oRecorder.stop();
          if (!audio) {
            console.error("error: output_audio_buffer.stopped - audio url not found");
            break;
          }

          const interrupted = event.type === "output_audio_buffer.cleared";

          setMessages((prev) => {
            const newMessages = new Map(prev);
            const responseId = currentBotSpeechItem.id;

            const audioMsg = {
              content: audio.url,
              timestamp: new Date().toLocaleTimeString(),
            };

            if (responseId && prev.has(responseId)) {
              const currentMessage = prev.get(responseId);
              newMessages.set(responseId, {
                ...currentMessage,
                role: "assistant",
                interrupted,
                audio: audioMsg,
              });
            } else {
              // If we can't find the matching text message, create a new message with just audio
              const newId = crypto.randomUUID();
              newMessages.set(newId, { role: "assistant", audio: audioMsg, interrupted });
            }
            return newMessages;
          });
        }
        break;
    }
  };

  const toggleMute = () => {
    if (inputAudioTrackRef.current) {
      // When isMuted is true, we want to enable the track (unmute)
      // When isMuted is false, we want to disable the track (mute)
      inputAudioTrackRef.current.enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  async function startSession(provider: Provider, config: SessionConfig) {
    try {
      setActiveState("loading");
      setCostState(getInitialCostState());

      iAudioRecorderRef.current?.dispose();
      oAudioRecorderRef.current?.dispose();

      // step 1. get ephemeral key
      const ephemeralKey = await getEphemeralKey(provider, config);
      if (!ephemeralKey) {
        cleanup();
        return;
      }

      // step 2.start the WebRTC session
      const { pc, dc } = await startWebrtcSession(ephemeralKey, selectedModel);

      pcRef.current = pc;
      dcRef.current = dc;

      // Store the input audio track reference for muting
      const senders = pc.getSenders();
      for (const sender of senders) {
        if (sender.track?.kind === "audio") {
          inputAudioTrackRef.current = sender.track;
          inputAudioTrackRef.current.enabled = isMuted;
          break;
        }
      }

      dc.addEventListener("open", () => {
        console.log("data channel opened");

        const tracks: MediaStreamTrack[] = [];

        // initialize audio recorders
        const sender = pc.getSenders()[0];
        if (sender?.track?.kind === "audio") {
          iAudioRecorderRef.current = new AudioRecorder([sender.track]);
          console.log("input audio recorder initialized");
          tracks.push(sender.track);
        } else {
          console.error("error: session.created -  sender audio track not found");
        }

        const receiver = pc.getReceivers()[0];
        if (receiver?.track?.kind === "audio") {
          oAudioRecorderRef.current = new AudioRecorder([receiver.track]);
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

        // reset remaining states
        setMessages(new Map());
        setEvents([]);
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

    if (currentSession && currentSession.id) {
      updateSession(currentSession.id, { status: "completed" }).catch((error) => {
        console.error("error: failed to update session:", error);
      });
    } else {
      console.error("error: session audio recorder stopped but no active session ID");
    }

    // Stop recording if active
    if (iAudioRecorderRef.current?.getState() === "recording") {
      iAudioRecorderRef.current.stop();
    }

    if (oAudioRecorderRef.current?.getState() === "recording") {
      oAudioRecorderRef.current.stop();
    }

    if (sessionAudioRecorderRef.current?.getState() === "recording") {
      const recording = await sessionAudioRecorderRef.current.stop();
      if (!recording) {
        console.error("error: session audio recorder stopped but didn't get audio URL");
      } else {
        setMessages((prev) => {
          const newMessages = new Map(prev);
          const timestamp = new Date().toLocaleTimeString();
          newMessages.set("session_audio", {
            role: "custom:session-recording",
            text: {
              content: "Here's the audio recording of this session.",
              timestamp,
            },
            audio: {
              content: recording.url,
              timestamp,
            },
          });
          return newMessages;
        });

        if (currentSession) {
          saveSessionRecording(currentSession.id, recording);
          toast.info("Session stopped. Storing session recording...");
        } else {
          console.error("error: session audio recorder stopped but no active session ID");
        }
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
    setCurrentSession(null);
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
        role: "user",
        text: {
          content: message,
          timestamp: new Date().toLocaleTimeString(),
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
        <div className="hidden md:block flex-1 h-full min-h-0 rounded-xl bg-white overflow-y-auto">
          <Chat messages={messages} sendTextMessage={sendTextMessage} />
        </div>
        <div className="flex-1 h-full min-h-0 rounded-xl bg-white overflow-y-auto">
          <Tabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMobile={isMobile}
            messages={messages}
            sendTextMessage={sendTextMessage}
            sendClientEvent={sendClientEvent}
            events={events}
            costState={costState}
            sessionStartTime={sessionStartTime}
          />
        </div>
      </div>
      <section className="shrink-0">
        <SessionControls
          startWebrtcSession={startSession}
          stopWebrtcSession={stopSession}
          toggleMute={toggleMute}
          isMuted={isMuted}
        />
      </section>
    </main>
  );
}

interface TabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  sendClientEvent: (event: OaiEvent) => void;
  isMobile: boolean;
  messages: Map<string, MessageBubbleProps>;
  sendTextMessage: (message: string) => void;
  events: OaiEvent[];
  costState: CostState;
  sessionStartTime: number | null;
}

const Tabs: React.FC<TabsProps> = ({
  activeTab,
  setActiveTab,
  sendClientEvent,
  isMobile,
  messages,
  sendTextMessage,
  events,
  costState,
  sessionStartTime,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 px-4 py-4 sticky top-0 bg-white">
        {tabs.map((tab) => {
          if (tab.mobileOnly && !isMobile) {
            return null;
          }

          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`pb-2 px-2 border-b-2 rounded-tl-md rounded-tr-md ${
                activeTab === tab.value ? "border-black" : "border-transparent hover:border-gray-500"
              } flex items-center gap-1`}
            >
              {tab.label}
              {tab.value === Tab.EVENTS && <span>({events.length})</span>}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === Tab.MOBILE_CHAT && isMobile && <Chat messages={messages} sendTextMessage={sendTextMessage} />}
        {activeTab === Tab.SESSION_CONFIG && <SessionConfigComponent sendClientEvent={sendClientEvent} />}
        {activeTab === Tab.EVENTS && (
          <EventLog events={events} costState={costState} sessionStartTime={sessionStartTime} />
        )}
      </div>
    </div>
  );
};

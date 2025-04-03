import Chat, { MessageBubbleProps } from "@/components/Chat";
import SessionControls from "@/components/SessionControls";
import { useSession } from "@/contexts/session";
import AudioRecorder from "@/helpers/audio-recorder";
import { getEphemeralKey } from "@/helpers/ephemeral-key";
import { startWebrtcSession } from "@/helpers/webrtc";
import { OaiEvent } from "@/types";
import { type SessionConfig } from "@src/model-config";
import { providers, type Provider } from "@src/settings";
import { useEffect, useRef, useState } from "react";

const FloatingTalkButton = () => {
    const { activeState, setActiveState, selectedModel } = useSession();
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const dcRef = useRef<RTCDataChannel | null>(null);
    const [messages, setMessages] = useState<Map<string, MessageBubbleProps>>(new Map());
    const [isOpen, setIsOpen] = useState(true);
  
    /** response id of message that is currently being streamed */
    const botStreamingTextRef = useRef<string | null>(null);
  
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
  
    const handleOaiServerEvent = async (pc: RTCPeerConnection, event: OaiEvent) => {
      event.event_id = event.event_id || crypto.randomUUID();
      event.timestamp = event.timestamp || new Date().toLocaleTimeString();
      event.server_sent = true; // to distinguish between server and client events
  
      switch (event.type) {
        case "session.created":
          setActiveState("active");
  
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
          }
  
          if (event.response.status == "failed") {
            handleErrorEvent(event.response.status_details?.error?.message || "server error", event.event_id, event);
          }
          break;
  
        case "response.audio_transcript.delta":
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
  
        case "response.audio_transcript.done":
          botStreamingTextRef.current = null;
          setMessages((prev) => {
            const newMessages = new Map(prev);
            const currentMessage = prev.get(event.response_id) || {
              role: "assistant",
            };
            newMessages.set(event.response_id, {
              ...currentMessage,
              text: {
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
              role: "user",
              audio: {
                content: audioUrl,
                timestamp: new Date().toLocaleTimeString(),
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
  
            const audioUrl = await oRecorder.stop();
            if (!audioUrl) {
              console.error("error: output_audio_buffer.stopped - audio url not found");
              break;
            }
  
            const interrupted = event.type === "output_audio_buffer.cleared";
  
            setMessages((prev) => {
              const newMessages = new Map(prev);
              const responseId = currentBotSpeechItem.id;
  
              const audio = {
                content: audioUrl,
                timestamp: new Date().toLocaleTimeString(),
              };
  
              if (responseId && prev.has(responseId)) {
                const currentMessage = prev.get(responseId);
                newMessages.set(responseId, {
                  ...currentMessage,
                  role: "assistant",
                  interrupted,
                  audio,
                });
              } else {
                // If we can't find the matching text message, create a new message with just audio
                const newId = crypto.randomUUID();
                newMessages.set(newId, { role: "assistant", audio, interrupted });
              }
              return newMessages;
            });
          }
          break;
      }
    };
  
    async function startSession(provider: Provider, config: SessionConfig) {
      try {
        setActiveState("loading");
  
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
      // Stop recording if active
      if (iAudioRecorderRef.current?.getState() === "recording") {
        iAudioRecorderRef.current.stop();
      }
  
      if (oAudioRecorderRef.current?.getState() === "recording") {
        oAudioRecorderRef.current.stop();
      }
  
      if (sessionAudioRecorderRef.current?.getState() === "recording") {
        const audioUrl = await sessionAudioRecorderRef.current.stop();
        if (!audioUrl) {
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
                content: audioUrl,
                timestamp,
              },
            });
            return newMessages;
          });
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
      iAudioRecorderRef.current = null;
      oAudioRecorderRef.current = null; // Clean up bot audio recorder
      currentUserSpeechItemRef.current = null;
      currentBotSpeechItemRef.current = null; // Clean up bot speech reference
  
      botStreamingTextRef.current = null;
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
      <>
        {isOpen ? (
          <div className="fixed bottom-4 right-4 z-50 w-96 h-[600px] bg-white rounded-xl shadow-lg overflow-hidden flex flex-col border border-gray-200">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Voice Chat</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  <Chat messages={messages} sendTextMessage={sendTextMessage} />
                </div>
              </div>
            </div>
            <div className="shrink-0 border-t">
              <SessionControls startWebrtcSession={startSession} stopWebrtcSession={stopSession} />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors border-2 border-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}
      </>
    );
  }

export default FloatingTalkButton;

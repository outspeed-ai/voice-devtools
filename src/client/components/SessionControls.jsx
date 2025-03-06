import { useState } from "react";
import { CloudLightning, CloudOff, MessageSquare } from "react-feather";

import { API_PROVIDERS } from "@/config/session";
import { CONNECTION_TYPES } from "@/constants";
import { useApi } from "@/contexts/ApiContext";
import AudioRecorder from "./AudioRecorder";
import Button from "./Button";

function SessionStopped({ startWebrtcSession, startWebsocketSession }) {
  const { selectedProvider, setSelectedProvider } = useApi();
  const [activatingSession, setActivatingSession] = useState(null);

  async function handleStartWebrtcSession() {
    if (activatingSession) {
      return;
    }

    setActivatingSession("webrtc");
    try {
      await startWebrtcSession();
    } finally {
      setActivatingSession(null);
    }
  }

  async function handleStartWebsocketSession() {
    if (activatingSession) {
      return;
    }

    setActivatingSession("websocket");
    try {
      await startWebsocketSession();
    } finally {
      setActivatingSession(null);
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center gap-8">
      <div className="flex items-center gap-3 justify-center mb-2">
        <span className="text-gray-700">Select API Provider:</span>
        <select
          value={selectedProvider.url}
          onChange={(e) =>
            setSelectedProvider(
              Object.values(API_PROVIDERS).find(
                (p) => p.url === e.target.value,
              ),
            )
          }
          className="px-3 py-2 rounded-md border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {Object.values(API_PROVIDERS).map((provider) => (
            <option key={provider.url} value={provider.url}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-center gap-4">
        {activatingSession !== "websocket" && (
          <Button
            onClick={handleStartWebrtcSession}
            className={`hover:opacity-90 transition-opacity`}
            icon={<CloudLightning height={16} />}
            disabled={activatingSession}
          >
            {activatingSession
              ? "starting WebRTC session..."
              : "start WebRTC Session"}
          </Button>
        )}
        {/* only WebRTC for now */}
        {/* {activatingSession !== "webrtc" && (
          <Button
            onClick={handleStartWebsocketSession}
            className={`${
              activatingSession ? "bg-gray-600" : "bg-blue-600"
            } hover:opacity-90 transition-opacity`}
            icon={<MessageSquare height={16} />}
            disabled={activatingSession}
          >
            {activatingSession
              ? "Starting WebSocket session..."
              : "Start WebSocket Session"}
          </Button>
        )} */}
      </div>
    </div>
  );
}

function SessionActive({
  connectionType,
  sendTextMessage,
  sendClientEvent,
  stopSession,
}) {
  const [message, setMessage] = useState("");

  function handleSendClientEvent() {
    if (!message.trim()) return;
    sendTextMessage(message);
    setMessage("");
  }

  const stopCurrentSession = () => {
    if (connectionType === CONNECTION_TYPES.WEBRTC) {
      stopSession.stopWebrtcSession();
    } else if (connectionType === CONNECTION_TYPES.WEBSOCKET) {
      stopSession.stopWebsocketSession();
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full gap-4">
      <input
        onKeyDown={(e) => {
          if (e.key === "Enter" && message.trim()) {
            handleSendClientEvent();
          }
        }}
        autoFocus
        type="text"
        placeholder="send a text message..."
        className="border border-gray-200 rounded-full p-4 flex-1"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button
        onClick={handleSendClientEvent}
        icon={<MessageSquare height={16} />}
        className="bg-blue-400"
      >
        send text
      </Button>
      {connectionType === CONNECTION_TYPES.WEBSOCKET && (
        <AudioRecorder
          sendClientEvent={sendClientEvent}
          isSessionActive={true}
        />
      )}
      <Button
        onClick={stopCurrentSession}
        icon={<CloudOff height={16} />}
        className="bg-red-600"
      >
        disconnect
      </Button>
    </div>
  );
}

export default function SessionControls({
  startWebrtcSession,
  stopWebrtcSession,
  startWebsocketSession,
  stopWebsocketSession,
  sendClientEvent,
  sendTextMessage,
  events,
  isSessionActive,
  connectionType,
  loadingModal = false,
}) {
  return (
    <div className="flex">
      {loadingModal && (
        <p className="text-gray-500 w-full flex justify-center items-center h-full text-center">
          loading modal to GPU. please wait a moment...
        </p>
      )}
      {!loadingModal && isSessionActive && (
        <SessionActive
          connectionType={connectionType}
          stopSession={{ stopWebrtcSession, stopWebsocketSession }}
          sendClientEvent={sendClientEvent}
          sendTextMessage={sendTextMessage}
          events={events}
        />
      )}
      {!loadingModal && !isSessionActive && (
        <SessionStopped
          startWebrtcSession={startWebrtcSession}
          startWebsocketSession={startWebsocketSession}
        />
      )}
    </div>
  );
}

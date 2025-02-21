import { useState } from "react";
import { CloudLightning, CloudOff, MessageSquare } from "react-feather";
import Button from "./Button";
import AudioRecorder from "./AudioRecorder";
import { CONNECTION_TYPES } from "../constants";

function SessionStopped({ startWebrtcSession, startWebsocketSession }) {
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
    <div className="flex items-center justify-center w-full h-full gap-4">
      {activatingSession !== "websocket" && (
        <Button
          onClick={handleStartWebrtcSession}
          className={activatingSession ? "bg-gray-600" : "bg-red-600"}
          icon={<CloudLightning height={16} />}
          disabled={activatingSession}
        >
          {activatingSession ? "starting webrtc session..." : "webrtc session"}
        </Button>
      )}

      {activatingSession !== "webrtc" && (
        <Button
          onClick={handleStartWebsocketSession}
          className={activatingSession ? "bg-gray-600" : "bg-blue-600"}
          icon={<MessageSquare height={16} />}
          disabled={activatingSession}
        >
          {activatingSession
            ? "starting websocket session..."
            : "websocket session"}
        </Button>
      )}
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
        className={
          connectionType === CONNECTION_TYPES.WEBRTC
            ? "bg-red-600"
            : "bg-blue-600"
        }
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
}) {
  return (
    <div className="flex gap-4 border-t-2 border-gray-200 h-full rounded-md">
      {isSessionActive ? (
        <SessionActive
          connectionType={connectionType}
          stopSession={{ stopWebrtcSession, stopWebsocketSession }}
          sendClientEvent={sendClientEvent}
          sendTextMessage={sendTextMessage}
          events={events}
        />
      ) : (
        <SessionStopped
          startWebrtcSession={startWebrtcSession}
          startWebsocketSession={startWebsocketSession}
        />
      )}
    </div>
  );
}

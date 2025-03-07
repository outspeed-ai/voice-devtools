import { useState } from "react";
import { CloudLightning, CloudOff } from "react-feather";

import { API_PROVIDERS } from "@/config/session";
import { useApi } from "@/contexts/ApiContext";
import Button from "./Button";

function SessionStopped({ startWebrtcSession }) {
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
      </div>
    </div>
  );
}

function SessionActive({ stopSession }) {
  const stopCurrentSession = () => {
    stopSession.stopWebrtcSession();
  };

  return (
    <div className="flex items-center justify-center w-full h-full gap-4">
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
  sendClientEvent,
  sendTextMessage,
  events,
  isSessionActive,
  loadingModal = false,
}) {
  return (
    <div className="flex">
      {loadingModal && (
        <p className="text-gray-500 w-full flex justify-center items-center h-full text-center">
          loading model to GPU. please wait a moment...
        </p>
      )}
      {!loadingModal && isSessionActive && (
        <SessionActive stopSession={{ stopWebrtcSession }} events={events} />
      )}
      {!loadingModal && !isSessionActive && (
        <SessionStopped startWebrtcSession={startWebrtcSession} />
      )}
    </div>
  );
}

import { useState } from "react";
import { CloudLightning, CloudOff } from "react-feather";

import { env } from "@/config/env";
import { useModel } from "@/contexts/model";
import { models, providers } from "@src/settings";
import Button from "./ui/Button";

interface SessionStoppedProps {
  startWebrtcSession: () => Promise<void>;
}

const SessionStopped: React.FC<SessionStoppedProps> = ({ startWebrtcSession }) => {
  const { selectedModel, setSelectedModel } = useModel();
  const [activatingSession, setActivatingSession] = useState<string | null>(null); // webrtc or websocket or null for idle state

  async function handleStartWebrtcSession() {
    if (activatingSession) {
      return;
    }

    setActivatingSession("webrtc");
    try {
      await startWebrtcSession();
    } catch (error) {
      console.error("error starting webrtc session", error);
    } finally {
      setActivatingSession(null);
    }
  }

  const availableModels = Object.values(models).filter((model) =>
    env.OUTSPEED_HOSTED ? model.provider === providers.Outspeed : true,
  );

  return (
    <div className="w-full h-full flex items-center justify-center gap-8">
      <fieldset disabled={!!activatingSession} className="flex items-center gap-4 justify-center">
        <span className="text-gray-700">Select Model:</span>
        <select
          value={selectedModel.sessionConfig.model}
          onChange={(e) => setSelectedModel(models[e.target.value as keyof typeof models])}
          className="px-3 py-2 rounded-md border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {Object.values(availableModels).map(({ label, provider, sessionConfig: { model } }) => (
            <option key={model} value={model}>
              {label} ({provider.name})
            </option>
          ))}
        </select>

        <Button onClick={handleStartWebrtcSession} icon={<CloudLightning height={16} />}>
          {activatingSession ? "Connecting..." : "Connect"}
        </Button>
      </fieldset>
    </div>
  );
};

interface SessionActiveProps {
  stopSession: {
    stopWebrtcSession: () => void;
  };
  events: any[];
}

const SessionActive: React.FC<SessionActiveProps> = ({ stopSession }) => {
  const stopCurrentSession = () => {
    stopSession.stopWebrtcSession();
  };

  return (
    <div className="flex items-center justify-center w-full h-full gap-4">
      <Button onClick={stopCurrentSession} icon={<CloudOff height={16} />} className="bg-red-600">
        disconnect
      </Button>
    </div>
  );
};

interface SessionControlsProps {
  startWebrtcSession: () => Promise<void>;
  stopWebrtcSession: () => void;
  events: any[];
  isSessionActive: boolean;
  loadingModel: boolean;
}

const SessionControls: React.FC<SessionControlsProps> = ({
  startWebrtcSession,
  stopWebrtcSession,
  events,
  isSessionActive,
  loadingModel = false,
}) => {
  return (
    <div className="flex">
      {loadingModel && (
        <p className="text-gray-500 w-full flex justify-center items-center h-full text-center">
          loading model to GPU. please wait a moment...
        </p>
      )}
      {!loadingModel && isSessionActive && <SessionActive stopSession={{ stopWebrtcSession }} events={events} />}
      {!loadingModel && !isSessionActive && <SessionStopped startWebrtcSession={startWebrtcSession} />}
    </div>
  );
};

export default SessionControls;

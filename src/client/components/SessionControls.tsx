import { useState } from "react";
import { ChevronRight, CloudOff } from "react-feather";

import { env } from "@/config/env";
import { useSession } from "@/contexts/session";
import { type SessionConfig } from "@src/model-config";
import { models, Provider, providers } from "@src/settings";
import { toast } from "sonner";
import Button from "./ui/Button";

interface SessionStoppedProps {
  startWebrtcSession: (provider: Provider, config: SessionConfig) => Promise<void>;
}

const ConfigurationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: SessionConfig) => void;
  availableVoices: string[];
}> = ({ isOpen, onClose, onConnect, availableVoices }) => {
  const { config, setConfig } = useSession();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Session Configuration</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="text-sm text-gray-500">{config.temperature}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Voice</label>
            <select
              value={config.voice}
              onChange={(e) => setConfig({ ...config, voice: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableVoices.map((voice) => (
                <option key={voice} value={voice}>
                  {voice.charAt(0).toUpperCase() + voice.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea
              value={config.instructions}
              onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={6}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={() => onConnect(config)}>Connect</Button>
        </div>
      </div>
    </div>
  );
};

const SessionStopped: React.FC<SessionStoppedProps> = ({ startWebrtcSession }) => {
  const { selectedModel, setSelectedModel, availableAgents, selectedAgent, setSelectedAgent } = useSession();
  const [activatingSession, setActivatingSession] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  async function handleStartWebrtcSession() {
    if (activatingSession) {
      return;
    }
    setShowConfigModal(true);
  }

  async function handleConnect(config: SessionConfig) {
    try {
      const trimmedInstructions = config.instructions.trim();
      if (!trimmedInstructions) {
        toast.error("Instructions cannot be empty");
        return;
      }

      setActivatingSession("webrtc");
      await startWebrtcSession(selectedModel.provider, { ...config, instructions: trimmedInstructions });
      setActivatingSession(null);
      setShowConfigModal(false);
    } catch (error) {
      console.error("error starting webrtc session", error);
      setActivatingSession(null);
      setShowConfigModal(false);
    }
  }

  const availableModels = Object.values(models).filter((model) =>
    env.OUTSPEED_HOSTED ? model.provider === providers.Outspeed : true,
  );

  return (
    <div className="w-full h-full flex items-center justify-center gap-8">
      <fieldset disabled={!!activatingSession} className="flex items-center gap-4 justify-center">
        <span className="text-gray-700">Model:</span>
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

        <span className="text-gray-700">Agent:</span>
        <select
          value={selectedAgent.id}
          onChange={(e) => {
            const agentKey = e.target.value as keyof typeof availableAgents;
            setSelectedAgent(availableAgents[agentKey]);
          }}
          className="px-3 py-2 rounded-md border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {Object.entries(availableAgents).map(([key, agent]) => (
            <option key={key} value={key}>
              {agent.name}
            </option>
          ))}
        </select>

        <Button onClick={handleStartWebrtcSession} icon={<ChevronRight height={16} width={16} />}>
          {activatingSession ? "Connecting..." : "Next"}
        </Button>
      </fieldset>

      <ConfigurationModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onConnect={handleConnect}
        availableVoices={selectedModel.voices}
      />
    </div>
  );
};

interface SessionActiveProps {
  stopSession: {
    stopWebrtcSession: () => void;
  };
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
  startWebrtcSession: (provider: Provider, config: SessionConfig) => Promise<void>;
  stopWebrtcSession: () => void;
  isSessionActive: boolean;
  loadingModel: boolean;
}

const SessionControls: React.FC<SessionControlsProps> = ({
  startWebrtcSession,
  stopWebrtcSession,
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
      {!loadingModel && isSessionActive && <SessionActive stopSession={{ stopWebrtcSession }} />}
      {!loadingModel && !isSessionActive && <SessionStopped startWebrtcSession={startWebrtcSession} />}
    </div>
  );
};

export default SessionControls;

import { useSession } from "@/contexts/session";
import { OaiEvent, providers } from "@package";
import { type Agent } from "@src/agent-config";

interface SessionConfigProps {
  sendClientEvent: (event: OaiEvent) => void;
}

const SessionConfig: React.FC<SessionConfigProps> = ({ sendClientEvent }) => {
  // const SessionConfig: React.FC<SessionConfigProps> = () => {
  const {
    activeState,
    config,
    setConfig,
    selectedModel,
    setSelectedModel,
    availableModels,
    selectedAgent,
    setSelectedAgent,
    availableAgents,
  } = useSession();

  // coming soon (really soon)
  const changeTurnDetectonType = (type: "server_vad" | "semantic_vad") => {
    if (activeState === "loading") {
      return;
    }

    if (activeState === "active") {
      // when the session is active, we need to send a client event to the server
      sendClientEvent({
        type: "session.update",
        session: {
          turn_detection: { type },
        },
      });
    } else {
      // when the session is inactive, we can update the config directly in frontend
      setConfig({ ...config, turn_detection: { type } });
    }
  };

  const changeVoiceSpeed = (speed: number) => {
    if (activeState === "loading") {
      return;
    }

    if (activeState === "active") {
      // when the session is active, we need to send a client event to the server
      sendClientEvent({
        type: "session.update",
        session: {
          output_audio_speed: speed,
        },
      });
    } else {
      // when the session is inactive, we can update the config directly in frontend
      setConfig({ ...config, output_audio_speed: speed });
    }
  };

  const isInactive = activeState === "inactive";

  return (
    <section className="h-full w-full flex flex-col bg-white rounded-md p-4 overflow-y-auto">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <label htmlFor="model">Model:</label>
          <select
            id="model"
            value={selectedModel.sessionConfig.model}
            onChange={(e) => {
              const model = availableModels[e.target.value as keyof typeof availableModels];
              if (model) setSelectedModel(model);
            }}
            className="border p-2 rounded-md"
            disabled={!isInactive}
          >
            {Object.entries(availableModels).map(([key, model]) => (
              <option key={key} value={key}>
                {model.label} ({model.provider.name})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="agent">Agent:</label>
          <select
            id="agent"
            value={selectedAgent.id}
            onChange={(e) => {
              const agent = Object.values(availableAgents).find((a: Agent) => a.id === e.target.value);
              if (agent) setSelectedAgent(agent);
            }}
            className="border p-2 rounded-md"
            disabled={!isInactive}
          >
            {Object.values(availableAgents).map((agent: Agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        {selectedModel.provider === providers.Outspeed && (
          <div className="flex flex-col gap-1">
            <label htmlFor="first_message">First message:</label>
            <textarea
              id="first_message"
              value={(config as any).first_message || ""}
              onChange={(e) => setConfig({ ...config, first_message: e.target.value } as any)}
              className="border p-2 rounded-md resize-none"
              rows={1}
              placeholder="Optional message for the AI to say first when the session starts"
              disabled={!isInactive}
            />
          </div>
        )}

        {config.tools && config.tools.length > 0 && (
          <div className="flex flex-col gap-1">
            <label>Tools:</label>
            <div className="flex flex-wrap gap-2">
              {config.tools.map((tool) => (
                <span key={tool.name} className="border border-teal-600 text-teal-700 px-2 py-1 rounded-full text-sm">
                  {tool.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {config.modalities.includes("audio") && (
          <div className="flex flex-col gap-1">
            <label htmlFor="voice">Voice:</label>
            <select
              id="voice"
              value={config.voice}
              onChange={(e) => setConfig({ ...config, voice: e.target.value as any })}
              className="border p-2 rounded-md"
              disabled={!isInactive}
            >
              {selectedModel.voices.map((voice) => (
                <option key={voice} value={voice}>
                  {voice.charAt(0).toUpperCase() + voice.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        {config.modalities.includes("audio") && selectedModel.provider === providers.Outspeed && (
          <div className="flex flex-col gap-1">
            <label htmlFor="voice_speed">Voice Speed: {(config.output_audio_speed || 1.0).toFixed(2)}x</label>
            <input
              type="range"
              id="voice_speed"
              min="0.85"
              max="1.40"
              step="0.05"
              value={config.output_audio_speed || 1.0}
              onChange={(e) => changeVoiceSpeed(parseFloat(e.target.value))}
              className="w-full"
              disabled={activeState === "loading"}
            />
            <div className="relative flex text-xs text-gray-500">
              <span className="absolute left-0">0.85x (Slower)</span>
              <span className="absolute left-[27.3%] transform -translate-x-1/2">1.0x (Normal)</span>
              <span className="absolute right-0">1.40x (Faster)</span>
            </div>
          </div>
        )}

        {config.modalities.includes("audio") && (
          <div className="flex flex-col gap-1">
            <label htmlFor="transcription_model">Input Transcription Model:</label>
            <select
              id="transcription_model"
              value={config.input_audio_transcription?.model || "none"}
              onChange={(e) => {
                const value = e.target.value;
                setConfig({
                  ...config,
                  input_audio_transcription: value === "none" ? null : { model: value as any },
                });
              }}
              className="border p-2 rounded-md"
              disabled={!isInactive}
            >
              <option value="none">None</option>
              {selectedModel.transcriptionModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* coming really soon */}
        <div className="flex flex-col gap-1">
          <label htmlFor="turn_detection">Turn Detection:</label>
          <select
            id="turn_detection"
            value={config.turn_detection.type}
            onChange={(e) => changeTurnDetectonType(e.target.value as "server_vad" | "semantic_vad")}
            className="border p-2 rounded-md"
            disabled={activeState === "loading"}
          >
            <option value="server_vad">Server VAD</option>
            <option value="semantic_vad">Semantic VAD (beta)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="instructions">Instructions:</label>
          <textarea
            id="instructions"
            value={config.instructions}
            onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
            className="border p-2 rounded-md resize-none"
            rows={10}
            disabled={!isInactive}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="temperature">Temperature: {config.temperature.toFixed(1)}</label>
          <input
            type="range"
            id="temperature"
            min="0"
            max="1"
            step="0.1"
            value={config.temperature}
            onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
            className="w-full"
            disabled={!isInactive}
          />
        </div>
      </div>
    </section>
  );
};

export default SessionConfig;

import { useSession } from "@/contexts/session";
import { type Agent } from "@src/agent-config";
import { models } from "@src/settings";

const SessionConfig: React.FC = () => {
  const {
    activeState,
    config,
    setConfig,
    selectedModel,
    setSelectedModel,
    selectedAgent,
    setSelectedAgent,
    availableAgents,
  } = useSession();

  const isInactive = activeState === "inactive";

  return (
    <section className="h-full w-full flex flex-col">
      <div className="h-full bg-white rounded-md p-4 overflow-y-auto">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <label htmlFor="model">Model:</label>
            <select
              id="model"
              value={selectedModel.sessionConfig.model}
              onChange={(e) => {
                const model = models[e.target.value as keyof typeof models];
                if (model) setSelectedModel(model);
              }}
              className="border p-2 rounded-md"
              disabled={!isInactive}
            >
              {Object.entries(models).map(([key, model]) => (
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

          {config.modalities.includes("audio") && (
            <div className="flex flex-col gap-1">
              <label htmlFor="voice">Voice:</label>
              <select
                id="voice"
                value={config.voice}
                onChange={(e) => setConfig({ ...config, voice: e.target.value })}
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

          {/* <div className="flex flex-col gap-1">
            <label>Modalities (read-only):</label>
            <div className="flex gap-4">
              {Array.from(config.modalities).map((modality) => (
                <div key={modality} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked
                    onChange={() => {}} // Modalities are currently fixed
                    readOnly
                  />
                  <label>{modality}</label>
                </div>
              ))}
            </div>
          </div> */}

          {/* <div className="flex flex-col gap-1">
            <label htmlFor="provider">Provider:</label>
            <input
              id="provider"
              readOnly
              value={selectedModel.provider.name}
              className="border p-2 rounded-md bg-gray-100"
            />
          </div> */}
        </div>
      </div>
    </section>
  );
};

export default SessionConfig;

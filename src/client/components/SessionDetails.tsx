import { useSession } from "@/contexts/session";

interface SessionDetailsPanelProps {
  isSessionActive: boolean;
  loadingModel: boolean;
}

const SessionDetailsPanel: React.FC<SessionDetailsPanelProps> = ({ isSessionActive, loadingModel }) => {
  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-white rounded-md p-4">
        {isSessionActive && !loadingModel ? (
          <>
            <SessionDetails />
          </>
        ) : (
          <p>start the session to see details</p>
        )}
      </div>
    </section>
  );
};

export default SessionDetailsPanel;

function SessionDetails() {
  const { config, selectedModel, selectedAgent } = useSession();

  return (
    <div className="flex flex-col gap-6">
      <p>session is active</p>

      <div className="flex flex-col gap-1">
        <label htmlFor="model">model:</label>
        <input readOnly value={config.model} className="border p-2" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="agent">agent:</label>
        <input readOnly value={selectedAgent.name} className="border p-2" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="instructions">instructions:</label>
        <textarea readOnly value={config.instructions} className="border p-2" rows={7} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="temperature">temperature: {config.temperature.toFixed(1)}</label>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="modalities">modalities:</label>
        <div className="flex flex-col gap-2">
          {Array.from(config.modalities).map((modality) => (
            <label key={modality} className="flex items-center gap-2">
              <input readOnly type="checkbox" checked={config.modalities.includes(modality)} />
              {modality}
            </label>
          ))}
        </div>
      </div>
      {config.modalities.includes("audio") && (
        <div className="flex flex-col gap-1">
          <label htmlFor="voice">voice:</label>
          <input readOnly value={config.voice} className="border p-2" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="provider">provider:</label>
        <input readOnly value={selectedModel.provider.name} className="border p-2" />
      </div>
    </div>
  );
}

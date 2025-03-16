import { useModel } from "@/contexts/model";
import { agent } from "@src/agentConfig";

export default function SessionDetailsPanel({ isSessionActive, loadingModel, sendClientEvent }) {
  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">session details</h2>
        {isSessionActive && !loadingModel ? (
          <>
            <SessionDetails sendClientEvent={sendClientEvent} />
          </>
        ) : (
          <p>start the session to see details</p>
        )}
      </div>
    </section>
  );
}

function SessionDetails() {
  const {
    selectedModel: { sessionConfig },
  } = useModel();

  let concatSessionConfig = {
    ...sessionConfig,
    ...agent
  }

  return (
    <div className="flex flex-col gap-6">
      <p>session is active</p>

      <div className="flex flex-col gap-1">
        <label htmlFor="model">model</label>
        <input readOnly value={concatSessionConfig.model} className="border p-2" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="instructions">instructions</label>
        <textarea readOnly value={concatSessionConfig.instructions} className="border p-2" rows={7} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="temperature">temperature: {concatSessionConfig.temperature.toFixed(1)}</label>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="modalities">modalities</label>
        <div className="flex flex-col gap-2">
          {Array.from(concatSessionConfig.modalities).map((modality) => (
            <label key={modality} className="flex items-center gap-2">
              <input type="checkbox" checked={concatSessionConfig.modalities.includes(modality)} />
              {modality}
            </label>
          ))}
        </div>
      </div>
      {concatSessionConfig.modalities.includes("audio") && (
        <div className="flex flex-col gap-1">
          <label htmlFor="voice">voice</label>
          <input readOnly value={concatSessionConfig.voice} className="border p-2" />
        </div>
      )}
    </div>
  );
}

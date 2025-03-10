import { useModel } from "@/contexts/model";

const functionDescription = `
Call this function when a user asks for a color palette.
`;

const sessionUpdate = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: "display_color_palette",
        description: functionDescription,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            theme: {
              type: "string",
              description: "Description of the theme for the color scheme.",
            },
            colors: {
              type: "array",
              description: "Array of five hex color codes based on the theme.",
              items: {
                type: "string",
                description: "Hex color code",
              },
            },
          },
          required: ["theme", "colors"],
        },
      },
    ],
    tool_choice: "auto",
  },
};

function FunctionCallOutput({ functionCallOutput }) {
  const { theme, colors } = JSON.parse(functionCallOutput.arguments);

  const colorBoxes = colors.map((color) => (
    <div
      key={color}
      className="w-full h-16 rounded-md flex items-center justify-center border border-gray-200"
      style={{ backgroundColor: color }}
    >
      <p className="text-sm font-bold text-black bg-slate-100 rounded-md p-2 border border-black">
        {color}
      </p>
    </div>
  ));

  return (
    <div className="flex flex-col gap-2">
      <p>Theme: {theme}</p>
      {colorBoxes}
      <pre className="text-xs bg-gray-100 rounded-md p-2 overflow-x-auto">
        {JSON.stringify(functionCallOutput, null, 2)}
      </pre>
    </div>
  );
}

export default function SessionDetailsPanel({
  isSessionActive,
  loadingModal,
  sendClientEvent,
}) {
  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">session details</h2>
        {isSessionActive && !loadingModal ? (
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

function SessionDetails({ sendClientEvent }) {
  const {
    selectedModel: { sessionConfig },
  } = useModel();

  return (
    <div className="flex flex-col gap-6">
      <p>session is active</p>

      <div className="flex flex-col gap-1">
        <label htmlFor="model">model</label>
        <input readOnly value={sessionConfig.model} className="border p-2" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="instructions">instructions</label>
        <textarea
          readOnly
          value={sessionConfig.instructions}
          className="border p-2"
          rows={7}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="temperature">
          temperature: {sessionConfig.temperature.toFixed(1)}
        </label>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="modalities">modalities</label>
        <div className="flex flex-col gap-2">
          {Array.from(sessionConfig.modalities).map((modality) => (
            <label key={modality} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sessionConfig.modalities.includes(modality)}
              />
              {modality}
            </label>
          ))}
        </div>
      </div>
      {sessionConfig.modalities.includes("audio") && (
        <div className="flex flex-col gap-1">
          <label htmlFor="voice">voice</label>
          <input readOnly value={sessionConfig.voice} className="border p-2" />
        </div>
      )}
    </div>
  );
}

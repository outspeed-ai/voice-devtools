import { useEffect, useState } from "react";
import { Check } from "react-feather";

import Button from "./Button";

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

export default function SessionControlPanel({
  isSessionActive,
  sendClientEvent,
}) {
  useEffect(() => {}, []);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">session control panel</h2>
        {isSessionActive ? (
          <SessionControls sendClientEvent={sendClientEvent} />
        ) : (
          <p>start the session to use this tool</p>
        )}
      </div>
    </section>
  );
}

const MODELS = Object.freeze({
  MINI_CPM_O_2_6: "MiniCPM-o-2_6",
});

const MODEL_OPTIONS = Object.values(MODELS).map((model) => ({
  label: model,
  value: model,
}));

const Modality = Object.freeze({
  TEXT: "text",
  AUDIO: "audio",
});

const MODALITIES = new Set([Modality.TEXT, Modality.AUDIO]);

const voices = [
  {
    label: "female",
    value: "female_eng",
  },
  {
    label: "male",
    value: "male_eng",
  },
];

function SessionControls({ sendClientEvent }) {
  const [model, setModel] = useState(MODELS.MINI_CPM_O_2_6);
  const [temperature, setTemperature] = useState(0.5);
  const [modalities, setModalities] = useState(MODALITIES);
  const [voice, setVoice] = useState(voices[0]);

  const handleModalitiesChange = (modality) => {
    const newModalities = new Set(modalities);
    if (newModalities.has(modality)) {
      newModalities.delete(modality);
    } else {
      newModalities.add(modality);
    }
    setModalities(newModalities);
  };

  const handleUpdateSession = () => {
    alert("biraj will implement this soon!!!");
    // sendClientEvent(sessionUpdate);
  };

  return (
    <div className="flex flex-col gap-6">
      <p>session is active</p>

      <div className="flex flex-col gap-1">
        <label htmlFor="model">model</label>
        <select
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="border p-2 rounded-md"
        >
          {MODEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="temperature">
          temperature ({temperature.toFixed(1)})
        </label>
        <input
          id="temperature"
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          className="border p-2 rounded-md"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="modalities">modalities</label>
        <div className="flex flex-col gap-2">
          {Array.from(MODALITIES).map((modality) => (
            <label key={modality} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={modalities.has(modality)}
                onChange={() => handleModalitiesChange(modality)}
              />
              {modality}
            </label>
          ))}
        </div>
      </div>
      {modalities.has(Modality.AUDIO) && (
        <div className="flex flex-col gap-1">
          <label htmlFor="voice">voice</label>
          <select
            id="voice"
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="border p-2 rounded-md"
          >
            {voices.map((voice) => (
              <option key={voice.value} value={voice.value}>
                {voice.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <Button
        onClick={() => sendClientEvent(sessionUpdate)}
        icon={<Check height={16} />}
        className="justify-center"
      >
        update session
      </Button>
    </div>
  );
}

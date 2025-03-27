import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { env } from "@/config/env";
import type { Agent } from "@src/agent-config";
import * as agents from "@src/agent-config";
import { type SessionConfig } from "@src/model-config";
import { models, providers, type Model } from "@src/settings";

interface SessionContextType {
  activeState: "inactive" | "loading" | "active";
  setActiveState: (state: "inactive" | "loading" | "active") => void;

  durationRef: React.RefObject<number>;

  availableModels: typeof models;
  selectedModel: Model;
  setSelectedModel: (model: Model) => void;

  availableAgents: typeof agents;
  selectedAgent: Agent;
  setSelectedAgent: (agent: Agent) => void;

  config: SessionConfig;
  setConfig: (config: SessionConfig) => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

interface SessionProviderProps {
  children: React.ReactNode;
}

const getAvailableModels = () => {
  const availableModels = { ...models };
  for (const model in availableModels) {
    const key = model as keyof typeof availableModels;
    if (env.OUTSPEED_HOSTED && availableModels[key].provider !== providers.Outspeed) {
      delete availableModels[key];
    }
  }

  return availableModels;
};

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [activeState, setActiveState] = useState<"inactive" | "loading" | "active">("inactive");
  const [selectedModel, setSelectedModel] = useState<Model>(models["MiniCPM-o-2_6"]);
  const [selectedAgent, setSelectedAgent] = useState<Agent>(agents.dentalAgent);
  const durationRef = useRef(0);

  // initial state is the combined config of the selected model and instructions from the selected agent
  const [config, setConfig] = useState<SessionConfig>({
    ...selectedModel.sessionConfig,
    instructions: selectedAgent.instructions,
  });

  // update the config when the selected model changes
  useEffect(() => {
    setConfig((prev) => ({ ...prev, ...selectedModel.sessionConfig, instructions: prev.instructions }));
  }, [selectedModel]);

  // update the config when the selected agent changes
  useEffect(() => {
    setConfig((prev) => ({ ...prev, instructions: selectedAgent.instructions }));
  }, [selectedAgent]);

  const availableModels = useMemo(getAvailableModels, [env.OUTSPEED_HOSTED]);

  return (
    <SessionContext.Provider
      value={{
        activeState,
        setActiveState,

        durationRef,

        availableModels: availableModels,
        selectedModel,
        setSelectedModel,

        availableAgents: agents,
        selectedAgent,
        setSelectedAgent,

        config,
        setConfig,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useModel() hook must be used within a ModelProvider");
  }
  return context;
}

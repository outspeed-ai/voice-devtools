import { createContext, useContext, useEffect, useRef, useState } from "react";

import { type SessionConfig } from "@package";
import type { Agent } from "@src/agent-config";
import * as agents from "@src/agent-config";
import { models, type Model } from "@src/settings";

type ServerSession = {
  id: string;
  [key: string]: any;
} | null;

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

  /**
   * session object received from the server on session.created
   * and session.updated events
   */
  currentSession: ServerSession;
  setCurrentSession: (session: ServerSession) => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

interface SessionProviderProps {
  children: React.ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [activeState, setActiveState] = useState<"inactive" | "loading" | "active">("inactive");
  const [selectedModel, setSelectedModel] = useState(models["Orpheus-3b"]);
  const [selectedAgent, setSelectedAgent] = useState<Agent>(agents.aiGirlfriend);
  // here we'll store the session object received from the server on session.created
  // and session.updated events
  const [currentSession, setCurrentSession] = useState<ServerSession>(null);

  const durationRef = useRef(0);

  // initial state is the combined config of the selected model and instructions from the selected agent
  const [config, setConfig] = useState<SessionConfig>({
    ...selectedModel.sessionConfig,
    instructions: selectedAgent.instructions,
    tools: selectedAgent.tools,
  });

  // update the config when the selected model changes
  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      ...selectedModel.sessionConfig,
      instructions: prev.instructions,
      tools: prev.tools,
    }));
  }, [selectedModel]);

  // update the config when the selected agent changes
  useEffect(() => {
    setConfig((prev) => ({ ...prev, instructions: selectedAgent.instructions, tools: selectedAgent.tools }));
  }, [selectedAgent]);

  return (
    <SessionContext.Provider
      value={{
        activeState,
        setActiveState,

        durationRef,

        availableModels: models,
        selectedModel,
        setSelectedModel,

        availableAgents: agents,
        selectedAgent,
        setSelectedAgent,

        config,
        setConfig,

        currentSession,
        setCurrentSession,
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

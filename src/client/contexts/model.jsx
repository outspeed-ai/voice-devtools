import { createContext, useContext, useState } from "react";

import { MODELS } from "@src/session-config";

const ModelContext = createContext(null);

export function ModelProvider({ children }) {
  const [selectedModel, setSelectedModel] = useState(MODELS["MiniCPM-o-2_6"]);

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error("useModel() hook must be used within a ModelProvider");
  }
  return context;
}

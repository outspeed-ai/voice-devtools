import { createContext, useContext, useState } from "react";

import { models, type Model } from "@src/settings";

interface ModelContextType {
  selectedModel: Model;
  setSelectedModel: (model: Model) => void;
}

const ModelContext = createContext<ModelContextType | null>(null);

interface ModelProviderProps {
  children: React.ReactNode;
}

export const ModelProvider: React.FC<ModelProviderProps> = ({ children }) => {
  const [selectedModel, setSelectedModel] = useState<Model>(models["MiniCPM-o-2_6"]);

  return <ModelContext.Provider value={{ selectedModel, setSelectedModel }}>{children}</ModelContext.Provider>;
};

export function useModel() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error("useModel() hook must be used within a ModelProvider");
  }
  return context;
}

import { createContext, useContext, useState } from "react";

import { models } from "@src/settings";

const ModelContext = createContext(null);


export function ModelProvider({ children }) {
  console.log(models["MiniCPM-o-2_6"])
  const [selectedModel, setSelectedModel] = useState(models["MiniCPM-o-2_6"]);

  return <ModelContext.Provider value={{ selectedModel, setSelectedModel }}>{children}</ModelContext.Provider>;
}

export function useModel() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error("useModel() hook must be used within a ModelProvider");
  }
  return context;
}

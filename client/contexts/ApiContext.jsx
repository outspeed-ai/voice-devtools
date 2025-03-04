import { createContext, useContext, useState } from "react";

export const OPENAI_PROVIDER = "api.openai.com";
export const OUTSPEED_PROVIDER = "api.outspeed.com";

export const API_PROVIDERS = {
  OUTSPEED: {
    name: "Outspeed",
    url: OUTSPEED_PROVIDER,
    features: ["sessions"],
  },
  OPENAI: {
    name: "OpenAI",
    url: OPENAI_PROVIDER,
    features: [],
  },
};

const ApiContext = createContext(null);

export function ApiProvider({ children }) {
  const [selectedProvider, setSelectedProvider] = useState(
    API_PROVIDERS.OUTSPEED,
  );

  return (
    <ApiContext.Provider value={{ selectedProvider, setSelectedProvider }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
}

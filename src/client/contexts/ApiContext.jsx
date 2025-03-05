import { createContext, useContext, useState } from "react";

import { API_PROVIDERS, OUTSPEED_PROVIDER } from "@/config/session";

const ApiContext = createContext(null);

export function ApiProvider({ children }) {
  const [selectedProvider, setSelectedProvider] = useState(
    API_PROVIDERS[OUTSPEED_PROVIDER],
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

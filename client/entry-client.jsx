import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import AppRouter from "./components/AppRouter";
import { ApiProvider } from "./contexts/ApiContext";

import "./base.css";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.hydrateRoot(
  document.getElementById("root"),
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ApiProvider>
          <AppRouter />
        </ApiProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

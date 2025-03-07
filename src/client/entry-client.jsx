import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import { ModelProvider } from "./contexts/ApiContext";
import Router from "./router";

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
        <ModelProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </ModelProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

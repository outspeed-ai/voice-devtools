import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Toaster } from "sonner";

import { AuthProvider } from "./contexts/auth";
import { ModelProvider } from "./contexts/model";
import Router from "./router";

export function render(url) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  });

  const html = renderToString(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StaticRouter location={url}>
            <ModelProvider>
              <Toaster richColors position="top-right" />
              <Router />
            </ModelProvider>
          </StaticRouter>
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>,
  );

  return { html };
}

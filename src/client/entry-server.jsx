import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Toaster } from "sonner";

import { ApiProvider } from "./contexts/ApiContext";
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
        <StaticRouter location={url}>
          <ApiProvider>
            <Toaster richColors position="top-right" />
            <Router />
          </ApiProvider>
        </StaticRouter>
      </QueryClientProvider>
    </StrictMode>,
  );

  return { html };
}

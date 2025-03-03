import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";

import AppRouter from "./components/AppRouter";
import { ApiProvider } from "./contexts/ApiContext";

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
            <AppRouter />
          </ApiProvider>
        </StaticRouter>
      </QueryClientProvider>
    </StrictMode>,
  );

  return { html };
}

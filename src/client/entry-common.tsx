import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { AuthProvider } from "./contexts/auth";
import { ModelProvider } from "./contexts/model";
import Router from "./router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function EntryCommon() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModelProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </ModelProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

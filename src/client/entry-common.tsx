import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { SessionProvider } from "./contexts/session";
import { AudioPlayerProvider } from "./contexts/shared-audio-player";
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
      <SessionProvider>
        <AudioPlayerProvider>
          <Toaster richColors position="top-right" closeButton />
          <Router />
        </AudioPlayerProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

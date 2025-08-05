import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import semver from "semver";

const UPDATE_ENDPOINT = "https://raw.githubusercontent.com/outspeed-ai/voice-devtools/refs/heads/main/package.json";

/**
 * Custom hook to check for console updates
 * Fetches update information from the update endpoint and compares with current version
 */
export function useUpdateCheck(consoleVersion: string) {
  return useQuery({
    queryKey: ["update-check"],
    refetchOnWindowFocus: false,
    refetchInterval: 1000 * 60 * 60, // Check once per hour
    queryFn: async () => {
      try {
        const { version } = await axios.get(UPDATE_ENDPOINT).then((r) => r.data);
        if (semver.lt(consoleVersion, version)) {
          return { hasUpdate: true, version };
        } else {
          return { hasUpdate: false };
        }
      } catch (error) {
        console.error("Failed to check for updates:", error);
        return { hasUpdate: false };
      }
    },
  });
}

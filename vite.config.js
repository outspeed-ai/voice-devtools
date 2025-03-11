import react from "@vitejs/plugin-react";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const path = fileURLToPath(import.meta.url);

// https://vite.dev/config/
export default {
  resolve: {
    alias: {
      "@": join(dirname(path), "src/client"),
      "@src": join(dirname(path), "src"),
    },
  },
  envPrefix: "OUTSPEED_",
  plugins: [react()],
};

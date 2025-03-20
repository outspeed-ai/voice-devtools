import react from "@vitejs/plugin-react";
import { join } from "path";

// https://vite.dev/config/
export default {
  resolve: {
    alias: {
      "@": join(__dirname, "src/client"),
      "@src": join(__dirname, "src"),
    },
  },
  envPrefix: "OUTSPEED_",
  plugins: [react()],
};

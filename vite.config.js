import react from "@vitejs/plugin-react";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const path = fileURLToPath(import.meta.url);

// https://vite.dev/config/
export default {
  root: join(dirname(path), "client"),
  resolve: {
    alias: {
      "@": resolve(__dirname, "./client"),
    },
  },
  plugins: [react()],
};

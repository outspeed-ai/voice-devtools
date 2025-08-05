import react from "@vitejs/plugin-react";
import { join } from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { PluginOption } from "vite";

const ANALYZE = process.env.ANALYZE === "true";

const plugins: PluginOption[] = [react()];
if (ANALYZE) {
  plugins.push(visualizer({ open: true }));
}

// https://vite.dev/config/
export default {
  define: {
    '__BACKEND_SERVER_URL__': JSON.stringify('')
  },
  resolve: {
    alias: {
      "@": join(__dirname, "src/client"),
      "@src": join(__dirname, "src"),
      "@package": join(__dirname, "src/package")
    },
  },
  envPrefix: "OUTSPEED_",
  plugins,
};

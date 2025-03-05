import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";

const app = express();
const initialPort = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.log("⚠️ OPENAI_API_KEY is not set");
}

const OUTSPEED_API_KEY = process.env.VITE_OUTSPEED_API_KEY;
if (!OUTSPEED_API_KEY) {
  console.log("⚠️ VITE_OUTSPEED_API_KEY is not set");
}

const providerConfigs = {
  "api.outspeed.com": {
    apiKey: OUTSPEED_API_KEY,
    body: {
      model: "MiniCPM-o-2_6",
      voice: "male",
    },
  },
  "api.openai.com": {
    apiKey: OPENAI_API_KEY,
    body: {
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: "verse",
    },
  },
};

// Configure Vite middleware for React client
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});
app.use(vite.middlewares);

// API route for token generation
app.get("/token", async (req, res) => {
  try {
    const provider = req.query.apiUrl;
    if (typeof provider !== "string") {
      res.status(400).json({ error: "apiUrl query param must be a string" });
      return;
    }

    if (!(provider in providerConfigs)) {
      res.status(400).json({ error: `no config found for ${provider}` });
      return;
    }

    const config = providerConfigs[provider];
    if (!config.apiKey) {
      res.status(400).json({
        error: `no API key found for ${provider}`,
        code: "NO_API_KEY",
      });
      return;
    }

    const url = `https://${provider}/v1/realtime/sessions`;
    console.log(`👉 using ${url} to create session...`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config.body),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Token generation error:", error);
      throw new Error(error);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// Render the React client
app.use("*", async (req, res, next) => {
  const url = req.originalUrl;

  try {
    const template = await vite.transformIndexHtml(
      url,
      fs.readFileSync("./index.html", "utf-8"),
    );
    const { render } = await vite.ssrLoadModule(
      path.join(import.meta.dirname, "./client/entry-server.jsx"),
    );
    const appHtml = await render(url);
    const html = template.replace(`<!--ssr-outlet-->`, appHtml?.html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

// Function to check if a port is available
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    // close the server once it's listening so it can be used by http server
    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
};

// Function to find an available port
const findAvailablePort = async (startPort) => {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    console.log(`Port ${port} is in use, trying ${port + 1}`);
    port++;
  }

  return port;
};

const startServer = async () => {
  try {
    const availablePort = await findAvailablePort(initialPort);
    app.listen(availablePort, (err) => {
      if (err) {
        console.error(err);
        return;
      }

      // Get all network interfaces
      const interfaces = os.networkInterfaces();
      console.log("\n🚀 App running at:\n");
      Object.keys(interfaces).forEach((interfaceName) => {
        interfaces[interfaceName]?.forEach((details) => {
          if (details.family === "IPv4") {
            console.log(
              `  ➜ Local: http://${details.address}:${availablePort}`,
            );
          }
        });
      });

      console.log(`  ➜ Local: http://localhost:${availablePort}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
};

startServer();

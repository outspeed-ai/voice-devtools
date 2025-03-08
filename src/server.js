import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";

import {
  MODELS,
  OPENAI_PROVIDER,
  OUTSPEED_PROVIDER,
} from "./session-config.js";

// Get the directory name properly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const apiKeys = {};
for (const model in MODELS) {
  if (MODELS[model].url === OPENAI_PROVIDER) {
    apiKeys[model] = OPENAI_API_KEY;
  } else if (MODELS[model].url === OUTSPEED_PROVIDER) {
    apiKeys[model] = OUTSPEED_API_KEY;
  }
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
app.post("/token", express.json(), async (req, res) => {
  try {
    const { model } = req.body;
    if (typeof model !== "string") {
      res.status(400).json({ error: "model query param must be a string" });
      return;
    }

    const config = MODELS[model];
    if (!config) {
      res
        .status(400)
        .json({ error: `no model found for ${model}`, code: "NO_MODEL" });
      return;
    }

    const apiKey = apiKeys[model];
    if (!apiKey) {
      res
        .status(400)
        .json({ error: `no API key found for ${model}`, code: "NO_API_KEY" });
      return;
    }

    const url = `https://${config.url}/v1/realtime/sessions`;
    console.log(`👉 using ${url} to create session...`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Token generation error:", error);
      res.status(response.status).send({ type: "error", message: error });
      return;
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
      path.join(__dirname, "./client/entry-server.jsx"),
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

      console.log(`🚀 App running at http://localhost:${availablePort}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
};

startServer();

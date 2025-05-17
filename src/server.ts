import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
dotenv.config({ path: ".env", override: true });

import express from "express";
import { createServer as createViteServer } from "vite";

import { providers } from './package';
import { models } from "./settings.js";

// Get the directory name properly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const initialPort = Number(process.env.PORT) || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.log("⚠️ OPENAI_API_KEY is not set");
}

const OUTSPEED_API_KEY = process.env.OUTSPEED_API_KEY;
if (!OUTSPEED_API_KEY) {
  console.log("⚠️ OUTSPEED_API_KEY is not set");
}

const apiKeys: Record<string, string | undefined> = {};
for (const model in models) {
  const modelData = models[model as keyof typeof models];
  if (modelData.provider === providers.OpenAI) {
    apiKeys[model] = OPENAI_API_KEY;
  } else if (modelData.provider === providers.Outspeed) {
    apiKeys[model] = OUTSPEED_API_KEY;
  }
}

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
      res.status(400).json({ error: "model field must be a string" });
      return;
    }

    if (!(model in models)) {
      res.status(400).json({ error: `no model found for ${model}`, code: "NO_MODEL" });
      return;
    }

    const modelData = models[model as keyof typeof models];
    const apiKey = apiKeys[model];
    if (!apiKey) {
      res.status(400).json({ error: `no API key found for ${model}`, code: "NO_API_KEY" });
      return;
    }

    const url = `https://${modelData.provider.url}/v1/realtime/sessions`;
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
    const template = await vite.transformIndexHtml(url, fs.readFileSync("./index.html", "utf-8"));

    const { render } = await vite.ssrLoadModule(path.join(__dirname, "./client/entry-server.jsx"));
    const appHtml = await render(url);
    const html = template.replace(`<!--ssr-outlet-->`, appHtml?.html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite.ssrFixStacktrace(e as Error);
    next(e);
  }
});

// Function to check if a port is available
const isPortAvailable = (port: number) => {
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
const findAvailablePort = async (startPort: number) => {
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

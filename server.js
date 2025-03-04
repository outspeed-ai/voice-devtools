import "dotenv/config";
import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const port = process.env.PORT || 3000;

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
      throw new Error(`apiUrl query param must be a string`);
    }

    if (!(provider in providerConfigs)) {
      throw new Error(`no config found for ${provider}`);
    }

    const config = providerConfigs[provider];
    if (!config.apiKey) {
      throw new Error(`no API key found for ${provider}`);
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
      fs.readFileSync("./client/index.html", "utf-8"),
    );
    const { render } = await vite.ssrLoadModule("./client/entry-server.jsx");
    const appHtml = await render(url);
    const html = template.replace(`<!--ssr-outlet-->`, appHtml?.html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

app.listen(port, () => {
  console.log(`Express server running on *:${port}`);
});

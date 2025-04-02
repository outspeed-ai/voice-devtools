import { models, providers } from "./src/settings.js";

export default {
  async fetch(request, env, ctx) {
    // Add CORS headers to handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    const url = new URL(request.url);
    
    // Helper function to add CORS headers to all responses
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Add test endpoint
    if (request.method === "GET" && url.pathname === "/test") {
      return new Response(JSON.stringify({ status: "ok", message: "Test endpoint working" }), {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
      });
    }

    // Only handle POST requests to /token endpoint
    if (request.method !== "POST" || url.pathname !== "/token") {
      return new Response("Not Found", { 
        status: 404,
        headers: corsHeaders
      });
    }

    try {
      const body = await request.json();
      const { model } = body;

      if (typeof model !== "string") {
        return new Response(JSON.stringify({ error: "model field must be a string" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!(model in models)) {
        return new Response(
          JSON.stringify({ error: `no model found for ${model}`, code: "NO_MODEL" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const modelData = models[model];
      let apiKey;

      if (modelData.provider === providers.OpenAI) {
        apiKey = env.OPENAI_API_KEY;
      } else if (modelData.provider === providers.Outspeed) {
        apiKey = env.OUTSPEED_API_KEY;
      }

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: `no API key found for ${model}`, code: "NO_API_KEY" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const url = `https://${modelData.provider.url}/v1/realtime/sessions`;
      console.log(`👉 using ${url} to create session...`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Token generation error:", error);
        return new Response(
          JSON.stringify({ type: "error", message: error }),
          {
            status: response.status,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
      });
    } catch (error) {
      console.error("Token generation error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate token" }),
        {
          status: 500,
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          },
        }
      );
    }
  },
}; 
import { models, providers } from "../src/settings.js";

export default {
  async fetch(request, env, ctx) {
    console.log('🔍 Request received:', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers),
    });

    // Add CORS headers to handle preflight requests
    if (request.method === "OPTIONS") {
      console.log('👉 Handling OPTIONS preflight request');
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    const url = new URL(request.url);
    console.log('📍 Pathname:', url.pathname);
    
    // Helper function to add CORS headers to all responses
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Add test endpoint
    if (request.method === "GET" && url.pathname === "/test") {
      console.log('🧪 Test endpoint called');
      return new Response(JSON.stringify({ status: "ok", message: "Test endpoint working" }), {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
      });
    }

    // Only handle POST requests to /token endpoint
    if (request.method !== "POST" || url.pathname !== "/token") {
      console.log('❌ Invalid endpoint or method:', { method: request.method, pathname: url.pathname });
      return new Response("Not Found", { 
        status: 404,
        headers: corsHeaders
      });
    }

    try {
      const body = await request.json();
      console.log('📦 Request body:', body);

      const { model } = body;

      if (typeof model !== "string") {
        console.log('❌ Invalid model type:', typeof model);
        return new Response(JSON.stringify({ error: "model field must be a string" }), {
          status: 400,
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          },
        });
      }

      if (!(model in models)) {
        console.log('❌ Model not found:', model);
        return new Response(
          JSON.stringify({ error: `no model found for ${model}`, code: "NO_MODEL" }),
          {
            status: 400,
            headers: { 
              ...corsHeaders,
              "Content-Type": "application/json" 
            },
          }
        );
      }

      const modelData = models[model];
      console.log('📝 Model data:', { provider: modelData.provider.name });
      
      let apiKey;

      if (modelData.provider === providers.OpenAI) {
        apiKey = env.OPENAI_API_KEY;
      } else if (modelData.provider === providers.Outspeed) {
        apiKey = env.OUTSPEED_API_KEY;
      }

      if (!apiKey) {
        console.log('❌ No API key found for provider:', modelData.provider.name);
        return new Response(
          JSON.stringify({ error: `no API key found for ${model}`, code: "NO_API_KEY" }),
          {
            status: 400,
            headers: { 
              ...corsHeaders,
              "Content-Type": "application/json" 
            },
          }
        );
      }

      const providerUrl = `https://${modelData.provider.url}/v1/realtime/sessions`;
      console.log('🔗 Making request to provider:', providerUrl);

      const response = await fetch(providerUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      console.log('📥 Provider response status:', response.status);

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Provider error:', error);
        return new Response(
          JSON.stringify({ type: "error", message: error }),
          {
            status: response.status,
            headers: { 
              ...corsHeaders,
              "Content-Type": "application/json" 
            },
          }
        );
      }

      const data = await response.json();
      console.log('✅ Success: Token generated');
      return new Response(JSON.stringify(data), {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
      });
    } catch (error) {
      console.error('💥 Server error:', error);
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
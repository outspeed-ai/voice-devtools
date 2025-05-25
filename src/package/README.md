# Quickstart

This package is used to establish a session with Outspeed (or Realtime API) via WebRTC for your voice agents.

There are 3 steps to deploy your voice agents:

## Step 1: Obtain API Key

Obtain the Outspeed API key from [Outspeed Dashboard](https://dashboard.outspeed.com).

## Step 2: Server setup

We need a server that'll issue an ephemeral key. This key allows the client to establish a secure direction connection with the model provider
from the frontend. The ephemeral key is modeled after the same concept in [Realtime API spec](https://platform.openai.com/docs/guides/realtime#creating-an-ephemeral-token).

Here's a javascript snippet that'll run behind an endpoint on your backend. You'll need the API key from step 1 to obtain an ephemeral
key from Outspeed REST endpoint. Think of ephemeral key as that your user will use to connect directly to the voice agent.

Below is an example of a simple Node.js express server which mints an ephemeral API key using the REST API:

```js
import express from "express";

const app = express();

// An endpoint which would work with the client code above - it returns
// the contents of a REST API request to this protected endpoint
app.get("/session", async (req, res) => {
    const url = `https://api.outspeed.com/v1/realtime/sessions`; // replace with api.openai.com for getting OpenAI token
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
  })
```

## Step 3: Client Setup

Follow these steps to do it:

1. Define a `SessionConfig` object that will be used to make the connection
2. Choose a provider for that `SessionConfig`. Note that some models are only supported by some providers.
   Ex: Outspeed supports Orpheus-3b. So choose `providers.Outspeed` from `providers` object exported by the package
3. Create a `ConnectionConfig` object that will be used to make the connection. It'll use a `SessionConfig` and a chosen provider
   Here's an example of a `ConnectionConfig`
4. Make the connection using `startWebrtcSession(ephemeralKey, connectionConfig)` where the ephemeralKey is obtained from the endpoint defined in Step 2.

Here's a simple javascript example:

```js
import { providers, startWebrtcSession } from "@package";

// Assume ephemeralKey is fetched from your backend as described in Step 2
// const ephemeralKey = "your_ephemeral_key";

const sessionConfig = {
  model: "Orpheus-3b",
  voice: "tara",
  input_audio_transcription: { model: "whisper-v3-turbo" },
  modalities: ["text", "audio"]
  temperature: 0.7,
  instructions: "You are a helpful assistant.",
  tools: [], // Add any FunctionDefinition objects if needed
  turn_detection: {
    type: "server_vad", // or "semantic_vad"
  },
};

const connectionConfig = {
  provider: providers.Outspeed,
  sessionConfig: sessionConfig,
};

async function connect() {
  try {
    // start a WebRtC session and get RTCPeerConnection and RTCDataChannel objects
    const { pc, dc } = await startWebrtcSession(ephemeralKey, connectionConfig);
    console.log("WebRTC session started:", webrtcSession);

    // handle events from the data channel
    dc.addEventListener("message", async (e) => {
      try {
        const event = JSON.parse(e.data);
        console.log(event);


        // input track will be muted so we need to unmute it
        // this will be abstracted away soon so you won't have to worry about it
        if (event.type === "session.created") {
          pc.getSenders().forEach((sender) => {
            if (!sender.track) {
              console.error("error: session.created - No track found");
              return;
            }

            sender.track.enabled = true;
          });
        }
      } catch (error) {
        console.error("error: data channel message:", error);
      }
    });
  } catch (error) {
    console.error("Failed to start WebRTC session:", error);
  }
}

connect();
```

# Voice DevTools

This UI provides a debug console for real-time AI voice interactions. It works with multiple realtime models ([View supported models](https://docs.outspeed.com/models)). Features include:

1. Cost Tracking: Know how much you've spent per voice interaction
2. Model Support: Supports open-source (MiniCPM-o) and closed-source S2S models (adding more soon!)
3. Metrics Support: Track errors, response timelines, and performance
4. Voice and Chat UI

Inspired by [openai-realtime-console](https://github.com/openai/openai-realtime-console) and [openai-realtime-agents](https://github.com/openai/openai-realtime-agents).

## Quick Start

1. Get your API keys:

   - [Outspeed API key](https://dashboard.outspeed.com)
   - [OpenAI API key](https://platform.openai.com/settings/api-keys)

2. Set up environment:

   ```bash
   cp .env.example .env
   # Add your API keys to .env:
   # OPENAI_API_KEY="<your-openai-key>"
   # OUTSPEED_API_KEY="<your-outspeed-key>"
   ```

3. Install and run:
   ```bash
   npm install
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to access the console.

### Usage

To modify agent prompt and tools, modify `agent-config.js`.

To modify the model parameters like (voice, version, etc.), edit `model-config.js`


### Agents

There are two voice agent examples already present in `agent-config.js`:
1. Dental Agent: Answers callers' questions about working hours of a dental clinic
2. Message Agent: Takes callers' messages for a person

You can modify the export in the file to activate an agent:

```js
// agent-config.js
export { dental_agent as agent }

// for message_agent
export { message_agent as agent }
```

Play around with the prompts, or add your own voice agent to give it a spin.

### Supported Models
  - [MiniCPM-o](https://github.com/OpenBMB/MiniCPM-o) (hosted by Outspeed)
  - OpenAI Realtime models
  - Moshi (Coming Soon)
  - Gemini Multimodal Live (Coming Soon)

## License

MIT

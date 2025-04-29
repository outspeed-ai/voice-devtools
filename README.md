# Voice DevTools

This UI provides a debug console for real-time AI voice interactions. It works with multiple realtime models ([View supported models](https://docs.outspeed.com/models)). Features include:

1. Cost Tracking: Know how much you've spent per voice interaction
2. Model Support: Supports open-source (Orpheus 3B) and closed-source S2S models like OpenAI's GPT-4o Realtime (adding more soon!)
3. Voice and Chat UI
4. Session history and recording

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

There are three voice agent examples already present. You can choose them in the Session Config UI on the right before starting a session.

1. Dental Agent: Answers callers' questions about working hours of a dental clinic
2. Message Agent: Takes callers' messages for a person
3. Recruiter Agent: Talks to a candidate and asks questions about their background and availability

You can see the prompts in [./src/agent-config.ts](./src/agent-config.ts) file.

### Supported Models

- [Orpheus 3B](https://huggingface.co/collections/canopylabs/orpheus-tts-67d9ea3f6c05a941c06ad9d2) (hosted by Outspeed)
- OpenAI Realtime models
- Moshi (Coming Soon)
- Gemini Multimodal Live (Coming Soon)

### Deployment

You can see the deployment your agent to Cloudflare by following the steps at [demo.outspeed.com/deploy](https://demo.outspeed.com/deploy), or you could run this locally and visit the deploy route.

## License

MIT

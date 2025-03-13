# Outspeed Realtime Console

A sophisticated debug console for real-time AI interactions, providing enhanced monitoring and debugging capabilities for AI model interactions. Inspired by [openai-realtime-console](https://github.com/openai/openai-realtime-console.git) and [openai-realtime-agents](https://github.com/openai/openai-realtime-agents).

## Features

- 🎯 **Enhanced Chat UI**
  - Modern chat interface for text and audio interactions
  - Real-time audio playback transcripts and downloadable recordings
- 🤖 **Model Support**

  - [MiniCPM-o](https://github.com/OpenBMB/MiniCPM-o) (hosted by Outspeed)
  - OpenAI Realtime models
  - More models coming soon

- 💰 **Cost Tracking**

  - Real-time session cost monitoring
  - Token usage analytics
  - Time-based pricing calculations

- 📊 **Advanced Metrics**
  - Response timelines
  - Performance analytics
  - Errors

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

## Tech Stack

- React (Frontend)
- Express.js (Backend)
- WebRTC (Real-time communication)
- Web Audio API
- React Query
- TailwindCSS

## License

MIT

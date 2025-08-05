# Voice DevTools

> **Note**: This project is no longer maintained. Please use the dashboard at [dashboard.outspeed.com](https://dashboard.outspeed.com) instead.

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

## License

MIT

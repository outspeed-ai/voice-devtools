import { type FunctionDefinition } from "@package";

export const TOOLS: Record<string, FunctionDefinition> = {
    "get_weather": {
      name: "get_weather",
      type: "function",
      description: "Retrieves the current weather information",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The geographic location for which to retrieve the weather",
          },
          units: {
            type: "string",
            description: "The unit of measurement for temperature, e.g., 'metric' or 'imperial'",
            enum: ["metric", "imperial"],
          },
          language: {
            type: "string",
            description: "Language of the response, e.g., 'en' for English",
          },
        },
        required: [],
      },
    },
  };

  
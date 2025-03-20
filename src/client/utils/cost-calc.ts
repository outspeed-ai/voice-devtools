/**
 * Utility functions for calculating costs based on token usage
 */

import { OpenAICosts } from "@src/settings";

const MILLION = 1_000_000;

interface OpenAIUsage {
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  input_token_details?: {
    cached_tokens?: number;
    text_tokens?: number;
    audio_tokens?: number;
    cached_tokens_details?: {
      text_tokens?: number;
      audio_tokens?: number;
    };
  };
  output_token_details?: {
    text_tokens?: number;
    audio_tokens?: number;
  };
}

/**
 * Calculate the cost breakdown for a response from OpenAI
 *
 * @param usage - The usage object from the OpenAI response
 * @param costRates - The cost rates for the model
 * @returns - The calculated cost data
 */
export function calculateOpenAICosts(usage: OpenAIUsage, costRates: OpenAICosts) {
  const { input: inputCostRates, output: outputCostRates } = costRates;

  // Get token counts
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;

  // Extract detailed token breakdown
  const tokenDetails = {
    input: usage.input_token_details || null,
    output: usage.output_token_details || null,
  };

  // Initialize the cost breakdown structure
  const costBreakdown = {
    input: {
      text: 0,
      audio: 0,
      cached: {
        text: 0,
        audio: 0,
      },
    },
    output: {
      text: 0,
      audio: 0,
    },
  };

  // Initialize token counts structure
  const tokenCounts = {
    input: {
      text: 0,
      audio: 0,
      cached: {
        text: 0,
        audio: 0,
      },
    },
    output: {
      text: 0,
      audio: 0,
    },
  };

  let inputCostValue = 0;
  let outputCostValue = 0;

  // Calculate input costs and update token counts
  if (tokenDetails.input) {
    // Text tokens
    if (tokenDetails.input.text_tokens !== undefined) {
      costBreakdown.input.text = (tokenDetails.input.text_tokens / MILLION) * inputCostRates.text;
      inputCostValue += costBreakdown.input.text;
      tokenCounts.input.text = tokenDetails.input.text_tokens;
    }

    // Audio tokens
    if (tokenDetails.input.audio_tokens !== undefined) {
      costBreakdown.input.audio = (tokenDetails.input.audio_tokens / MILLION) * inputCostRates.audio;
      inputCostValue += costBreakdown.input.audio;
      tokenCounts.input.audio = tokenDetails.input.audio_tokens;
    }

    // Cached tokens
    if (tokenDetails.input.cached_tokens !== undefined) {
      // Check if there's a detailed breakdown of cached tokens
      if (tokenDetails.input.cached_tokens_details) {
        // Calculate costs for cached text tokens
        if (tokenDetails.input.cached_tokens_details.text_tokens !== undefined) {
          costBreakdown.input.cached.text =
            (tokenDetails.input.cached_tokens_details.text_tokens / MILLION) * inputCostRates.cached.text;
          inputCostValue += costBreakdown.input.cached.text;
          tokenCounts.input.cached.text = tokenDetails.input.cached_tokens_details.text_tokens;
        }

        // Calculate costs for cached audio tokens
        if (tokenDetails.input.cached_tokens_details.audio_tokens !== undefined) {
          costBreakdown.input.cached.audio =
            (tokenDetails.input.cached_tokens_details.audio_tokens / MILLION) * inputCostRates.cached.audio;
          inputCostValue += costBreakdown.input.cached.audio;
          tokenCounts.input.cached.audio = tokenDetails.input.cached_tokens_details.audio_tokens;
        }
      } else {
        // If no detailed breakdown, apply text cache rate as fallback
        costBreakdown.input.cached.text = (tokenDetails.input.cached_tokens / MILLION) * inputCostRates.cached.text;
        inputCostValue += costBreakdown.input.cached.text;
        tokenCounts.input.cached.text = tokenDetails.input.cached_tokens;
      }
    }
  } else {
    // Fallback if detailed breakdown not available
    costBreakdown.input.text = (inputTokens / MILLION) * inputCostRates.text;
    inputCostValue = costBreakdown.input.text;
    tokenCounts.input.text = inputTokens;
  }

  // Calculate output costs and update token counts
  if (tokenDetails.output) {
    // Text tokens
    if (tokenDetails.output.text_tokens !== undefined) {
      costBreakdown.output.text = (tokenDetails.output.text_tokens / MILLION) * outputCostRates.text;
      outputCostValue += costBreakdown.output.text;
      tokenCounts.output.text = tokenDetails.output.text_tokens;
    }

    // Audio tokens
    if (tokenDetails.output.audio_tokens !== undefined) {
      costBreakdown.output.audio = (tokenDetails.output.audio_tokens / MILLION) * outputCostRates.audio;
      outputCostValue += costBreakdown.output.audio;
      tokenCounts.output.audio = tokenDetails.output.audio_tokens;
    }
  } else {
    // Fallback if detailed breakdown not available
    costBreakdown.output.text = (outputTokens / MILLION) * outputCostRates.text;
    outputCostValue = costBreakdown.output.text;
    tokenCounts.output.text = outputTokens;
  }

  const totalCost = inputCostValue + outputCostValue;

  return {
    inputTokens,
    outputTokens,
    inputCost: inputCostValue,
    outputCost: outputCostValue,
    totalCost,
    tokenDetails,
    costBreakdown,
    tokenCounts,
    timestamp: new Date().toLocaleTimeString(),
  };
}

export type OpenAICostData = ReturnType<typeof calculateOpenAICosts>;

/**
 * Update cumulative cost with the latest cost data
 *
 * @param  prev - The previous cumulative cost
 * @param  newCostData - The new cost data to add to the cumulative
 * @returns - The updated cumulative cost
 */
export function updateCumulativeCostOpenAI(prev: CostState, newCostData: OpenAICostData) {
  if (!newCostData) {
    return prev;
  }

  const { inputTokens, outputTokens, totalCost, tokenDetails } = newCostData;

  // For the first update, use the current data directly
  if (prev.totalCost === 0) {
    return {
      ...newCostData,
      // Preserve the existing durationInSeconds and costPerMinute
      durationInSeconds: prev.durationInSeconds,
      costPerMinute: prev.costPerMinute,
      // Copy over tokenCounts if they exist, otherwise initialize them
      tokenCounts: newCostData.tokenCounts || {
        input: {
          text: tokenDetails?.input?.text_tokens || 0,
          audio: tokenDetails?.input?.audio_tokens || 0,
          cached: {
            text: tokenDetails?.input?.cached_tokens_details?.text_tokens || tokenDetails?.input?.cached_tokens || 0,
            audio: tokenDetails?.input?.cached_tokens_details?.audio_tokens || 0,
          },
        },
        output: {
          text: tokenDetails?.output?.text_tokens || 0,
          audio: tokenDetails?.output?.audio_tokens || 0,
        },
      },
      timestamp: newCostData.timestamp,
    };
  }

  // For subsequent updates, properly add to the cumulative values
  const newCumulative = {
    inputTokens: prev.inputTokens + inputTokens,
    outputTokens: prev.outputTokens + outputTokens,
    totalCost: prev.totalCost + totalCost,
    // Preserve the existing durationInSeconds and costPerMinute
    durationInSeconds: prev.durationInSeconds,
    costPerMinute: prev.costPerMinute,
    costBreakdown: {
      input: {
        text: prev.costBreakdown?.input?.text || 0,
        audio: prev.costBreakdown?.input?.audio || 0,
        cached: {
          text: prev.costBreakdown?.input?.cached?.text || 0,
          audio: prev.costBreakdown?.input?.cached?.audio || 0,
        },
      },
      output: {
        text: prev.costBreakdown?.output?.text || 0,
        audio: prev.costBreakdown?.output?.audio || 0,
      },
    },
    tokenCounts: {
      input: {
        text: prev.tokenCounts?.input?.text || 0,
        audio: prev.tokenCounts?.input?.audio || 0,
        cached: {
          text: prev.tokenCounts?.input?.cached?.text || 0,
          audio: prev.tokenCounts?.input?.cached?.audio || 0,
        },
      },
      output: {
        text: prev.tokenCounts?.output?.text || 0,
        audio: prev.tokenCounts?.output?.audio || 0,
      },
    },
    timestamp: newCostData.timestamp,
  };

  // Add the current costBreakdown to the cumulative
  if (newCostData.costBreakdown) {
    const { costBreakdown } = newCostData;

    // Input costs
    newCumulative.costBreakdown.input.text += costBreakdown.input?.text || 0;
    newCumulative.costBreakdown.input.audio += costBreakdown.input?.audio || 0;

    // Handle cached breakdown structure
    if (costBreakdown.input?.cached) {
      if (typeof costBreakdown.input.cached === "object") {
        newCumulative.costBreakdown.input.cached.text += costBreakdown.input.cached?.text || 0;
        newCumulative.costBreakdown.input.cached.audio += costBreakdown.input.cached?.audio || 0;
      } else {
        newCumulative.costBreakdown.input.cached.text += costBreakdown.input.cached || 0;
      }
    }

    // Output costs
    newCumulative.costBreakdown.output.text += costBreakdown.output?.text || 0;
    newCumulative.costBreakdown.output.audio += costBreakdown.output?.audio || 0;
  }

  // Update token counts based on tokenDetails if available
  if (tokenDetails) {
    // Input token counts
    if (tokenDetails.input) {
      // Text tokens
      if (tokenDetails.input.text_tokens !== undefined) {
        newCumulative.tokenCounts.input.text += tokenDetails.input.text_tokens;
      }

      // Audio tokens
      if (tokenDetails.input.audio_tokens !== undefined) {
        newCumulative.tokenCounts.input.audio += tokenDetails.input.audio_tokens;
      }

      // Cached tokens
      if (tokenDetails.input.cached_tokens_details) {
        // Cached text tokens
        if (tokenDetails.input.cached_tokens_details.text_tokens !== undefined) {
          newCumulative.tokenCounts.input.cached.text += tokenDetails.input.cached_tokens_details.text_tokens;
        }

        // Cached audio tokens
        if (tokenDetails.input.cached_tokens_details.audio_tokens !== undefined) {
          newCumulative.tokenCounts.input.cached.audio += tokenDetails.input.cached_tokens_details.audio_tokens;
        }
      } else if (tokenDetails.input.cached_tokens !== undefined) {
        // If no detailed breakdown, add to cached text as fallback
        newCumulative.tokenCounts.input.cached.text += tokenDetails.input.cached_tokens;
      }
    }

    // Output token counts
    if (tokenDetails.output) {
      // Text tokens
      if (tokenDetails.output.text_tokens !== undefined) {
        newCumulative.tokenCounts.output.text += tokenDetails.output.text_tokens;
      }

      // Audio tokens
      if (tokenDetails.output.audio_tokens !== undefined) {
        newCumulative.tokenCounts.output.audio += tokenDetails.output.audio_tokens;
      }
    }
  }

  return newCumulative;
}

/**
 * Calculate time-based costs (for providers like Outspeed)
 *
 * @param durationInSeconds - The session duration in seconds
 * @param costPerMinute - The cost per minute
 * @returns - The calculated cost data
 */
export function calculateTimeCosts(durationInSeconds: number, costPerMinute: number) {
  const durationInMinutes = durationInSeconds / 60;
  const totalCost = durationInMinutes * costPerMinute;

  return {
    durationInSeconds,
    durationInMinutes,
    costPerMinute,
    totalCost,
    timestamp: new Date().toLocaleTimeString(),
  };
}

/**
 * Create an initial cost state structure
 *
 * @returns - Initial cost state structure
 */
export function getInitialCostState() {
  return {
    // common for all providers
    totalCost: 0,

    // for time-based providers like Outspeed
    durationInSeconds: 0,
    costPerMinute: 0,

    // to show when the data was last updated
    timestamp: new Date().toLocaleTimeString(),

    // for OpenAI Realtime API
    inputTokens: 0,
    outputTokens: 0,
    costBreakdown: {
      input: {
        text: 0,
        audio: 0,
        cached: {
          text: 0,
          audio: 0,
        },
      },
      output: {
        text: 0,
        audio: 0,
      },
    },
    // for OpenAI Realtime API
    tokenCounts: {
      input: {
        text: 0,
        audio: 0,
        cached: {
          text: 0,
          audio: 0,
        },
      },
      output: {
        text: 0,
        audio: 0,
      },
    },
  };
}

export type CostState = ReturnType<typeof getInitialCostState>;

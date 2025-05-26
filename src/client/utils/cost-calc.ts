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
      uncached: {
        text: 0,
        audio: 0,
      },
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
      uncached: {
        text: 0,
        audio: 0,
      },
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
    // Get total text and audio tokens
    const totalTextTokens = tokenDetails.input.text_tokens || 0;
    const totalAudioTokens = tokenDetails.input.audio_tokens || 0;

    // Get cached text and audio tokens
    const cachedTextTokens = tokenDetails.input.cached_tokens_details?.text_tokens || 0;
    const cachedAudioTokens = tokenDetails.input.cached_tokens_details?.audio_tokens || 0;

    // Calculate uncached tokens by subtracting cached from total
    const uncachedTextTokens = Math.max(0, totalTextTokens - cachedTextTokens);
    const uncachedAudioTokens = Math.max(0, totalAudioTokens - cachedAudioTokens);

    // Update token counts
    tokenCounts.input.uncached.text = uncachedTextTokens;
    tokenCounts.input.uncached.audio = uncachedAudioTokens;
    tokenCounts.input.cached.text = cachedTextTokens;
    tokenCounts.input.cached.audio = cachedAudioTokens;

    // Calculate costs
    costBreakdown.input.uncached.text = (uncachedTextTokens / MILLION) * inputCostRates.text;
    costBreakdown.input.uncached.audio = (uncachedAudioTokens / MILLION) * inputCostRates.audio;
    costBreakdown.input.cached.text = (cachedTextTokens / MILLION) * inputCostRates.cached.text;
    costBreakdown.input.cached.audio = (cachedAudioTokens / MILLION) * inputCostRates.cached.audio;

    // Sum up input costs
    inputCostValue =
      costBreakdown.input.uncached.text +
      costBreakdown.input.uncached.audio +
      costBreakdown.input.cached.text +
      costBreakdown.input.cached.audio;
  } else {
    // Fallback if detailed breakdown not available - treat all as uncached text
    costBreakdown.input.uncached.text = (inputTokens / MILLION) * inputCostRates.text;
    inputCostValue = costBreakdown.input.uncached.text;
    tokenCounts.input.uncached.text = inputTokens;
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
      // Preserve the existing durationInSeconds and costPerHour
      durationInSeconds: prev.durationInSeconds,
      costPerHour: prev.costPerHour,
      // Copy over tokenCounts if they exist, otherwise initialize them
      tokenCounts: newCostData.tokenCounts || {
        input: {
          uncached: {
            text: tokenDetails?.input?.text_tokens || 0,
            audio: tokenDetails?.input?.audio_tokens || 0,
          },
          cached: {
            text: tokenDetails?.input?.cached_tokens_details?.text_tokens || 0,
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
    // Preserve the existing durationInSeconds and costPerHour
    durationInSeconds: prev.durationInSeconds,
    costPerHour: prev.costPerHour,
    costBreakdown: {
      input: {
        uncached: {
          text: prev.costBreakdown?.input?.uncached?.text || 0,
          audio: prev.costBreakdown?.input?.uncached?.audio || 0,
        },
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
        uncached: {
          text: prev.tokenCounts?.input?.uncached?.text || 0,
          audio: prev.tokenCounts?.input?.uncached?.audio || 0,
        },
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

    // Input costs - uncached
    newCumulative.costBreakdown.input.uncached.text += costBreakdown.input?.uncached?.text || 0;
    newCumulative.costBreakdown.input.uncached.audio += costBreakdown.input?.uncached?.audio || 0;

    // Input costs - cached
    newCumulative.costBreakdown.input.cached.text += costBreakdown.input?.cached?.text || 0;
    newCumulative.costBreakdown.input.cached.audio += costBreakdown.input?.cached?.audio || 0;

    // Output costs
    newCumulative.costBreakdown.output.text += costBreakdown.output?.text || 0;
    newCumulative.costBreakdown.output.audio += costBreakdown.output?.audio || 0;
  }

  // Update token counts based on tokenDetails if available
  if (tokenDetails) {
    // Input token counts
    if (tokenDetails.input) {
      const totalTextTokens = tokenDetails.input.text_tokens || 0;
      const totalAudioTokens = tokenDetails.input.audio_tokens || 0;
      const cachedTextTokens = tokenDetails.input.cached_tokens_details?.text_tokens || 0;
      const cachedAudioTokens = tokenDetails.input.cached_tokens_details?.audio_tokens || 0;

      // Calculate uncached tokens
      const uncachedTextTokens = Math.max(0, totalTextTokens - cachedTextTokens);
      const uncachedAudioTokens = Math.max(0, totalAudioTokens - cachedAudioTokens);

      // Update token counts
      newCumulative.tokenCounts.input.uncached.text += uncachedTextTokens;
      newCumulative.tokenCounts.input.uncached.audio += uncachedAudioTokens;
      newCumulative.tokenCounts.input.cached.text += cachedTextTokens;
      newCumulative.tokenCounts.input.cached.audio += cachedAudioTokens;
    }

    // Output token counts
    if (tokenDetails.output) {
      if (tokenDetails.output.text_tokens !== undefined) {
        newCumulative.tokenCounts.output.text += tokenDetails.output.text_tokens;
      }
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
 * @param costPerHour - The cost per hour
 * @returns - The calculated cost data
 */
export function calculateTimeCosts(durationInSeconds: number, costPerHour: number) {
  const durationInHours = durationInSeconds / 3600;
  const totalCost = durationInHours * costPerHour;

  return {
    durationInSeconds,
    durationInHours,
    costPerHour,
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
    costPerHour: 0,

    // to show when the data was last updated
    timestamp: new Date().toLocaleTimeString(),

    // for OpenAI Realtime API
    inputTokens: 0,
    outputTokens: 0,
    costBreakdown: {
      input: {
        uncached: {
          text: 0,
          audio: 0,
        },
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
        uncached: {
          text: 0,
          audio: 0,
        },
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

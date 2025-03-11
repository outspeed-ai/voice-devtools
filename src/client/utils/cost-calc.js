/**
 * Utility functions for calculating costs based on token usage
 */

const MILLION = 1_000_000;

/**
 * Calculate the cost breakdown for a response from OpenAI
 *
 * @param {Object} usage - The usage object from the OpenAI response
 * @param {Object} costRates - The cost rates for the model
 * @returns {Object} - The calculated cost data
 */
export function calculateOpenAICosts(usage, costRates) {
  if (!usage) {
    return null;
  }

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

  let inputCostValue = 0;
  let outputCostValue = 0;

  // Calculate input costs
  if (tokenDetails.input) {
    // Text tokens
    if (tokenDetails.input.text_tokens !== undefined) {
      costBreakdown.input.text =
        (tokenDetails.input.text_tokens / MILLION) * inputCostRates.text;
      inputCostValue += costBreakdown.input.text;
    }

    // Audio tokens
    if (tokenDetails.input.audio_tokens !== undefined) {
      costBreakdown.input.audio =
        (tokenDetails.input.audio_tokens / MILLION) * inputCostRates.audio;
      inputCostValue += costBreakdown.input.audio;
    }

    // Cached tokens
    if (tokenDetails.input.cached_tokens !== undefined) {
      // Check if there's a detailed breakdown of cached tokens
      if (tokenDetails.input.cached_tokens_details) {
        // Calculate costs for cached text tokens
        if (
          tokenDetails.input.cached_tokens_details.text_tokens !== undefined
        ) {
          costBreakdown.input.cached.text =
            (tokenDetails.input.cached_tokens_details.text_tokens / MILLION) *
            inputCostRates.cached.text;
          inputCostValue += costBreakdown.input.cached.text;
        }

        // Calculate costs for cached audio tokens
        if (
          tokenDetails.input.cached_tokens_details.audio_tokens !== undefined
        ) {
          costBreakdown.input.cached.audio =
            (tokenDetails.input.cached_tokens_details.audio_tokens / MILLION) *
            inputCostRates.cached.audio;
          inputCostValue += costBreakdown.input.cached.audio;
        }
      } else {
        // If no detailed breakdown, apply text cache rate as fallback
        costBreakdown.input.cached.text =
          (tokenDetails.input.cached_tokens / MILLION) *
          inputCostRates.cached.text;
        inputCostValue += costBreakdown.input.cached.text;
      }
    }
  } else {
    // Fallback if detailed breakdown not available
    costBreakdown.input.text = (inputTokens / MILLION) * inputCostRates.text;
    inputCostValue = costBreakdown.input.text;
  }

  // Calculate output costs
  if (tokenDetails.output) {
    // Text tokens
    if (tokenDetails.output.text_tokens !== undefined) {
      costBreakdown.output.text =
        (tokenDetails.output.text_tokens / MILLION) * outputCostRates.text;
      outputCostValue += costBreakdown.output.text;
    }

    // Audio tokens
    if (tokenDetails.output.audio_tokens !== undefined) {
      costBreakdown.output.audio =
        (tokenDetails.output.audio_tokens / MILLION) * outputCostRates.audio;
      outputCostValue += costBreakdown.output.audio;
    }
  } else {
    // Fallback if detailed breakdown not available
    costBreakdown.output.text = (outputTokens / MILLION) * outputCostRates.text;
    outputCostValue = costBreakdown.output.text;
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
    timestamp: new Date().toLocaleTimeString(),
  };
}

/**
 * Update cumulative cost with the latest cost data
 *
 * @param {Object} prev - The previous cumulative cost
 * @param {Object} newCostData - The new cost data to add to the cumulative
 * @returns {Object} - The updated cumulative cost
 */
export function updateCumulativeCost(prev, newCostData) {
  if (!newCostData) {
    return prev;
  }

  const { inputTokens, outputTokens, totalCost, tokenDetails } = newCostData;

  // For the first update, use the current data directly
  if (prev.totalCost === 0) {
    return {
      ...newCostData,
      // Copy over tokenCounts if they exist, otherwise initialize them
      tokenCounts: newCostData.tokenCounts || {
        input: {
          text: tokenDetails?.input?.text_tokens || 0,
          audio: tokenDetails?.input?.audio_tokens || 0,
          cached: {
            text:
              tokenDetails?.input?.cached_tokens_details?.text_tokens ||
              tokenDetails?.input?.cached_tokens ||
              0,
            audio:
              tokenDetails?.input?.cached_tokens_details?.audio_tokens || 0,
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
        newCumulative.costBreakdown.input.cached.text +=
          costBreakdown.input.cached?.text || 0;
        newCumulative.costBreakdown.input.cached.audio +=
          costBreakdown.input.cached?.audio || 0;
      } else {
        newCumulative.costBreakdown.input.cached.text +=
          costBreakdown.input.cached || 0;
      }
    }

    // Output costs
    newCumulative.costBreakdown.output.text += costBreakdown.output?.text || 0;
    newCumulative.costBreakdown.output.audio +=
      costBreakdown.output?.audio || 0;
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
        newCumulative.tokenCounts.input.audio +=
          tokenDetails.input.audio_tokens;
      }

      // Cached tokens
      if (tokenDetails.input.cached_tokens_details) {
        // Cached text tokens
        if (
          tokenDetails.input.cached_tokens_details.text_tokens !== undefined
        ) {
          newCumulative.tokenCounts.input.cached.text +=
            tokenDetails.input.cached_tokens_details.text_tokens;
        }

        // Cached audio tokens
        if (
          tokenDetails.input.cached_tokens_details.audio_tokens !== undefined
        ) {
          newCumulative.tokenCounts.input.cached.audio +=
            tokenDetails.input.cached_tokens_details.audio_tokens;
        }
      } else if (tokenDetails.input.cached_tokens !== undefined) {
        // If no detailed breakdown, add to cached text as fallback
        newCumulative.tokenCounts.input.cached.text +=
          tokenDetails.input.cached_tokens;
      }
    }

    // Output token counts
    if (tokenDetails.output) {
      // Text tokens
      if (tokenDetails.output.text_tokens !== undefined) {
        newCumulative.tokenCounts.output.text +=
          tokenDetails.output.text_tokens;
      }

      // Audio tokens
      if (tokenDetails.output.audio_tokens !== undefined) {
        newCumulative.tokenCounts.output.audio +=
          tokenDetails.output.audio_tokens;
      }
    }
  }

  return newCumulative;
}

/**
 * Calculate time-based costs (for providers like Outspeed)
 *
 * @param {number} durationInSeconds - The session duration in seconds
 * @param {number} costPerMinute - The cost per minute
 * @returns {Object} - The calculated cost data
 */
export function calculateTimeCosts(durationInSeconds, costPerMinute) {
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
 * @returns {Object} - Initial cost state structure
 */
export function getInitialCostState() {
  return {
    inputTokens: 0,
    outputTokens: 0,
    totalCost: 0,
    durationInSeconds: 0,
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

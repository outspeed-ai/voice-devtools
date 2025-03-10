/**
 * Utility functions for calculating costs based on token usage
 */

/**
 * Calculate the cost breakdown for a response from OpenAI
 *
 * @param {Object} usage - The usage object from the OpenAI response
 * @param {Object} costRates - The cost rates for the model
 * @returns {Object} - The calculated cost data
 */
export function calculateOpenAICosts(usage, costRates) {
  if (!usage) return null;

  const { input: inputCostRates, output: outputCostRates } = costRates;

  // Get token counts
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;

  // Extract detailed token breakdown
  const tokenDetails = {
    input: usage.input_token_details || null,
    output: usage.output_token_details || null,
  };

  // Calculate detailed input costs
  let inputCostValue = 0;
  if (tokenDetails.input) {
    // Text tokens
    if (tokenDetails.input.text_tokens !== undefined) {
      inputCostValue +=
        (tokenDetails.input.text_tokens / 1000000) * inputCostRates.text;
    }

    // Audio tokens
    if (tokenDetails.input.audio_tokens !== undefined) {
      inputCostValue +=
        (tokenDetails.input.audio_tokens / 1000000) * inputCostRates.audio;
    }

    // Cached tokens
    if (tokenDetails.input.cached_tokens !== undefined) {
      // Check if there's a detailed breakdown of cached tokens
      if (tokenDetails.input.cached_tokens_details) {
        // Calculate costs for cached text tokens
        if (
          tokenDetails.input.cached_tokens_details.text_tokens !== undefined
        ) {
          inputCostValue +=
            (tokenDetails.input.cached_tokens_details.text_tokens / 1000000) *
            inputCostRates.cached.text;
        }

        // Calculate costs for cached audio tokens
        if (
          tokenDetails.input.cached_tokens_details.audio_tokens !== undefined
        ) {
          inputCostValue +=
            (tokenDetails.input.cached_tokens_details.audio_tokens / 1000000) *
            inputCostRates.cached.audio;
        }
      } else {
        // If no detailed breakdown, apply text cache rate as fallback
        inputCostValue +=
          (tokenDetails.input.cached_tokens / 1000000) *
          inputCostRates.cached.text;
      }
    }
  } else {
    // Fallback if detailed breakdown not available
    inputCostValue = (inputTokens / 1000000) * inputCostRates.text;
  }

  // Calculate detailed output costs
  let outputCostValue = 0;
  if (tokenDetails.output) {
    // Text tokens
    if (tokenDetails.output.text_tokens !== undefined) {
      outputCostValue +=
        (tokenDetails.output.text_tokens / 1000000) * outputCostRates.text;
    }

    // Audio tokens
    if (tokenDetails.output.audio_tokens !== undefined) {
      outputCostValue +=
        (tokenDetails.output.audio_tokens / 1000000) * outputCostRates.audio;
    }
  } else {
    // Fallback if detailed breakdown not available
    outputCostValue = (outputTokens / 1000000) * outputCostRates.text;
  }

  const totalCost = inputCostValue + outputCostValue;

  // Prepare cost breakdown for display
  const costBreakdown = {
    input: {
      text: tokenDetails.input?.text_tokens
        ? (tokenDetails.input.text_tokens / 1000000) * inputCostRates.text
        : 0,
      audio: tokenDetails.input?.audio_tokens
        ? (tokenDetails.input.audio_tokens / 1000000) * inputCostRates.audio
        : 0,
      cached: {
        text:
          tokenDetails.input?.cached_tokens_details?.text_tokens !== undefined
            ? (tokenDetails.input.cached_tokens_details.text_tokens / 1000000) *
              inputCostRates.cached.text
            : tokenDetails.input?.cached_tokens
            ? (tokenDetails.input.cached_tokens / 1000000) *
              inputCostRates.cached.text
            : 0,
        audio:
          tokenDetails.input?.cached_tokens_details?.audio_tokens !== undefined
            ? (tokenDetails.input.cached_tokens_details.audio_tokens /
                1000000) *
              inputCostRates.cached.audio
            : 0,
      },
    },
    output: {
      text: tokenDetails.output?.text_tokens
        ? (tokenDetails.output.text_tokens / 1000000) * outputCostRates.text
        : 0,
      audio: tokenDetails.output?.audio_tokens
        ? (tokenDetails.output.audio_tokens / 1000000) * outputCostRates.audio
        : 0,
    },
  };

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
 * @param {Object} prevCumulativeCost - The previous cumulative cost
 * @param {Object} currentCostData - The current cost data
 * @returns {Object} - The updated cumulative cost
 */
export function updateCumulativeCost(prevCumulativeCost, currentCostData) {
  if (!currentCostData) return prevCumulativeCost;

  const { inputTokens, outputTokens, totalCost } = currentCostData;

  // Calculate new cumulative costs with detailed breakdown
  const newCumulative = {
    inputTokens: prevCumulativeCost.inputTokens + inputTokens,
    outputTokens: prevCumulativeCost.outputTokens + outputTokens,
    totalCost: prevCumulativeCost.totalCost + totalCost,
    // Initialize costBreakdown if it doesn't exist yet
    costBreakdown: prevCumulativeCost.costBreakdown || {
      input: { text: 0, audio: 0, cached: { text: 0, audio: 0 } },
      output: { text: 0, audio: 0 },
    },
  };

  // Make sure costData exists and has a costBreakdown property
  const costBreakdown = currentCostData?.costBreakdown;
  if (costBreakdown) {
    // Input costs - with additional null checks
    newCumulative.costBreakdown.input.text += costBreakdown.input?.text || 0;
    newCumulative.costBreakdown.input.audio += costBreakdown.input?.audio || 0;

    // Handle the case where cached might be missing or have a different structure
    if (costBreakdown.input?.cached) {
      if (typeof costBreakdown.input.cached === "object") {
        // New structure with text/audio separation
        newCumulative.costBreakdown.input.cached.text +=
          costBreakdown.input.cached?.text || 0;
        newCumulative.costBreakdown.input.cached.audio +=
          costBreakdown.input.cached?.audio || 0;
      } else {
        // Old structure with single cached value
        newCumulative.costBreakdown.input.cached.text +=
          costBreakdown.input.cached || 0;
      }
    }

    // Output costs
    newCumulative.costBreakdown.output.text += costBreakdown.output?.text || 0;
    newCumulative.costBreakdown.output.audio +=
      costBreakdown.output?.audio || 0;
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
  };
}

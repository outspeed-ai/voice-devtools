import { useEffect, useRef, useState } from "react";

import { useModel } from "@/contexts/model";
import { calculateTimeCosts, CostState } from "@/utils/cost-calc";
import { providers } from "@src/settings";

interface CostDisplayProps {
  costState: CostState;
  sessionStartTime: number;
  isSessionActive: boolean;
}

export default function CostDisplay({ costState, sessionStartTime, isSessionActive }: CostDisplayProps) {
  const { selectedModel } = useModel();
  const [showDetails, setShowDetails] = useState(false);
  const [durationInSeconds, setDurationInSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    if (!isSessionActive) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setDurationInSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [sessionStartTime, isSessionActive]);

  // Check if this is a token-based (OpenAI) or duration-based (Outspeed) cost
  const isDurationBased = selectedModel.provider === providers.Outspeed;

  let displayData;

  if (isDurationBased) {
    if (!("perMinute" in selectedModel.cost)) {
      throw new Error("perMinute is not defined in the cost object");
    }

    const costPerMinute = selectedModel.cost.perMinute;
    const timeCosts = calculateTimeCosts(durationInSeconds, costPerMinute);

    // directly update the costState object
    costState.totalCost = timeCosts.totalCost;
    costState.costPerMinute = costPerMinute;

    // For duration-based pricing (Outspeed)
    displayData = {
      title: "Outspeed Live API Cost (Time-Based)",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      titleColor: "text-green-800",
      totalColor: "text-green-700",
    };
  } else {
    // For token-based pricing (OpenAI)
    displayData = {
      title: "Realtime API Usage Cost",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      titleColor: "text-purple-800",
      totalColor: "text-purple-700",
    };
  }

  return (
    <div className={`mb-4 p-3 ${displayData.bgColor} rounded-lg border ${displayData.borderColor}`}>
      <div className="flex justify-between items-center mb-2">
        <h4 className={`font-semibold ${displayData.titleColor}`}>{displayData.title}</h4>
        <div className="flex gap-1">
          {!isDurationBased && costState?.costBreakdown && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs px-2 py-1 rounded bg-white border border-gray-300 hover:bg-gray-50"
            >
              {showDetails ? "Hide" : "Show"} Details
            </button>
          )}
        </div>
      </div>

      <div className="text-gray-600 flex justify-between">
        Session Duration: <span>{formatDuration(durationInSeconds)}</span>
      </div>

      <div className="grid grid-cols-2 gap-1 text-sm">
        {isDurationBased ? (
          // Duration-based cost display (Outspeed)
          <>
            <div className="text-gray-600">Rate:</div>
            <div className="text-right font-medium">${costState.costPerMinute?.toFixed(2) || "0.00"}/minute</div>

            <div className="text-gray-600 font-semibold">Total Cost:</div>
            <div className={`text-right font-semibold ${displayData.totalColor}`}>
              ${costState.totalCost.toFixed(6)}
            </div>
          </>
        ) : (
          // Token-based cost display (OpenAI) - Simplified to only show total cost
          <>
            <div className="text-gray-600 font-semibold">Total Cost:</div>
            <div className={`text-right font-semibold ${displayData.totalColor}`}>
              ${costState.totalCost.toFixed(6)}
            </div>
          </>
        )}
      </div>

      {!isDurationBased && showDetails && costState?.costBreakdown && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h5 className="text-xs font-semibold text-gray-700 mb-2">Cost Breakdown</h5>

          {/* Input Tokens Section */}
          <div className="mb-3">
            <div className="flex justify-between items-center text-xs font-medium text-gray-700 mb-1">
              <div>Input Tokens:</div>
              <div>{costState.inputTokens.toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-3 gap-1 text-xs ml-2">
              <div className="text-gray-500">Type</div>
              <div className="text-gray-500 text-right">Tokens</div>
              <div className="text-gray-500 text-right">Cost ($)</div>

              <div className="text-gray-600">Uncached Text:</div>
              <div className="text-right">{costState.tokenCounts?.input?.uncached?.text?.toLocaleString() || "0"}</div>
              <div className="text-right font-medium">
                ${costState.costBreakdown.input?.uncached?.text?.toFixed(6) || "0.000000"}
              </div>

              <div className="text-gray-600">Cached Text:</div>
              <div className="text-right">{costState.tokenCounts?.input?.cached?.text?.toLocaleString() || "0"}</div>
              <div className="text-right font-medium">
                ${costState.costBreakdown.input?.cached?.text?.toFixed(6) || "0.000000"}
              </div>

              <div className="text-gray-600">Uncached Audio:</div>
              <div className="text-right">{costState.tokenCounts?.input?.uncached?.audio?.toLocaleString() || "0"}</div>
              <div className="text-right font-medium">
                ${costState.costBreakdown.input?.uncached?.audio?.toFixed(6) || "0.000000"}
              </div>

              <div className="text-gray-600">Cached Audio:</div>
              <div className="text-right">{costState.tokenCounts?.input?.cached?.audio?.toLocaleString() || "0"}</div>
              <div className="text-right font-medium">
                ${costState.costBreakdown.input?.cached?.audio?.toFixed(6) || "0.000000"}
              </div>
            </div>
          </div>

          {/* Output Tokens Section */}
          <div>
            <div className="flex justify-between items-center text-xs font-medium text-gray-700 mb-1">
              <div>Output Tokens:</div>
              <div>{costState.outputTokens.toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-3 gap-1 text-xs ml-2">
              <div className="text-gray-500">Type</div>
              <div className="text-gray-500 text-right">Tokens</div>
              <div className="text-gray-500 text-right">Cost ($)</div>

              <div className="text-gray-600">Text:</div>
              <div className="text-right">{costState.tokenCounts?.output?.text?.toLocaleString() || "0"}</div>
              <div className="text-right font-medium">
                ${costState.costBreakdown.output?.text?.toFixed(6) || "0.000000"}
              </div>

              <div className="text-gray-600">Audio:</div>
              <div className="text-right">{costState.tokenCounts?.output?.audio?.toLocaleString() || "0"}</div>
              <div className="text-right font-medium">
                ${costState.costBreakdown.output?.audio?.toFixed(6) || "0.000000"}
              </div>
            </div>
          </div>
        </div>
      )}

      {costState.timestamp && (
        <div className="text-xs text-gray-500 mt-2 text-right">Last updated: {costState.timestamp}</div>
      )}
    </div>
  );
}

// Helper function to format time
function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [hours > 0 ? `${hours}h` : null, minutes > 0 ? `${minutes}m` : null, `${remainingSeconds}s`]
    .filter(Boolean)
    .join(" ");
}

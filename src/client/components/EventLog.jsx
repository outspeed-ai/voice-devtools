import { useState } from "react";

// Helper function to format time
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [
    hours > 0 ? `${hours}h` : null,
    minutes > 0 ? `${minutes}m` : null,
    `${remainingSeconds}s`,
  ]
    .filter(Boolean)
    .join(" ");
}

function Event({ event, timestamp }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isClient = !event.server_sent;

  return (
    <div className="flex flex-col gap-2 p-2 border-b">
      <div
        className="flex items-center gap-2 cursor-pointer justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <p className="flex items-center gap-2">
          {isClient ? (
            <span className="text-[#7f5af0] text-lg">▲</span>
          ) : (
            <span className="text-[#2cb67d] text-lg">▼</span>
          )}
          {event.type}
        </p>
        <span className="text-gray-500">{timestamp}</span>
      </div>
      <div
        className={`p-2 rounded-md bg-gray-50 overflow-x-auto ${
          isExpanded ? "block" : "hidden"
        }`}
      >
        <pre className="text-xs">{JSON.stringify(event, null, 2)}</pre>
      </div>
    </div>
  );
}

function TokenDetailsDisplay({ tokenDetails }) {
  if (!tokenDetails) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <h5 className="text-xs font-semibold text-gray-700 mb-2">
        Token Breakdown
      </h5>

      {tokenDetails.input && (
        <div className="mb-2">
          <div className="text-xs font-medium text-gray-600">Input:</div>
          <div className="grid grid-cols-2 gap-1 text-xs ml-2">
            {tokenDetails.input.text_tokens !== undefined && (
              <>
                <div className="text-gray-500">Text:</div>
                <div className="text-right">
                  {tokenDetails.input.text_tokens.toLocaleString()}
                </div>
              </>
            )}
            {tokenDetails.input.audio_tokens !== undefined && (
              <>
                <div className="text-gray-500">Audio:</div>
                <div className="text-right">
                  {tokenDetails.input.audio_tokens.toLocaleString()}
                </div>
              </>
            )}
            {tokenDetails.input.cached_tokens !== undefined && (
              <>
                <div className="text-gray-500">Cached:</div>
                <div className="text-right">
                  {tokenDetails.input.cached_tokens.toLocaleString()}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tokenDetails.output && (
        <div>
          <div className="text-xs font-medium text-gray-600">Output:</div>
          <div className="grid grid-cols-2 gap-1 text-xs ml-2">
            {tokenDetails.output.text_tokens !== undefined && (
              <>
                <div className="text-gray-500">Text:</div>
                <div className="text-right">
                  {tokenDetails.output.text_tokens.toLocaleString()}
                </div>
              </>
            )}
            {tokenDetails.output.audio_tokens !== undefined && (
              <>
                <div className="text-gray-500">Audio:</div>
                <div className="text-right">
                  {tokenDetails.output.audio_tokens.toLocaleString()}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CostDisplay({ costData, cumulativeCost }) {
  const [showCumulative, setShowCumulative] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!costData && !cumulativeCost?.totalCost) return null;

  // Check if this is a token-based (OpenAI) or duration-based (Outspeed) cost
  const isDurationBased = costData && "durationInSeconds" in costData;

  let displayData;

  if (isDurationBased) {
    // For duration-based pricing (Outspeed)
    displayData = {
      title: "Session Cost (Time-Based)",
      data: costData,
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      titleColor: "text-green-800",
      totalColor: "text-green-700",
    };
  } else {
    // For token-based pricing (OpenAI)
    displayData = showCumulative
      ? {
          title: "Cumulative API Usage Cost",
          data: {
            inputTokens: cumulativeCost.inputTokens,
            outputTokens: cumulativeCost.outputTokens,
            totalCost: cumulativeCost.totalCost,
          },
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          titleColor: "text-purple-800",
          totalColor: "text-purple-700",
        }
      : {
          title: "Last Response Cost",
          data: costData,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          titleColor: "text-blue-800",
          totalColor: "text-blue-700",
        };
  }

  return (
    <div
      className={`mb-4 p-3 ${displayData.bgColor} rounded-lg border ${displayData.borderColor}`}
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className={`font-semibold ${displayData.titleColor}`}>
          {displayData.title}
        </h4>
        <div className="flex gap-1">
          {!isDurationBased && (
            <>
              {!showCumulative && costData?.tokenDetails && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs px-2 py-1 rounded bg-white border border-gray-300 hover:bg-gray-50"
                >
                  {showDetails ? "Hide" : "Show"} Details
                </button>
              )}
              <button
                onClick={() => setShowCumulative(!showCumulative)}
                className="text-xs px-2 py-1 rounded bg-white border border-gray-300 hover:bg-gray-50"
              >
                Show {showCumulative ? "Last" : "Cumulative"}
              </button>
            </>
          )}
        </div>
      </div>

      {displayData.data && (
        <div className="grid grid-cols-2 gap-1 text-sm">
          {isDurationBased ? (
            // Duration-based cost display (Outspeed)
            <>
              <div className="text-gray-600">Session Duration:</div>
              <div className="text-right font-medium">
                {formatDuration(displayData.data.durationInSeconds)}
              </div>

              <div className="text-gray-600">Rate:</div>
              <div className="text-right font-medium">
                ${displayData.data.costPerMinute.toFixed(2)}/minute
              </div>

              <div className="text-gray-600 font-semibold">Total Cost:</div>
              <div
                className={`text-right font-semibold ${displayData.totalColor}`}
              >
                ${displayData.data.totalCost.toFixed(6)}
              </div>
            </>
          ) : (
            // Token-based cost display (OpenAI)
            <>
              <div className="text-gray-600">Input Tokens:</div>
              <div className="text-right font-medium">
                {displayData.data.inputTokens.toLocaleString()}
              </div>

              <div className="text-gray-600">Output Tokens:</div>
              <div className="text-right font-medium">
                {displayData.data.outputTokens.toLocaleString()}
              </div>

              {!showCumulative && (
                <>
                  <div className="text-gray-600">Input Cost:</div>
                  <div className="text-right font-medium">
                    ${displayData.data.inputCost.toFixed(6)}
                  </div>

                  <div className="text-gray-600">Output Cost:</div>
                  <div className="text-right font-medium">
                    ${displayData.data.outputCost.toFixed(6)}
                  </div>
                </>
              )}

              <div className="text-gray-600 font-semibold">Total Cost:</div>
              <div
                className={`text-right font-semibold ${displayData.totalColor}`}
              >
                ${displayData.data.totalCost.toFixed(6)}
              </div>
            </>
          )}
        </div>
      )}

      {!isDurationBased &&
        !showCumulative &&
        showDetails &&
        costData?.tokenDetails && (
          <TokenDetailsDisplay tokenDetails={costData.tokenDetails} />
        )}

      {costData && (
        <div className="text-xs text-gray-500 mt-2 text-right">
          Last updated: {costData.timestamp}
        </div>
      )}
    </div>
  );
}

export default function EventLog({
  events,
  loadingModal = false,
  costData = null,
  cumulativeCost = null,
}) {
  const eventsToDisplay = [];
  let deltaEvents = {};

  events.forEach((event) => {
    if (event.type.endsWith("delta")) {
      if (deltaEvents[event.type]) {
        // for now just log a single event per render pass
        return;
      } else {
        deltaEvents[event.type] = event;
      }
    }

    eventsToDisplay.push(
      <Event key={event.event_id} event={event} timestamp={event.timestamp} />,
    );
  });

  return (
    <>
      <h3 className="font-semibold sticky top-0 z-10 text-base border-b bg-white p-4">
        Logs
      </h3>
      <div className="flex flex-col gap-2 overflow-x-auto p-4">
        {(costData || (cumulativeCost && cumulativeCost.totalCost > 0)) && (
          <CostDisplay costData={costData} cumulativeCost={cumulativeCost} />
        )}

        {loadingModal && (
          <div className="text-gray-500">
            loading modal to GPU. please wait a moment...
          </div>
        )}
        {!loadingModal && events.length === 0 ? (
          <div className="text-gray-500">Awaiting events...</div>
        ) : (
          eventsToDisplay
        )}
      </div>
    </>
  );
}

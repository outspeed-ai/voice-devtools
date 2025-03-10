import { useState } from "react";

import CostDisplay from "./CostDisplay";

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

export default function EventLog({
  events,
  loadingModal = false,
  costData = null,
  cumulativeCost = null,
}) {
  const eventsToDisplay = [];
  let deltaEvents = {};

  events.forEach((event, index) => {
    if (event.type.endsWith("delta")) {
      if (deltaEvents[event.type]) {
        // for now just log a single event per render pass
        return;
      } else {
        deltaEvents[event.type] = event;
      }
    }

    // Generate a unique key using event.id if available, otherwise use a unique key based on type and index
    const uniqueKey = event.id || event.event_id || `${event.type}-${index}`;

    eventsToDisplay.push(
      <Event key={uniqueKey} event={event} timestamp={event.timestamp} />,
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

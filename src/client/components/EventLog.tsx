import { useState } from "react";

import { OaiEvent } from "@/types";
import { CostState } from "@/utils/cost-calc";
import CostDisplay from "./CostDisplay";

interface EventProps {
  event: OaiEvent;
  timestamp: string;
}

const Event: React.FC<EventProps> = ({ event, timestamp }) => {
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
      <div className={`p-2 rounded-md bg-gray-50 overflow-x-auto ${isExpanded ? "block" : "hidden"}`}>
        <pre className="text-xs">{JSON.stringify(event, null, 2)}</pre>
      </div>
    </div>
  );
};

interface EventLogProps {
  events: OaiEvent[];
  loadingModel: boolean;
  costState: CostState | null;
  sessionStartTime: number | null;
  isSessionActive: boolean;
}

const EventLog: React.FC<EventLogProps> = ({
  events,
  loadingModel = false,
  costState = null,
  sessionStartTime,
  isSessionActive,
}) => {
  return (
    <div className="flex flex-col gap-2 overflow-x-auto p-4">
      {costState && events.length > 0 && sessionStartTime && (
        <CostDisplay costState={costState} sessionStartTime={sessionStartTime} isSessionActive={isSessionActive} />
      )}

      {loadingModel && <div className="text-gray-500">loading model to GPU. please wait a moment...</div>}
      {!loadingModel && events.length === 0 && <div className="text-gray-500">Awaiting events...</div>}
      {!loadingModel && events.length > 0 && (
        <>
          {events.map((event, index) => {
            // Generate a unique key using event.id if available, otherwise use a unique key based on type and index
            const uniqueKey = event.id || event.event_id || `${event.type}-${index}`;

            return <Event key={uniqueKey} event={event} timestamp={event.timestamp || "-"} />;
          })}
        </>
      )}
    </div>
  );
};

export default EventLog;

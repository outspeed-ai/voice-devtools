import { useState } from "react";
import { Download } from "react-feather";

import { useSession } from "@/contexts/session";
import { CostState } from "@/utils/cost-calc";
import { OaiEvent } from "@package";
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
        <p className="flex items-center gap-2 break-all whitespace-normal overflow-hidden">
          {isClient ? (
            <span className="text-[#7f5af0] text-lg">▲</span>
          ) : (
            <span className="text-[#2cb67d] text-lg">▼</span>
          )}
          {event.type}
        </p>
        <span className="text-gray-500 break-words whitespace-normal overflow-hidden text-sm text-right">
          {timestamp}
        </span>
      </div>
      <div className={`p-2 rounded-md bg-gray-50 overflow-x-auto ${isExpanded ? "block" : "hidden"}`}>
        <pre className="text-xs">{JSON.stringify(event, null, 2)}</pre>
      </div>
    </div>
  );
};

interface EventLogProps {
  events: OaiEvent[];
  costState: CostState | null;
  sessionStartTime: number | null;
  handleDownloadEvents: () => void;
}

const EventLog: React.FC<EventLogProps> = ({
  events,
  costState = null,
  sessionStartTime = null,
  handleDownloadEvents,
}) => {
  const { activeState } = useSession();
  const isLoading = activeState === "loading";

  return (
    <div className="h-full w-full flex flex-col gap-4 p-4">
      {isLoading && <p className="text-gray-500">loading...</p>}

      {!isLoading && events.length > 0 && costState && sessionStartTime && (
        <CostDisplay costState={costState} sessionStartTime={sessionStartTime} />
      )}

      {!isLoading && events.length > 0 && (
        <>
          <div className="flex justify-end -mt-4">
            <button
              onClick={() => handleDownloadEvents()}
              className="flex items-center gap-2 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Download size={16} />
              Download Log
            </button>
          </div>
          {events.map((event, index) => {
            // Generate a unique key using event.id if available, otherwise use a unique key based on type and index
            const uniqueKey = event.id || event.event_id || `${event.type}-${index}`;

            return <Event key={uniqueKey} event={event} timestamp={event.timestamp || "-"} />;
          })}
        </>
      )}

      {!isLoading && events.length === 0 && <p className="text-gray-500">waiting for events...</p>}
    </div>
  );
};

export default EventLog;

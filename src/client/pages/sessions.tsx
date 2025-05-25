import { useQuery } from "@tanstack/react-query";
import { formatDistanceStrict, parseISO } from "date-fns";
import { useState } from "react";

import { Alert, Button, Card } from "@/components/ui";
import Loader from "@/components/ui/Loader";
import { fetchSessions, getAudioUrl, type SessionResponse } from "@/services/api";
import { formatTimestamp } from "@/utils/date";
import { PlayCircle } from "react-feather";

export default function Sessions() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);

  const { data, isLoading, error } = useQuery({
    queryKey: ["sessions", page, pageSize],
    queryFn: () => fetchSessions({ page, pageSize }),
    refetchOnMount: "always",
  });

  const sessions = data?.sessions || [];
  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="container h-full overflow-y-auto mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Sessions ({data?.total || 0})</h1>

      {error && <Alert type="error">{error.message || "Failed to load sessions. Please try again later."}</Alert>}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      ) : (
        <>
          {sessions.length === 0 ? (
            <Alert type="info">No sessions found.</Alert>
          ) : (
            sessions.map((session) => <SessionCard key={session.id || session.config.id} session={session} />)
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={page === 1}
                  className={`mx-1 px-3 py-2 rounded-md ${
                    page === 1 ? "text-gray-400 cursor-not-allowed" : "text-teal-700 hover:bg-teal-50"
                  }`}
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={`mx-1 px-3 py-2 rounded-md ${
                    page === 1 ? "text-gray-400 cursor-not-allowed" : "text-teal-660 hover:bg-teal-50"
                  }`}
                >
                  Previous
                </button>

                <span className="mx-2 text-gray-700">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className={`mx-1 px-3 py-2 rounded-md ${
                    page === totalPages ? "text-gray-400 cursor-not-allowed" : "text-teal-700 hover:bg-teal-50"
                  }`}
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={page === totalPages}
                  className={`mx-1 px-3 py-2 rounded-md ${
                    page === totalPages ? "text-gray-400 cursor-not-allowed" : "text-teal-700 hover:bg-teal-50"
                  }`}
                >
                  Last
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface SessionCardProps {
  session: SessionResponse["sessions"][0];
}

function SessionCard({ session }: SessionCardProps) {
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadRecording = async () => {
    if (!session.recording) return;

    try {
      setIsLoading(true);
      setError(null);
      const { presigned_url } = await getAudioUrl(session.recording);
      setAudioUrl(presigned_url);
    } catch (err) {
      console.error("Failed to get audio URL:", err);
      setError("Failed to load recording");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioError = () => {
    setError("Failed to play recording");
    setAudioUrl(undefined);
  };

  return (
    <Card title={`Session ID: ${session.config.id}`} className="mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="mb-2">
            <strong className="text-gray-700">Created At:</strong>{" "}
            <span className="text-gray-900">{formatTimestamp(session.created_at)}</span>
          </p>
          <p className="mb-2">
            <strong className="text-gray-700">Model:</strong>{" "}
            <span className="text-gray-900">{session.config.model}</span>
          </p>
          <p className="mb-2">
            <strong className="text-gray-700">Modalities:</strong>{" "}
            <span className="text-gray-900">{session.config.modalities.join(", ")}</span>
          </p>
          <p className="mb-2">
            <strong className="text-gray-700">Voice:</strong>{" "}
            <span className="text-gray-900">{session.config.voice}</span>
          </p>
          <p className="mb-2">
            <strong className="text-gray-700">Turn Detection:</strong>{" "}
            <span className="text-gray-900">{session.config.turn_detection?.type || "Not specified"}</span>
          </p>
          <p className="mb-2">
            <strong className="text-gray-700">Status:</strong> <span className="text-gray-900">{session.status}</span>
          </p>
          {session.started_at && (
            <p className="mb-2">
              <strong className="text-gray-700">Started At:</strong>{" "}
              <span className="text-gray-900">{formatTimestamp(session.started_at)}</span>
            </p>
          )}
          {session.ended_at && (
            <p className="mb-2">
              <strong className="text-gray-700">Ended At:</strong>{" "}
              <span className="text-gray-900">{formatTimestamp(session.ended_at)}</span>
            </p>
          )}
        </div>
        <div>
          <p className="mb-2">
            <strong className="text-gray-700">Temperature:</strong>{" "}
            <span className="text-gray-900">{session.config.temperature}</span>
          </p>
          <p className="mb-2">
            <strong className="text-gray-700">Provider:</strong>{" "}
            <span className="text-gray-900">{session.provider}</span>
          </p>
          {session.started_at && session.ended_at && (
            <p className="mb-2">
              <strong className="text-gray-700">Duration:</strong>{" "}
              <span className="text-gray-900">
                {formatDistanceStrict(parseISO(session.started_at), parseISO(session.ended_at))}
              </span>
            </p>
          )}
        </div>
      </div>

      <div>
        <p className="mb-1">
          <strong className="text-gray-700">Instructions:</strong>
        </p>
        <div className="bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto text-sm text-gray-800 border border-gray-200 whitespace-pre-line">
          {session.config.instructions}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2">
          <strong className="text-gray-700">Recording:</strong>{" "}
          <span className="text-gray-900">
            {!session.recording ? (
              "Not available"
            ) : !audioUrl ? (
              <Button
                onClick={handleLoadRecording}
                disabled={isLoading}
                icon={<PlayCircle size={16} />}
                className="mt-2"
              >
                {isLoading ? "Loading..." : error ? "Reload Audio" : "Load Recording"}
              </Button>
            ) : null}
          </span>
        </p>

        {audioUrl && (
          <audio controls src={audioUrl} className="w-full" onError={handleAudioError}>
            Your browser does not support the audio element.
          </audio>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </Card>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";

import { Alert, Button, Card } from "@/components/ui";
import { fetchSessions } from "@/services/api";

import { formatTimestamp } from "@/utils/date";

export default function Sessions() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["sessions", page, pageSize],
    queryFn: () => fetchSessions({ page, pageSize }),
  });

  const sessions = data?.sessions || [];
  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="container h-full overflow-y-auto mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Sessions</h1>

      {error && <Alert type="error">{error.message || "Failed to load sessions. Please try again later."}</Alert>}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {sessions.length === 0 ? (
            <Alert type="info">No sessions found.</Alert>
          ) : (
            sessions.map((session) => (
              <Card key={session.id} title={`Session ID: ${session.id}`} className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2">
                      <strong className="text-gray-700">Created At:</strong>{" "}
                      <span className="text-gray-900">{formatTimestamp(session.created)}</span>
                    </p>
                    <p className="mb-2">
                      <strong className="text-gray-700">Model:</strong>{" "}
                      <span className="text-gray-900">{session.model}</span>
                    </p>
                    <p className="mb-2">
                      <strong className="text-gray-700">Modalities:</strong>{" "}
                      <span className="text-gray-900">{session.modalities.join(", ")}</span>
                    </p>
                    <p className="mb-2">
                      <strong className="text-gray-700">Voice:</strong>{" "}
                      <span className="text-gray-900">{session.voice}</span>
                    </p>
                  </div>
                  <div>
                    <p className="mb-2">
                      <strong className="text-gray-700">Temperature:</strong>{" "}
                      <span className="text-gray-900">{session.temperature}</span>
                    </p>
                    <p className="mb-2">
                      <strong className="text-gray-700">Input Audio Format:</strong>{" "}
                      <span className="text-gray-900">{session.input_audio_format}</span>
                    </p>
                    <p className="mb-2">
                      <strong className="text-gray-700">Output Audio Format:</strong>{" "}
                      <span className="text-gray-900">{session.output_audio_format}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-1">
                    <strong className="text-gray-700">Instructions:</strong>
                  </p>
                  <div className="bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto text-sm text-gray-800 border border-gray-200 whitespace-pre-line">
                    {session.instructions}
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/metrics?session_id=${session.id}`)}
                    className="hover:bg-blue-50"
                  >
                    View Metrics
                  </Button>
                </div>
              </Card>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={page === 1}
                  className={`mx-1 px-3 py-2 rounded-md ${
                    page === 1 ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={`mx-1 px-3 py-2 rounded-md ${
                    page === 1 ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50"
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
                    page === totalPages ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={page === totalPages}
                  className={`mx-1 px-3 py-2 rounded-md ${
                    page === totalPages ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50"
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

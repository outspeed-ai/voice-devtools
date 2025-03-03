import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert, Button, Card, utils } from "@/components/ui";
import { fetchSessions } from "@/services/api";

const formatTimestamp = utils.formatTimestamp;

const SessionsDashboard = () => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["sessions", page, pageSize],
    queryFn: () => fetchSessions({ page, pageSize }),
    keepPreviousData: true,
  });

  const sessions = data?.sessions || [];
  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Sessions</h1>

      {error && (
        <Alert type="error">
          {error.message || "Failed to load sessions. Please try again later."}
        </Alert>
      )}

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
              <Card key={session.id} title={`Session ID: ${session.id}`}>
                <p>
                  <strong>Created At:</strong>{" "}
                  {formatTimestamp(session.created)}
                </p>
                <p>
                  <strong>Model:</strong> {session.model}
                </p>
                <p>
                  <strong>Modalities:</strong> {session.modalities.join(", ")}
                </p>
                <p>
                  <strong>Instructions:</strong> {session.instructions}
                </p>
                <p>
                  <strong>Voice:</strong> {session.voice}
                </p>
                <p>
                  <strong>Temperature:</strong> {session.temperature}
                </p>
                <p>
                  <strong>Input Audio Format:</strong>{" "}
                  {session.input_audio_format}
                </p>
                <p>
                  <strong>Output Audio Format:</strong>{" "}
                  {session.output_audio_format}
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/metrics?session_id=${session.id}`)}
                  className="inline-block ml-auto mt-2"
                >
                  View Metrics
                </Button>
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
                    page === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={`mx-1 px-3 py-2 rounded-md ${
                    page === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-600 hover:bg-blue-50"
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
                    page === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={page === totalPages}
                  className={`mx-1 px-3 py-2 rounded-md ${
                    page === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-600 hover:bg-blue-50"
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
};

export default SessionsDashboard;

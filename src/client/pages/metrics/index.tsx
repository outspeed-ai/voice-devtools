import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Alert, Badge, Button, Card } from "@/components/ui";
import { fetchMetricsBySession } from "@/services/api";

import { formatTimestamp } from "@/utils/date";

export default function Metrics() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);

  const { data, isLoading, error } = useQuery({
    queryKey: ["metrics", sessionId, page, pageSize],
    queryFn: () => fetchMetricsBySession({ sessionId: sessionId!, page, pageSize }),
    enabled: !!sessionId,
  });

  const metrics = data?.metrics || [];
  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (!sessionId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert type="error">Session ID is required to view inference metrics.</Alert>
      </div>
    );
  }

  return (
    <div className="container h-full overflow-y-auto mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Inference Metrics for session {sessionId}</h1>

      {error && <Alert type="error">Failed to load metrics. Please try again later.</Alert>}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {metrics.length === 0 ? (
            <Alert type="info">No metrics found.</Alert>
          ) : (
            metrics.map((metric) => (
              <Card key={metric._id}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{metric.label || "Unlabeled Session"}</h2>
                    <p className="text-gray-500 text-sm">{formatTimestamp(metric.created_at)}</p>
                  </div>
                  <Badge
                    label={metric.interrupted ? "Interrupted" : "Completed"}
                    type={metric.interrupted ? "warning" : "success"}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Time to First Response</p>
                    <p className="text-lg font-medium">{metric.time_to_first_response?.toFixed(3) || "N/A"} s</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Total Generation Time</p>
                    <p className="text-lg font-medium">{metric.total_generation_time?.toFixed(3) || "N/A"} s</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Avg Inter-Response Delay</p>
                    <p className="text-lg font-medium">{metric.average_inter_response_delay?.toFixed(3) || "N/A"} s</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Total Responses</p>
                    <p className="text-lg font-medium">{metric.total_responses || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Text Responses</p>
                    <p className="text-lg font-medium">{metric.text_responses || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Audio Responses</p>
                    <p className="text-lg font-medium">{metric.audio_responses || 0}</p>
                  </div>
                </div>

                {/* Audio indicators */}
                {(metric.input_audio_s3_url || metric.output_audio_s3_url) && (
                  <div className="flex gap-2 mt-4">
                    {metric.input_audio_s3_url && <Badge label="Has Input Audio" type="success" />}
                    {metric.output_audio_s3_url && <Badge label="Has Output Audio" type="success" />}
                  </div>
                )}

                {/* Errors summary */}
                {metric.errors && metric.errors.length > 0 && (
                  <div className="mt-4">
                    <Badge label={`${metric.errors.length} Errors`} type="error" />
                  </div>
                )}

                {/* View details button */}
                <div className="mt-6 flex justify-end">
                  <Link
                    to={{
                      pathname: `/metrics/${metric._id}`,
                      search: `session_id=${sessionId}`,
                    }}
                  >
                    <Button variant="outline">
                      View Details
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Button>
                  </Link>
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

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";

import { API_BASE_URL } from "../../constants";

// Simple Button component
const Button = ({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  icon,
}) => {
  const baseClasses =
    "flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

// Card component
const Card = ({ title, children, className = "" }) => (
  <div
    className={`bg-white shadow rounded-lg overflow-hidden mb-6 ${className}`}
  >
    {title && (
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
    )}
    <div className="px-6 py-4">{children}</div>
  </div>
);

// Alert component
const Alert = ({ type = "info", children }) => {
  const typeClasses = {
    info: "bg-blue-50 text-blue-700 border-blue-200",
    error: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    success: "bg-green-50 text-green-700 border-green-200",
  };

  return (
    <div className={`p-4 mb-4 rounded-md border ${typeClasses[type]}`}>
      {children}
    </div>
  );
};

// Badge/Chip component
const Badge = ({ label, type = "default" }) => {
  const typeClasses = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeClasses[type]}`}
    >
      {label}
    </span>
  );
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) {
    return "N/A";
  }

  // If it's an ISO string, convert to a readable format
  try {
    if (typeof timestamp === "string") {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } else {
      const date = new Date(timestamp * 1000);
      return date.toLocaleString();
    }
  } catch (e) {
    return timestamp;
  }
};

const Session = ({ session }) => {
  if (!session) {
    return <p>No session data available.</p>;
  }

  return (
    <Card title="Session Details">
      <p>
        <strong>Session ID:</strong> {session.id}
      </p>
      <p>
        <strong>Created At:</strong>{" "}
        {new Date(session.created * 1000).toLocaleString()}
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
        <strong>Input Audio Format:</strong> {session.input_audio_format}
      </p>
      <p>
        <strong>Output Audio Format:</strong> {session.output_audio_format}
      </p>
    </Card>
  );
};

const MetricsDashboard = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchMetrics();
  }, [page]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/metrics/by-session/${sessionId}?page=${page}&page_size=${pageSize}`,
      );
      setMetrics(response.data.metrics);
      setTotalPages(Math.ceil(response.data.total / pageSize));
      setError(null);
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setError("Failed to load metrics. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  if (!sessionId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert type="error">
          Session ID is required to view inference metrics.
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Inference Metrics for session {sessionId}
      </h1>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
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
                    <h2 className="text-xl font-semibold">
                      {metric.label || "Unlabeled Session"}
                    </h2>
                    <p className="text-gray-500 text-sm">
                      {formatTimestamp(metric.logged_at)}
                    </p>
                  </div>
                  <Badge
                    label={metric.interrupted ? "Interrupted" : "Completed"}
                    type={metric.interrupted ? "warning" : "success"}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">
                      Time to First Response
                    </p>
                    <p className="text-lg font-medium">
                      {metric.time_to_first_response?.toFixed(3) || "N/A"} s
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">
                      Total Generation Time
                    </p>
                    <p className="text-lg font-medium">
                      {metric.total_generation_time?.toFixed(3) || "N/A"} s
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">
                      Avg Inter-Response Delay
                    </p>
                    <p className="text-lg font-medium">
                      {metric.average_inter_response_delay?.toFixed(3) || "N/A"}{" "}
                      s
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Total Responses</p>
                    <p className="text-lg font-medium">
                      {metric.total_responses || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Text Responses</p>
                    <p className="text-lg font-medium">
                      {metric.text_responses || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Audio Responses</p>
                    <p className="text-lg font-medium">
                      {metric.audio_responses || 0}
                    </p>
                  </div>
                </div>

                {/* Audio indicators */}
                {(metric.input_audio_s3_url || metric.output_audio_s3_url) && (
                  <div className="flex gap-2 mt-4">
                    {metric.input_audio_s3_url && (
                      <Badge label="Has Input Audio" type="info" />
                    )}
                    {metric.output_audio_s3_url && (
                      <Badge label="Has Output Audio" type="info" />
                    )}
                  </div>
                )}

                {/* Errors summary */}
                {metric.errors && metric.errors.length > 0 && (
                  <div className="mt-4">
                    <Badge
                      label={`${metric.errors.length} Errors`}
                      type="error"
                    />
                  </div>
                )}

                {/* View details button */}
                <div className="mt-6 flex justify-end">
                  <Link to={`/metrics/${metric._id}`}>
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

export default MetricsDashboard;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { API_BASE_URL } from "../../constants";

// Simple Button component
const Button = ({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  icon,
  className = "",
}) => {
  const baseClasses =
    "flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
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

const formatTimestamp = (timestamp) => {
  if (!timestamp) {
    return "N/A";
  }

  try {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  } catch (e) {
    return timestamp;
  }
};

const SessionsDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, [page]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/sessions?page=${page}&page_size=${pageSize}`,
      );
      setSessions(response.data.sessions);
      setTotalPages(Math.ceil(response.data.total / pageSize));
      setError(null);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Failed to load sessions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Sessions</h1>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
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

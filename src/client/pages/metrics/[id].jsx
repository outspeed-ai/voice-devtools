import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Alert, Badge, Button, Card, Table } from "@/components/ui";
import { formatTimestamp } from "@/components/ui/utils";
import { fetchMetricDetail, getAudioUrl } from "@/services/api";

export default function MetricDetail() {
  const { id } = useParams();
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRef = useRef(null);
  const [audioLoading, setAudioLoading] = useState(false);

  // Fetch metric details
  const {
    data: metric,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["metric", id],
    queryFn: () => fetchMetricDetail(id),
    enabled: !!id,
  });

  // Audio URL mutation
  const audioMutation = useMutation({
    mutationFn: getAudioUrl,
    onSuccess: (data) => {
      const presignedUrl = data.presigned_url;

      // Create or reuse audio element
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      // Set up event listeners
      audioRef.current.onended = () => {
        setPlayingAudio(null);
      };

      audioRef.current.onerror = (e) => {
        console.error("Audio playback error:", e);
        setPlayingAudio(null);
        setAudioLoading(false);
      };

      audioRef.current.oncanplaythrough = () => {
        setAudioLoading(false);
        audioRef.current.play();
      };

      // Set source and load audio
      audioRef.current.src = presignedUrl;
      audioRef.current.load();
    },
    onError: (err) => {
      console.error("Error getting audio URL:", err);
      setPlayingAudio(null);
      setAudioLoading(false);
    },
  });

  const playAudio = async (s3Url, audioId) => {
    // If already playing this audio, pause it
    if (playingAudio === audioId && audioRef.current) {
      audioRef.current.pause();
      setPlayingAudio(null);
      return;
    }

    setAudioLoading(true);
    setPlayingAudio(audioId);

    // Call the mutation
    audioMutation.mutate(s3Url);
  };

  return (
    <div className="container h-full overflow-y-auto mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <Link
          to={{
            pathname: "/metrics",
            search: metric ? `session_id=${metric.session_id}` : "",
          }}
          className="text-blue-600 hover:text-blue-800 mr-4"
        >
          ← Back to Metrics
        </Link>
        <h1 className="text-2xl font-bold">Metric Details</h1>
      </div>

      {error && (
        <Alert type="error">
          Failed to load metric details. Please try again later.
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : metric ? (
        <>
          <Card>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {metric.label || "Unlabeled Session"}
                </h2>
                <p className="text-gray-500 text-sm">
                  {formatTimestamp(metric.created_at)}
                </p>
              </div>
              <Badge
                label={metric.interrupted ? "Interrupted" : "Completed"}
                type={metric.interrupted ? "warning" : "success"}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Time to First Response</p>
                <p className="text-lg font-medium">
                  {metric.time_to_first_response?.toFixed(3) || "N/A"} s
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Total Generation Time</p>
                <p className="text-lg font-medium">
                  {metric.total_generation_time?.toFixed(3) || "N/A"} s
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">
                  Avg Inter-Response Delay
                </p>
                <p className="text-lg font-medium">
                  {metric.average_inter_response_delay?.toFixed(3) || "N/A"} s
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

            {/* Audio playback */}
            {(metric.input_audio_s3_url || metric.output_audio_s3_url) && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Audio Playback</h3>
                <div className="flex flex-wrap gap-4">
                  {metric.input_audio_s3_url && (
                    <Button
                      onClick={() =>
                        playAudio(
                          metric.input_audio_s3_url,
                          `input-${metric._id}`,
                        )
                      }
                      disabled={audioLoading}
                      icon={
                        audioLoading &&
                        playingAudio === `input-${metric._id}` ? (
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            {playingAudio === `input-${metric._id}` ? (
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            ) : (
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                              />
                            )}
                          </svg>
                        )
                      }
                    >
                      Input Audio
                    </Button>
                  )}

                  {metric.output_audio_s3_url && (
                    <Button
                      onClick={() =>
                        playAudio(
                          metric.output_audio_s3_url,
                          `output-${metric._id}`,
                        )
                      }
                      disabled={audioLoading}
                      icon={
                        audioLoading &&
                        playingAudio === `output-${metric._id}` ? (
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            {playingAudio === `output-${metric._id}` ? (
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            ) : (
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                              />
                            )}
                          </svg>
                        )
                      }
                    >
                      Output Audio
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Errors */}
            {metric.errors && metric.errors.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Errors</h3>
                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                  <ul className="list-disc pl-5 space-y-2">
                    {metric.errors.map((err, index) => (
                      <li key={index} className="text-red-700">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Response Timeline */}
            {metric.responses && metric.responses.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Response Timeline</h3>
                <Table
                  headers={[
                    "Timestamp",
                    "Delay (ms)",
                    "Type",
                    "Jitter",
                    "Text",
                  ]}
                >
                  {metric.responses.map((response, index) => {
                    const prevTimestamp =
                      index > 0
                        ? new Date(
                            metric.responses[index - 1].timestamp,
                          ).getTime()
                        : null;
                    const currentTimestamp = new Date(
                      response.timestamp,
                    ).getTime();
                    const delay = prevTimestamp
                      ? currentTimestamp - prevTimestamp
                      : null;

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTimestamp(response.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {delay !== null ? `${delay} ms` : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 flex gap-2 text-xs">
                          {response.audio && (
                            <span className="bg-blue-500 text-white px-2 py-1 rounded-md">
                              audio
                            </span>
                          )}
                          {response.text && (
                            <span className="bg-green-500 text-white px-2 py-1 rounded-md">
                              text
                            </span>
                          )}
                        </td>
                        <td>
                          {response.audio_jitter ? (
                            <span className="text-red-500">
                              {response.audio_jitter.toFixed(4)}s
                            </span>
                          ) : (
                            <span className="text-green-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {response.text || "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </Table>
              </div>
            )}
          </Card>
        </>
      ) : (
        <Alert type="error">Metric not found</Alert>
      )}
    </div>
  );
}

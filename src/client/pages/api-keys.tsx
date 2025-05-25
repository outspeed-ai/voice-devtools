import { useEffect, useState } from "react";

import ApiKeyItem from "@/components/api-keys/ApiKeyItem";
import GetApiKeyButton from "@/components/GetApiKeyButton";
import { Loader } from "@/components/ui";
import Alert from "@/components/ui/Alert";
import { ApiKeyResponse, apiKeys } from "@/services/api";

export default function ApiKeys() {
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeysList, setApiKeysList] = useState<ApiKeyResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiKeys.getAll(page);
      setApiKeysList(response.api_keys);
      setTotalPages(Math.ceil(response.total / response.page_size));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API keys. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, [page]);

  const handleDeleteApiKey = async (id: string) => {
    try {
      await apiKeys.delete(id);
      fetchApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete API key. Please try again.");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="container h-full overflow-y-auto mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Your API Keys</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          Manage your API keys for accessing the Outspeed Live API.
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      ) : apiKeysList.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-600">You don't have any API keys yet.</p>
          <GetApiKeyButton className="mx-auto mt-4" />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {apiKeysList.map((apiKey) => (
              <ApiKeyItem key={apiKey.id} apiKey={apiKey} onDelete={handleDeleteApiKey} />
            ))}
          </div>

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

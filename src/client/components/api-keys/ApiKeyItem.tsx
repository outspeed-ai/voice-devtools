import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

import { ApiKeyResponse } from "@/services/api";

interface ApiKeyItemProps {
  apiKey: ApiKeyResponse;
  onDelete: (id: string) => Promise<void>;
}

export default function ApiKeyItem({ apiKey, onDelete }: ApiKeyItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      setIsDeleting(true);
      try {
        await onDelete(apiKey.id);
        toast.success("API key deleted successfully");
      } catch (error) {
        // Error is already handled in the API client
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (utcDateString: string | null) => {
    if (!utcDateString) {
      return "Never";
    }

    try {
      const date = new Date(utcDateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-white hover:bg-gray-50 transition-colors shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{apiKey.label}</h3>
          <p className="font-mono py-1 mt-1 rounded-md text-sm text-gray-600 bg-gray-100 px-2">{apiKey.prefix}...</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors text-sm"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-700">Created: </span>
          <span className="text-gray-900">{formatDate(apiKey.created_at)}</span>
        </div>
        {/* <div>
          <span className="text-gray-700">Last used: </span>
          <span className="text-gray-900">{formatDate(apiKey.last_used)}</span>
        </div> */}
      </div>
    </div>
  );
}

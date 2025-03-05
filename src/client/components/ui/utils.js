/**
 * Format a timestamp into a human-readable date/time string
 * @param {string|number} timestamp - ISO string or Unix timestamp
 * @returns {string} Formatted date/time string
 */
export const formatTimestamp = (timestamp) => {
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

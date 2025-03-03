import { useState, useEffect } from "react";

export default function BaseUrlSelector({ onBaseUrlChange, currentBaseUrl }) {
  const [selectedOption, setSelectedOption] = useState("outspeed");
  const [customUrl, setCustomUrl] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Predefined URLs
  const urlOptions = {
    outspeed: "https://api.outspeed.com",
    openai: "https://api.openai.com",
    custom: customUrl,
  };

  // Initialize based on current URL if it exists
  useEffect(() => {
    if (currentBaseUrl) {
      // Normalize URLs for comparison to handle potential trailing slashes
      const normalizeUrl = (url) => {
        // Remove trailing slash if present for consistent comparison
        return url.replace(/\/$/, "");
      };

      // Try to match the current URL with one of our predefined options
      const matchedOption = Object.entries(urlOptions).find(
        ([key, value]) =>
          key !== "custom" &&
          normalizeUrl(value) === normalizeUrl(currentBaseUrl),
      );

      if (matchedOption) {
        setSelectedOption(matchedOption[0]);
      } else if (currentBaseUrl !== urlOptions.outspeed) {
        // Only set to custom if it's actually different from outspeed
        setSelectedOption("custom");
        setCustomUrl(currentBaseUrl);
        setShowCustomInput(true);
      } else {
        // Default to outspeed if no match and not explicitly custom
        setSelectedOption("outspeed");
        setShowCustomInput(false);
      }
    } else {
      // If no currentBaseUrl is provided, default to outspeed
      setSelectedOption("outspeed");
      setShowCustomInput(false);
    }
  }, [currentBaseUrl]);

  const handleOptionChange = (e) => {
    const option = e.target.value;
    setSelectedOption(option);

    if (option === "custom") {
      setShowCustomInput(true);
      // Don't trigger URL change until custom URL is entered
    } else {
      setShowCustomInput(false);
      onBaseUrlChange(urlOptions[option]);
    }
  };

  const handleCustomUrlChange = (e) => {
    const url = e.target.value;
    setCustomUrl(url);
  };

  const handleCustomUrlBlur = () => {
    if (customUrl && selectedOption === "custom") {
      onBaseUrlChange(customUrl);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="w-full">
        <select
          id="baseUrlSelect"
          value={selectedOption}
          onChange={handleOptionChange}
          className="p-2 border border-gray-300 rounded-md text-sm w-full"
        >
          <option value="outspeed">outspeed: api.outspeed.com</option>
          <option value="openai">openai: api.openai.com</option>
          <option value="custom">custom: enter url</option>
        </select>
      </div>

      {showCustomInput && (
        <div className="w-full mt-2">
          <label
            htmlFor="customUrl"
            className="block text-xs text-gray-600 mb-1"
          >
            Enter custom URL (including https://)
          </label>
          <input
            id="customUrl"
            type="text"
            value={customUrl}
            onChange={handleCustomUrlChange}
            onBlur={handleCustomUrlBlur}
            onKeyDown={handleKeyDown}
            placeholder="https://your-api-domain.com"
            className="p-2 border border-gray-300 rounded-md text-sm w-full"
          />
        </div>
      )}
    </div>
  );
}

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

  // Storage keys for localStorage
  const STORAGE_KEY_OPTION = "baseUrlSelector_selectedOption";
  const STORAGE_KEY_CUSTOM_URL = "baseUrlSelector_customUrl";

  // Load from localStorage on component mount
  useEffect(() => {
    try {
      // Try to load from localStorage first
      const storedOption = localStorage.getItem(STORAGE_KEY_OPTION);
      const storedCustomUrl = localStorage.getItem(STORAGE_KEY_CUSTOM_URL);

      console.log("Loading from localStorage:", {
        storedOption,
        storedCustomUrl,
      });

      if (storedOption) {
        // Set the selected option from localStorage
        setSelectedOption(storedOption);

        // If the stored option is custom, show the input field regardless of whether there's a stored URL
        if (storedOption === "custom") {
          setShowCustomInput(true);

          // Apply the custom URL if it exists
          if (storedCustomUrl) {
            setCustomUrl(storedCustomUrl);
            onBaseUrlChange(storedCustomUrl);
          }
        } else if (urlOptions[storedOption]) {
          // Apply the predefined URL
          onBaseUrlChange(urlOptions[storedOption]);
        }

        return; // Exit early if we loaded from localStorage
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    }

    // Fall back to currentBaseUrl if localStorage failed or was empty
    if (currentBaseUrl) {
      // Normalize URLs for comparison
      const normalizeUrl = (url) => url.replace(/\/$/, "");

      // Try to match with predefined options
      const matchedOption = Object.entries(urlOptions).find(
        ([key, value]) =>
          key !== "custom" &&
          normalizeUrl(value) === normalizeUrl(currentBaseUrl),
      );

      if (matchedOption) {
        setSelectedOption(matchedOption[0]);
      } else {
        // Custom URL case
        setSelectedOption("custom");
        setCustomUrl(currentBaseUrl);
        setShowCustomInput(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save selection to localStorage whenever it changes
  useEffect(() => {
    try {
      // Don't save during the initial render
      if (document.readyState === "complete") {
        console.log("Saving to localStorage:", { selectedOption, customUrl });
        localStorage.setItem(STORAGE_KEY_OPTION, selectedOption);

        if (selectedOption === "custom" && customUrl) {
          localStorage.setItem(STORAGE_KEY_CUSTOM_URL, customUrl);
        }
      }
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [selectedOption, customUrl]);

  const handleOptionChange = (e) => {
    const option = e.target.value;
    setSelectedOption(option);

    if (option === "custom") {
      setShowCustomInput(true);
      // If there's already a custom URL stored, use that
      if (customUrl) {
        onBaseUrlChange(customUrl);
      }
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
      // Explicitly save to localStorage when custom URL is confirmed
      try {
        localStorage.setItem(STORAGE_KEY_OPTION, "custom");
        localStorage.setItem(STORAGE_KEY_CUSTOM_URL, customUrl);
      } catch (error) {
        console.error("Error saving custom URL to localStorage:", error);
      }
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

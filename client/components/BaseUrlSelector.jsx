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
      const matchedOption = Object.entries(urlOptions).find(
        ([key, value]) => key !== "custom" && value === currentBaseUrl,
      );

      if (matchedOption) {
        setSelectedOption(matchedOption[0]);
      } else {
        setSelectedOption("custom");
        setCustomUrl(currentBaseUrl);
        setShowCustomInput(true);
      }
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
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
        <select
          id="baseUrlSelect"
          value={selectedOption}
          onChange={handleOptionChange}
          className="p-2 border border-gray-300 rounded-md text-sm w-full sm:w-auto"
        >
          <option value="outspeed">outspeed: https://api.outspeed.com</option>
          <option value="openai">openai: https://api.openai.com</option>
          <option value="custom">custom: enter url</option>
        </select>

        {showCustomInput && (
          <input
            type="text"
            value={customUrl}
            onChange={handleCustomUrlChange}
            onBlur={handleCustomUrlBlur}
            onKeyDown={handleKeyDown}
            placeholder="Enter custom URL (with https://)"
            className="p-2 flex-grow border border-gray-300 rounded-md text-sm w-full"
          />
        )}
      </div>
    </div>
  );
}

import { Key } from "react-feather";

import { Button } from "./ui";

import { twMerge } from "tailwind-merge";

interface GetApiKeyButtonProps {
  className?: string;
}

const GetApiKeyButton = ({ className }: GetApiKeyButtonProps) => {
  return (
    <Button
      className={twMerge("bg-teal-600 hover:bg-teal-700 transition-colors", className)}
      icon={<Key className="w-4 h-4" />}
      onClick={() => window.open("https://cal.com/outspeed/early-access", "_blank")}
    >
      Get API Key
    </Button>
  );
};

export default GetApiKeyButton;

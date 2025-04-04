import { PhoneCall, PhoneOff } from "react-feather";
import { toast } from "sonner";

import { useSession } from "@/contexts/session";
import { type SessionConfig } from "@src/model-config";
import { type Provider } from "@src/settings";
import Button from "./ui/Button";
import MuteButton from "./ui/MuteButton";

interface SessionControlsProps {
  startWebrtcSession: (provider: Provider, config: SessionConfig) => Promise<void>;
  stopWebrtcSession: () => void;
  isMuted?: boolean;
  toggleMute?: () => void;
}

const SessionControls: React.FC<SessionControlsProps> = ({
  startWebrtcSession,
  stopWebrtcSession,
  isMuted = true,
  toggleMute,
}) => {
  const { activeState, config, selectedModel } = useSession();

  const handleStartSession = async () => {
    if (activeState !== "inactive") {
      return;
    }

    const trimmedInstructions = config.instructions.trim();
    if (!trimmedInstructions) {
      toast.error("Instructions cannot be empty");
      return;
    }

    await startWebrtcSession(selectedModel.provider, config);
  };

  if (activeState === "active") {
    return (
      <div className="flex justify-center gap-2">
        {toggleMute && <MuteButton isMuted={isMuted} onToggleMute={toggleMute} />}
        <Button icon={<PhoneOff size={14} />} className="bg-red-600" onClick={stopWebrtcSession}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-center gap-2">
      <Button icon={<PhoneCall size={14} />} disabled={activeState === "loading"} onClick={handleStartSession}>
        {activeState === "loading" ? "Connecting..." : "Connect"}
      </Button>
    </div>
  );
};

export default SessionControls;

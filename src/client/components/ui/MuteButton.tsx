import { Mic, MicOff } from "react-feather";
import Button from "./Button";

interface MuteButtonProps {
  isMuted: boolean;
  onToggleMute: () => void;
  disabled?: boolean;
}

const MuteButton: React.FC<MuteButtonProps> = ({ isMuted, onToggleMute, disabled = false }) => {
  return (
    <Button
      icon={isMuted ? <MicOff size={14} /> : <Mic size={14} />}
      onClick={onToggleMute}
      disabled={disabled}
      className={isMuted ? "bg-red-600" : ""}
    >
      {isMuted ? "Unmute" : "Mute"}
    </Button>
  );
};

export default MuteButton;

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "react-feather";

// Audio player component for speech messages
const AudioPlayer = ({ src, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  const formattedDuration = duration ? Math.round(duration / 1000) : 0;
  const formattedCurrentTime = Math.round(currentTime);
  const progress = formattedDuration
    ? (formattedCurrentTime / formattedDuration) * 100
    : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(formattedDuration);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [formattedDuration]);

  const togglePlayPause = () => {
    if (!audioRef.current) {
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (currentTime >= formattedDuration) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressBarClick = (e) => {
    if (!audioRef.current || !progressBarRef.current) {
      return;
    }

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * formattedDuration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <audio ref={audioRef} src={src} className="hidden" />

      <div className="flex items-center gap-2">
        <button
          onClick={togglePlayPause}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <div className="flex-1 flex flex-col gap-1">
          <div
            ref={progressBarRef}
            onClick={handleProgressBarClick}
            className="h-2 bg-gray-300 rounded-full cursor-pointer overflow-hidden"
          >
            <div
              className="h-full bg-gray-700 transition-all duration-100"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-400 font-mono">
            <span>{formattedCurrentTime}s</span>
            <span>{formattedDuration}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;

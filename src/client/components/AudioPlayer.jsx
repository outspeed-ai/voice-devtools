import { useEffect, useRef, useState } from "react";
import { Download, Pause, Play } from "react-feather";

import { audioBufferToWav } from "@/utils/audio";

// Simplified Audio player component for AudioBuffer playback
const AudioPlayer = ({ duration, audioBuffer }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isEnded, setIsEnded] = useState(false);
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const progressBarRef = useRef(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(0);
  const offsetTimeRef = useRef(0);

  // Use actual buffer duration if available, otherwise use provided duration
  const actualDuration = audioBuffer?.duration || duration / 1000;
  const formattedDuration = actualDuration ? Math.round(actualDuration) : 0;
  const formattedCurrentTime = Math.round(currentTime);
  const progress = formattedDuration ? (formattedCurrentTime / formattedDuration) * 100 : 0;

  // Initialize AudioContext for buffer playback
  useEffect(() => {
    if (audioBuffer && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    return () => {
      safeStopPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [audioBuffer]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Update progress when playing
  useEffect(() => {
    if (isPlaying) {
      // Start a timer to update currentTime
      intervalRef.current = setInterval(() => {
        if (audioContextRef.current) {
          const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
          const newTime = offsetTimeRef.current + elapsed;

          if (newTime >= formattedDuration) {
            setCurrentTime(formattedDuration);
            setIsEnded(true);
            setIsPlaying(false);
            safeStopPlayback();
          } else {
            setCurrentTime(newTime);
          }
        }
      }, 50); // Update approximately 20 times per second
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, formattedDuration]);

  // Safely stop any active playback
  const safeStopPlayback = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only call stop if the source node exists and has been started
    if (audioSourceRef.current && isPlaying) {
      try {
        audioSourceRef.current.stop();
      } catch (err) {
        console.error("Safe cleanup: AudioNode was not playing", err);
      }
      audioSourceRef.current = null;
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      safeStopPlayback();
      setIsPlaying(false);
    } else {
      if (!audioContextRef.current || !audioBuffer) return;

      let reset = false;

      // If playback ended, reset to beginning
      if (isEnded || currentTime >= formattedDuration - 0.1) {
        reset = true;
        setCurrentTime(0);
        setIsEnded(false);
        clearInterval(intervalRef.current);
      }

      // Create new source (required for WebAudio API)
      audioSourceRef.current = audioContextRef.current.createBufferSource();
      audioSourceRef.current.buffer = audioBuffer;
      audioSourceRef.current.connect(audioContextRef.current.destination);

      // Handle playback end
      audioSourceRef.current.onended = () => {
        setIsPlaying(false);
        setIsEnded(true);
        setCurrentTime(formattedDuration);
        audioSourceRef.current = null;

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };

      // Start playback from current position
      const offsetTime = Math.min(reset ? 0 : currentTime, formattedDuration - 0.1);

      // Store references for progress tracking
      startTimeRef.current = audioContextRef.current.currentTime;
      offsetTimeRef.current = offsetTime;

      audioSourceRef.current.start(0, offsetTime);

      setIsPlaying(true);
    }
  };

  const handleProgressBarClick = (e) => {
    if (!progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;

    console.log("clickPosition", clickPosition);
    const newTime = clickPosition * formattedDuration;

    setCurrentTime(newTime);
    setIsEnded(false);

    // If currently playing, restart from new position
    if (isPlaying) {
      safeStopPlayback();
      setIsPlaying(false);
      // Use setTimeout to ensure state updates before toggling play
      // setTimeout(() => togglePlayPause(), 10);
    }
  };

  const handleDownload = () => {
    if (!audioBuffer) return;

    // Convert to WAV format
    const wav = audioBufferToWav(audioBuffer);
    const blob = new Blob([wav], { type: "audio/wav" });

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audio.wav";
    a.click();

    // Cleanup
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlayPause}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          title="Download audio"
        >
          <Download size={16} />
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

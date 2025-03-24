import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface AudioPlayerState {
  playingAudioId: string | null;
  isLoading: boolean;
  play: (audioId: string, audioUrl: string) => void;
  stop: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerState | null>(null);

interface AudioPlayerProviderProps {
  children: ReactNode;
}

export const AudioPlayerProvider = ({ children }: AudioPlayerProviderProps) => {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // init the audio element once
  useEffect(() => {
    const audioElement = new Audio();
    audioElement.id = "shared-audio-player";
    document.body.appendChild(audioElement);
    audioRef.current = audioElement;

    audioElement.onended = () => {
      setPlayingAudioId(null);
    };

    audioElement.onerror = (e) => {
      console.error("audio playback error:", e);
      setPlayingAudioId(null);
      setIsLoading(false);
      toast.error("failed to play audio");
    };

    // set isLoading to false when the audio is ready to play
    audioElement.oncanplaythrough = () => {
      setIsLoading(false);
      audioElement.play().catch((err) => {
        console.error("failed to play audio:", err);
        toast.error("failed to play audio");
        setPlayingAudioId(null);
        setIsLoading(false);
      });
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.remove();
        audioRef.current = null;
      }
    };
  }, []);

  const play = (audioId: string, audioUrl: string) => {
    try {
      const audioElement = audioRef.current;
      if (!audioElement) {
        throw new Error("Audio player not initialized");
      }

      // pause current audio
      audioElement.pause();

      // if we were already playing this audio, we don't need to do anything further
      if (playingAudioId === audioId) {
        setPlayingAudioId(null);
        return;
      }

      // otherwise start playing the new audio
      setPlayingAudioId(audioId);
      setIsLoading(true);

      // set source and load audio
      audioElement.src = audioUrl;
      audioElement.load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "failed to play audio");
      console.error("error playing audio:", err);
      setPlayingAudioId(null);
      setIsLoading(false);
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingAudioId(null);
    }
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        playingAudioId,
        isLoading,
        play,
        stop,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = (audioId: string) => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider");
  }

  const { playingAudioId, isLoading, play, stop } = context;

  const isPlaying = playingAudioId === audioId;
  const isLoadingThis = isLoading && isPlaying;

  const playAudio = (audioUrl: string) => {
    if (isPlaying) {
      stop();
    } else {
      play(audioId, audioUrl);
    }
  };

  return {
    isPlaying,
    isLoading: isLoadingThis,
    playAudio,
    stop,
  };
};

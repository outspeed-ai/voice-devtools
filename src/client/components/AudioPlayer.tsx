import { memo, useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  src: string;
}

/**
 * A wrapper around the HTML5 audio element that allows us to get the duration of the audio
 * before it is played.
 */
const AudioPlayer = memo(({ src }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [loaded, setLoaded] = useState(false);
  const playResolvedRef = useRef(false);
  const audioLoadedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // without this logic, the browser won't know the duration of the audio
  // for some reason, and it will just show 0:00 beside the audio player
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || loaded) {
      return;
    }

    const checkAudioDuration = () => {
      const { duration } = audioElement;
      if (!isNaN(duration) && duration > 0 && duration !== Infinity) {
        audioElement.removeEventListener("durationchange", checkAudioDuration);
        handleLoadComplete();
      }
    };

    // audioElement.play() returns a promise, so we need to wait for it to resolve
    // before we can pause the audio
    // https://developer.chrome.com/blog/play-request-was-interrupted
    const handleLoadComplete = () => {
      if (!playResolvedRef.current) {
        audioLoadedTimeoutRef.current = setTimeout(() => {
          handleLoadComplete();
        }, 50);
        return;
      }

      audioElement.removeEventListener("durationchange", checkAudioDuration);
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.muted = false;
      audioLoadedTimeoutRef.current = null;
      setLoaded(true);
    };

    audioElement.addEventListener("durationchange", checkAudioDuration);

    // mute the audio and start playing it to get the duration
    audioElement.muted = true;
    audioElement.play().then(() => {
      playResolvedRef.current = true;
    });

    return () => {
      audioElement.removeEventListener("durationchange", checkAudioDuration);
      if (audioLoadedTimeoutRef.current) {
        clearTimeout(audioLoadedTimeoutRef.current);
      }
    };
  }, [src, loaded]);

  return (
    <div>
      {!loaded && <span>loading audio...</span>}
      <audio ref={audioRef} src={src} controls={loaded} preload="none" />
    </div>
  );
});

export default AudioPlayer;

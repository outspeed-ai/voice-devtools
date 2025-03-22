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

  // without this logic, the browser won't know the duration of the audio
  // for some reason, and it will just show 0:00 beside the audio player
  useEffect(() => {
    if (!audioRef.current || loaded) {
      return;
    }

    const audioElement = audioRef.current;

    // mute the audio and start playing it to get the duration
    audioElement.muted = true;
    audioElement.play();

    const handleDurationChange = () => {
      if (!isNaN(audioElement.duration) && audioElement.duration > 0 && audioElement.duration !== Infinity) {
        audioElement.removeEventListener("durationchange", handleDurationChange);
        audioElement.pause();
        audioElement.currentTime = 0;
        audioElement.muted = false;
        setLoaded(true);
      }
    };

    audioElement.addEventListener("durationchange", handleDurationChange);

    return () => {
      audioElement.removeEventListener("durationchange", handleDurationChange);
    };
  }, [src, loaded]);

  return (
    <div>
      {!loaded && <span>loading audio...</span>}
      <audio ref={audioRef} src={src} controls={loaded} preload="auto" />
    </div>
  );
});

export default AudioPlayer;

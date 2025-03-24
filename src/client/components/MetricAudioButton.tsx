import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { PauseCircle, PlayCircle } from "react-feather";
import { toast } from "sonner";

import { Button } from "@/components/ui";
import { useAudioPlayer } from "@/contexts/shared-audio-player";
import { getAudioUrl } from "@/services/api";

const AUDIO_URL_EXPIRATION_TIME = 5 * 60 * 1000;

interface MetricAudioButtonProps {
  /**
   * The S3 URL of the audio to play
   */
  audioS3Url: string;

  /**
   * Label to display on the button.
   */
  label: string;
}

const MetricAudioButton: React.FC<MetricAudioButtonProps> = ({ audioS3Url, label }) => {
  const { isPlaying, isLoading, playAudio } = useAudioPlayer(audioS3Url);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const cachedAudioUrl = useRef<{ url: string; expiresAt: number } | null>(null);

  // Audio URL query
  const { refetch: fetchAudioUrl } = useQuery({
    queryKey: ["metrics-audio", audioS3Url],
    queryFn: () => getAudioUrl(audioS3Url),
    enabled: false,
  });

  const handlePlay = async () => {
    if (isPlaying) {
      // If already playing, just stop
      playAudio("");
      return;
    }

    try {
      // Check if we have a cached URL that's still valid
      let presignedUrl = cachedAudioUrl.current?.url;
      if (!presignedUrl || (cachedAudioUrl.current && Date.now() > cachedAudioUrl.current.expiresAt)) {
        setFetchingUrl(true);

        const result = await fetchAudioUrl();
        presignedUrl = result.data?.presigned_url;

        if (!presignedUrl) {
          throw new Error("No presigned URL found");
        }

        cachedAudioUrl.current = {
          url: presignedUrl,
          expiresAt: Date.now() + AUDIO_URL_EXPIRATION_TIME,
        };

        setFetchingUrl(false);
      }

      // Now play the audio with the presigned URL
      playAudio(presignedUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong while playing the audio");
      console.error("Error getting audio URL:", err);
      setFetchingUrl(false);
    }
  };

  // Combine loading states from URL fetching and audio player
  const isButtonLoading = isLoading || fetchingUrl;

  return (
    <Button
      onClick={handlePlay}
      disabled={isButtonLoading}
      aria-label={isPlaying ? "Pause audio" : "Play audio"}
      aria-pressed={isPlaying}
      icon={
        isButtonLoading ? (
          <div
            className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
            aria-hidden="true"
            data-testid="audio-loading-spinner"
          ></div>
        ) : isPlaying ? (
          <PauseCircle size={16} />
        ) : (
          <PlayCircle size={16} />
        )
      }
    >
      {label}
    </Button>
  );
};

export default MetricAudioButton;

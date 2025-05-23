import { toast } from "sonner";

import { getAudioUploadUrl, updateSession } from "@/services/api";

export const saveSessionRecording = async (activeSessionID: string, recording: { url: string; blob: Blob }) => {
  try {
    if (!activeSessionID) {
      console.error("error: session audio recorder stopped but no active session ID");
      return;
    }

    const { upload_url, s3_url } = await getAudioUploadUrl({
      fileName: "recording.wav",
      sessionId: activeSessionID,
    });

    // Upload the audio file to S3
    await fetch(upload_url, {
      method: "PUT",
      body: recording.blob,
    });

    // Update the session with the recording reference
    await updateSession(activeSessionID, {
      recording: s3_url,
      status: "completed",
    });

    return s3_url;
  } catch (error) {
    console.error("Failed to store session recording:", error);
    toast.error("Failed to store session recording");
  }
};

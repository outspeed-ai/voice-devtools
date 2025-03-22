export default class AudioRecorder {
  private mediaStream: MediaStream;
  private mediaRecorder: MediaRecorder;
  private audioChunks: Blob[] = [];
  private audioUrls: string[] = []; // audio urls for each chunk to revoke them on dispose
  private timeslice: number = 0;

  /**
   * @param mediaTrack - the media track to record
   * @param timeslice - the timeslice to record the audio in (in milliseconds). no slice if 0.
   */
  constructor(mediaTrack: MediaStreamTrack, timeslice: number = 0) {
    if (mediaTrack.kind !== "audio") {
      throw new Error("MediaTrack is not an audio track");
    }

    // create a MediaStream from the track
    this.mediaStream = new MediaStream([mediaTrack]);

    // initialize the recorder
    this.mediaRecorder = this._initRecorder();

    this.timeslice = timeslice;
  }

  private _initRecorder() {
    // Set up MediaRecorder with appropriate MIME type
    const options = { mimeType: "audio/webm" };

    let mediaRecorder: MediaRecorder;

    try {
      mediaRecorder = new MediaRecorder(this.mediaStream, options);
    } catch (e) {
      // fallback if the preferred MIME type isn't supported
      try {
        console.log("_initRecorder(): trying to use fallback");
        mediaRecorder = new MediaRecorder(this.mediaStream);
      } catch (err) {
        console.error("MediaRecorder is not supported in this browser:", err);
        throw new Error("MediaRecorder not supported");
      }
    }

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      } else {
        console.error("ondataavailable - audio chunk is empty");
      }
    };

    return mediaRecorder;
  }

  start() {
    if (this.getState() == "recording") {
      return;
    }

    this.audioChunks = [];
    this.mediaRecorder.start(this.timeslice || undefined);
  }

  /**
   * Stops the recording and returns the audio URL.
   *
   * @param duration - the duration of audio to keep (in milliseconds). if not provided, the entire audio will be returned.
   * @returns the audio URL.
   */
  stop(duration?: number): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (this.getState() !== "recording") {
        reject(new Error("Recording is not active"));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        if (this.audioChunks.length === 0) {
          reject(new Error("no audio chunks"));
          return;
        }

        try {
          const recordedBlob = new Blob(this.audioChunks, { type: "audio/webm" });
          const finalBlob = duration ? await trimAudioBlob(recordedBlob, duration) : recordedBlob;
          const url = URL.createObjectURL(finalBlob);
          this.audioUrls.push(url);
          resolve(url);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  getState() {
    return this.mediaRecorder.state;
  }

  // clean up resources
  dispose() {
    if (this.getState() === "recording") {
      this.stop();
    }

    this.audioUrls.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    this.audioUrls = [];
    this.audioChunks = [];
  }
}

async function trimAudioBlob(blob: Blob, duration: number): Promise<Blob> {
  // Create AudioContext
  const audioContext = new AudioContext();

  // Convert blob to ArrayBuffer
  const arrayBuffer = await blob.arrayBuffer();

  // Decode the audio data
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Calculate the start time based on duration
  const startTime = Math.max(0, audioBuffer.duration * 1000 - duration) / 1000;

  // Create a new buffer for the trimmed audio
  const trimmedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    Math.min(audioBuffer.length, Math.floor((duration * audioBuffer.sampleRate) / 1000)),
    audioBuffer.sampleRate,
  );

  // Copy the desired portion of the audio
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const startOffset = Math.floor(startTime * audioBuffer.sampleRate);
    trimmedBuffer.copyToChannel(audioBuffer.getChannelData(channel).slice(startOffset), channel);
  }

  // Convert AudioBuffer back to Blob
  return new Promise<Blob>((resolve) => {
    const mediaStreamDest = audioContext.createMediaStreamDestination();
    const source = audioContext.createBufferSource();
    source.buffer = trimmedBuffer;
    source.connect(mediaStreamDest);

    const mediaRecorder = new MediaRecorder(mediaStreamDest.stream);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => resolve(new Blob(chunks, { type: "audio/webm" }));

    mediaRecorder.start();
    source.start();
    source.onended = () => mediaRecorder.stop();
  });
}

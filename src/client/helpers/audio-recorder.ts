let audioContext: AudioContext | null = null;

export default class AudioRecorder {
  private mediaStream: MediaStream;
  private mediaRecorder: MediaRecorder;
  private audioChunks: Blob[] = [];
  private audioUrls: string[] = []; // audio urls for each chunk to revoke them on dispose
  private timeslice: number = 0;
  private audioContext: AudioContext;
  private mediaStreamDestination: MediaStreamAudioDestinationNode;

  /**
   * @param mediaTracks - Array of media tracks to record (example WebRTC peer connection sender & receiver)
   * @param timeslice - the timeslice to record the audio in (in milliseconds). no slice if 0.
   */
  constructor(mediaTracks: MediaStreamTrack[], timeslice: number = 0) {
    if (mediaTracks.length === 0) {
      throw new Error("at least one media track is required");
    }

    mediaTracks.forEach((track) => {
      if (track.kind !== "audio") {
        throw new Error("MediaTrack is not an audio track");
      }
    });

    /**
     * from MDN:
     * It's recommended to create one AudioContext and reuse it instead of initializing a new one each time,
     * and it's OK to use a single AudioContext for several different audio sources and pipeline concurrently.
     *
     * source: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
     *
     * hence we're using a global variable
     */
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    this.audioContext = audioContext;
    this.mediaStreamDestination = this.audioContext.createMediaStreamDestination();

    // create audio sources for each track and connect them to the destination
    mediaTracks.forEach((track) => {
      const mediaStream = new MediaStream([track]);
      const source = this.audioContext.createMediaStreamSource(mediaStream);
      source.connect(this.mediaStreamDestination);
    });

    // now we can use the combined stream for recording
    this.mediaStream = this.mediaStreamDestination.stream;

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
        console.log("_initRecorder(): trying to use fallback", e);
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
  stop(duration?: number): Promise<{ url: string; blob: Blob } | null> {
    return new Promise((resolve, reject) => {
      if (this.getState() !== "recording") {
        reject(new Error("recording is not active"));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        if (this.audioChunks.length === 0) {
          reject(new Error("no audio chunks"));
          return;
        }

        try {
          const recordedBlob = new Blob(this.audioChunks, { type: "audio/webm" });
          const finalBlob = await trimAudioBlobWav(recordedBlob, duration);
          const url = URL.createObjectURL(finalBlob);
          this.audioUrls.push(url);
          resolve({ url, blob: finalBlob });
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

/**
 * Trims an audio blob to a given duration and returns it as a WAV blob.
 *
 * @param blob - the audio blob to trim
 * @param duration - the duration to trim the audio to (in milliseconds). if not provided or is 0, the entire audio will be returned.
 * @returns the trimmed audio blob as WAV
 */
async function trimAudioBlobWav(blob: Blob, duration?: number): Promise<Blob> {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  // Convert blob to ArrayBuffer
  const arrayBuffer = await blob.arrayBuffer();

  // Decode the audio data
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  if (!duration) {
    return audioBufferToWav(audioBuffer);
  }

  // Calculate the start time based on duration
  const startTime = Math.max(0, audioBuffer.duration * 1000 - duration) / 1000;
  const startOffset = Math.floor(startTime * audioBuffer.sampleRate);

  // Create a new buffer for the trimmed audio
  const trimmedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    Math.min(audioBuffer.length, Math.floor((duration * audioBuffer.sampleRate) / 1000)),
    audioBuffer.sampleRate,
  );

  // Copy the desired portion of the audio
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    trimmedBuffer.copyToChannel(audioBuffer.getChannelData(channel).slice(startOffset), channel);
  }

  return audioBufferToWav(trimmedBuffer);
}

export function audioBufferToWav(buffer: AudioBuffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const wav = new ArrayBuffer(44 + buffer.length * blockAlign);
  const view = new DataView(wav);

  // Write WAV header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + buffer.length * blockAlign, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, buffer.length * blockAlign, true);

  // Write audio data
  const offset = 44;
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset + i * blockAlign + channel * bytesPerSample, int16, true);
    }
  }

  return new Blob([wav], { type: "audio/wav" });
}

/**
 * Writes a string to a DataView at a given offset
 * @param  view - The DataView to write to
 * @param offset - The offset to write to
 * @param string - The string to write
 */
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

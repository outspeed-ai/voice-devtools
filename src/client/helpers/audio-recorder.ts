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
  stop(duration?: number): Promise<string | null> {
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

let audioContext: AudioContext;

async function trimAudioBlob(blob: Blob, duration: number): Promise<Blob> {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  // Convert blob to ArrayBuffer
  const arrayBuffer = await blob.arrayBuffer();

  // Decode the audio data
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

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

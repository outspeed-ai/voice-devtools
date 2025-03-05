import { useState, useRef, useCallback } from "react";
import { Mic, Square } from "react-feather";
import Button from "./Button";

const SAMPLE_RATE = 16000;
const CHANNELS = 1;

export default function AudioRecorder({ sendClientEvent, isSessionActive }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: CHANNELS,
          sampleRate: SAMPLE_RATE,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Create AudioContext
      audioContextRef.current = new AudioContext({
        sampleRate: SAMPLE_RATE,
      });

      // Create MediaStreamSource
      const source = audioContextRef.current.createMediaStreamSource(stream);

      // Create ScriptProcessor for raw PCM access
      const processor = audioContextRef.current.createScriptProcessor(
        2048,
        CHANNELS,
        CHANNELS,
      );

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);

        // Convert float32 to int16
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Convert to base64
        const base64Data = btoa(
          String.fromCharCode(...new Uint8Array(pcmData.buffer)),
        );

        // Send the audio chunk
        sendClientEvent({
          type: "input_audio_buffer.append",
          audio: base64Data,
        });
      };

      // Connect the nodes
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      mediaRecorderRef.current = {
        stream,
        source,
        processor,
        stop: () => {
          processor.disconnect();
          source.disconnect();
          stream.getTracks().forEach((track) => track.stop());
          audioContextRef.current?.close();
        },
      };

      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, [sendClientEvent]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();

      // Send commit event
      sendClientEvent({
        type: "input_audio_buffer.commit",
      });

      setIsRecording(false);
    }
  }, [isRecording, sendClientEvent]);

  if (!isSessionActive) return null;

  return (
    <Button
      onClick={isRecording ? stopRecording : startRecording}
      icon={isRecording ? <Square height={16} /> : <Mic height={16} />}
      className={isRecording ? "bg-red-600" : "bg-blue-600"}
    >
      {isRecording ? "Stop Recording" : "Start Recording"}
    </Button>
  );
}

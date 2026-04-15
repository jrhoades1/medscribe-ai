"use client";

import { useEffect, useRef, useState } from "react";

type RecorderState = "idle" | "recording" | "stopped";

type Props = {
  onRecorded: (blob: Blob, mimeType: string) => void;
  disabled?: boolean;
};

export function AudioRecorder({ onRecorded, disabled }: Props) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      stopTimer();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const effectiveType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: effectiveType });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        onRecorded(blob, effectiveType);
      };

      recorder.start();
      startedAtRef.current = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 250);
      setState("recording");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Microphone access denied");
      setState("idle");
    }
  }

  function stop() {
    mediaRecorderRef.current?.stop();
    stopTimer();
    setState("stopped");
  }

  const mm = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const ss = (elapsed % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        {state !== "recording" ? (
          <button
            type="button"
            onClick={start}
            disabled={disabled}
            className="px-6 py-3 rounded-full bg-red-500 hover:bg-red-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold transition flex items-center gap-2"
          >
            <span className="w-3 h-3 rounded-full bg-white" />
            {state === "stopped" ? "Record Again" : "Start Recording"}
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="px-6 py-3 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-semibold transition flex items-center gap-2"
          >
            <span className="w-3 h-3 bg-white" />
            Stop
          </button>
        )}
        <div className="font-mono text-2xl tabular-nums text-slate-300 min-w-[5ch]">
          {mm}:{ss}
        </div>
      </div>
      {state === "recording" && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Recording…
        </div>
      )}
      {error && <div className="text-sm text-red-400">{error}</div>}
    </div>
  );
}

function pickMimeType(): string | undefined {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
      return c;
    }
  }
  return undefined;
}

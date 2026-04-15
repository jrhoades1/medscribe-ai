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
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-5">
        {state !== "recording" ? (
          <button
            type="button"
            onClick={start}
            disabled={disabled}
            className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold shadow-lg shadow-red-600/20 transition-all hover:shadow-xl disabled:shadow-none"
          >
            <span className="relative flex h-3 w-3">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
            {state === "stopped" ? "Record Again" : "Start Recording"}
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg transition-all hover:shadow-xl"
          >
            <span className="w-3 h-3 bg-white rounded-sm" />
            Stop Recording
          </button>
        )}
        <div className="font-mono text-3xl tabular-nums text-slate-900 font-semibold min-w-[5ch]">
          {mm}:{ss}
        </div>
      </div>
      {state === "recording" && (
        <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
          </span>
          Recording in progress…
        </div>
      )}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
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

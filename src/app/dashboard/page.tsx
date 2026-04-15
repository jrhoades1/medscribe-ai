"use client";

import { useState } from "react";
import Link from "next/link";
import { AudioRecorder } from "@/components/audio-recorder";
import { TranscriptView } from "@/components/transcript-view";
import { ClinicalNote } from "@/components/clinical-note";
import type { SoapNote } from "@/types/soap";

type Stage = "idle" | "transcribing" | "generating" | "done" | "error";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export default function DashboardPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [note, setNote] = useState<SoapNote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  async function handleAudio(blob: Blob, mimeType: string) {
    reset();

    if (blob.size > MAX_UPLOAD_BYTES) {
      setStage("error");
      setError(`Audio exceeds ${MAX_UPLOAD_BYTES / 1024 / 1024}MB limit`);
      return;
    }

    const url = URL.createObjectURL(blob);
    setAudioUrl(url);

    try {
      setStage("transcribing");
      const transcriptText = await transcribe(blob, mimeType);
      setTranscript(transcriptText);

      setStage("generating");
      const soap = await generateNote(transcriptText);
      setNote(soap);

      setStage("done");
    } catch (e) {
      setStage("error");
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    handleAudio(file, file.type || "audio/webm");
  }

  function reset() {
    setTranscript(null);
    setNote(null);
    setError(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  }

  const busy = stage === "transcribing" || stage === "generating";

  return (
    <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
          ← Home
        </Link>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-8 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-6 text-center">
          Capture a Consultation
        </h2>

        <AudioRecorder onRecorded={handleAudio} disabled={busy} />

        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <label className="inline-flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-200">
            <span>or upload a file</span>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              disabled={busy}
              className="block text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border file:border-slate-700 file:bg-slate-800 file:text-slate-200 file:cursor-pointer hover:file:bg-slate-700"
            />
          </label>
        </div>
      </section>

      {audioUrl && (
        <section className="mb-6">
          <audio controls src={audioUrl} className="w-full" />
        </section>
      )}

      {(stage === "transcribing" || stage === "generating") && (
        <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-center">
          <div className="inline-flex items-center gap-3 text-slate-300">
            <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            {stage === "transcribing"
              ? "Transcribing audio via Whisper…"
              : "Generating SOAP note via GPT-4o…"}
          </div>
        </div>
      )}

      {stage === "error" && error && (
        <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/30 p-5 text-red-300 text-sm">
          {error}
        </div>
      )}

      {transcript && (
        <div className="mb-6">
          <TranscriptView transcript={transcript} />
        </div>
      )}

      {note && (
        <div className="mb-6">
          <ClinicalNote note={note} />
        </div>
      )}
    </main>
  );
}

async function transcribe(blob: Blob, mimeType: string): Promise<string> {
  const ext = mimeType.includes("mp4")
    ? "mp4"
    : mimeType.includes("ogg")
      ? "ogg"
      : mimeType.includes("mpeg")
        ? "mp3"
        : "webm";
  const file = new File([blob], `recording.${ext}`, { type: mimeType });

  const formData = new FormData();
  formData.append("audio", file);

  const res = await fetch("/api/transcribe", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Transcription failed");
  return data.transcript as string;
}

async function generateNote(transcript: string): Promise<SoapNote> {
  const res = await fetch("/api/generate-note", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Note generation failed");
  return data.note as SoapNote;
}

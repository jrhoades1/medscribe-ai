"use client";

import { useState } from "react";
import Link from "next/link";
import { AudioRecorder } from "@/components/audio-recorder";
import { TranscriptView } from "@/components/transcript-view";
import { ClinicalNote } from "@/components/clinical-note";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { SoapNote } from "@/types/soap";
import type { Consultation } from "@/lib/supabase";

type Stage = "idle" | "transcribing" | "generating" | "saving" | "done" | "error";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

type Props = {
  userEmail: string;
  initialHistory: Consultation[];
};

export function DashboardClient({ userEmail, initialHistory }: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [note, setNote] = useState<SoapNote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<Consultation[]>(initialHistory);

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

      setStage("saving");
      const saved = await saveConsultation(transcriptText, soap);
      if (saved) setHistory((h) => [saved, ...h]);

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

  async function trySample() {
    try {
      const res = await fetch("/samples/sample-consultation.mp3");
      if (!res.ok) throw new Error("sample audio not available");
      const blob = await res.blob();
      handleAudio(blob, "audio/mpeg");
    } catch (e) {
      setStage("error");
      setError(e instanceof Error ? e.message : "Failed to load sample");
    }
  }

  function reset() {
    setTranscript(null);
    setNote(null);
    setError(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const busy = stage === "transcribing" || stage === "generating" || stage === "saving";

  return (
    <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Signed in as <span className="text-slate-700 font-medium">{userEmail}</span>
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/"
            className="text-slate-600 hover:text-slate-900 font-medium transition"
          >
            Home
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="text-slate-600 hover:text-slate-900 font-medium transition"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Recorder card */}
      <section className="rounded-xl border border-slate-200 bg-white p-8 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 mb-6 text-center">
          Capture a Consultation
        </h2>

        <AudioRecorder onRecorded={handleAudio} disabled={busy} />

        <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-4">
          <label className="inline-flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span>or upload a file</span>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              disabled={busy}
              className="block text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:text-slate-700 file:font-medium file:cursor-pointer hover:file:bg-slate-50 file:transition"
            />
          </label>
          <span className="hidden sm:inline text-slate-300">·</span>
          <button
            type="button"
            onClick={trySample}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-sm text-emerald-700 hover:text-emerald-800 disabled:text-slate-400 disabled:cursor-not-allowed font-medium transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            try a sample consultation
          </button>
        </div>
      </section>

      {/* Audio playback */}
      {audioUrl && (
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <audio controls src={audioUrl} className="w-full" />
        </section>
      )}

      {/* Processing state */}
      {busy && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <div className="inline-flex items-center gap-3 text-slate-700">
            <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">
              {stage === "transcribing" && "Transcribing audio via Groq Whisper…"}
              {stage === "generating" && "Generating SOAP note via Claude Sonnet 4.6…"}
              {stage === "saving" && "Saving consultation…"}
            </span>
          </div>
        </div>
      )}

      {/* Error state */}
      {stage === "error" && error && (
        <div className="mb-6 rounded-xl border-2 border-red-200 bg-red-50 p-5 text-red-900 text-sm">
          <div className="font-semibold mb-1">Something went wrong</div>
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Results */}
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

      {/* History */}
      {history.length > 0 && (
        <section className="mt-12 pt-8 border-t border-slate-200">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 mb-4">
            Recent Consultations
          </h2>
          <ul className="space-y-3">
            {history.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-xs font-medium">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                {c.clinical_note && (
                  <p className="text-slate-800 line-clamp-2">
                    <span className="text-emerald-700 font-semibold">Assessment:</span>{" "}
                    {c.clinical_note.assessment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
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

async function saveConsultation(transcript: string, note: SoapNote): Promise<Consultation | null> {
  const res = await fetch("/api/consultations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, note }),
  });
  if (!res.ok) {
    // Non-fatal — the note still displays even if persistence fails.
    return null;
  }
  const data = await res.json();
  return data.consultation as Consultation;
}

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col flex-1">
      <section className="flex flex-col items-center text-center px-6 py-24 max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          MedScribe <span className="text-emerald-400">AI</span>
        </h1>
        <p className="text-xl text-slate-300 mb-4">
          Record a patient consultation. Get a structured SOAP note in seconds.
        </p>
        <p className="text-sm text-slate-500 mb-10">
          Powered by OpenAI Whisper for transcription and GPT-4o for clinical
          note generation.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-8 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition"
        >
          Start Recording →
        </Link>
      </section>

      <section className="px-6 py-16 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-3">
          <Feature
            title="1. Record"
            body="Capture audio from your microphone or upload an existing recording."
          />
          <Feature
            title="2. Transcribe"
            body="OpenAI Whisper converts speech to text with clinical-grade accuracy."
          />
          <Feature
            title="3. Structure"
            body="GPT-4o formats the transcript into a SOAP note: Subjective, Objective, Assessment, Plan."
          />
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-slate-500 border-t border-slate-800">
        <p className="mb-2">
          Portfolio MVP · Synthetic data only ·{" "}
          <a
            href="https://github.com"
            className="underline hover:text-slate-300"
          >
            GitHub
          </a>
        </p>
        <p className="text-slate-600">
          Not intended for real PHI. See HIPAA_GOLIVE.md for production gap list.
        </p>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col">
      <h3 className="text-lg font-semibold text-emerald-400 mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{body}</p>
    </div>
  );
}

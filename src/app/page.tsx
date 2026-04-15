import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col flex-1">
      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-24 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Portfolio MVP · Open Source
        </div>
        <h1 className="text-6xl font-bold tracking-tight text-slate-900 mb-6">
          MedScribe <span className="text-emerald-600">AI</span>
        </h1>
        <p className="text-xl text-slate-700 mb-3 font-medium">
          Record a patient consultation. Get a structured SOAP note in seconds.
        </p>
        <p className="text-sm text-slate-500 mb-10 max-w-xl">
          Powered by <span className="font-semibold text-slate-700">Groq Whisper</span> for
          real-time transcription and{" "}
          <span className="font-semibold text-slate-700">Claude Sonnet 4.6</span> for
          clinical note generation.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/20 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          Start Recording
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-4">
            How It Works
          </h2>
          <p className="text-center text-2xl font-bold text-slate-900 mb-12">
            Three steps, under thirty seconds.
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            <Feature
              number="1"
              title="Record"
              body="Capture audio from your microphone or upload an existing file (mp3, m4a, webm, wav)."
            />
            <Feature
              number="2"
              title="Transcribe"
              body="Groq-hosted Whisper converts speech to text at ~10× real-time with clinical-grade accuracy."
            />
            <Feature
              number="3"
              title="Structure"
              body="Claude Sonnet 4.6 drafts a SOAP note — Subjective, Objective, Assessment, Plan — ready for clinician review."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 text-center text-sm text-slate-500 bg-slate-50 border-t border-slate-200">
        <p className="mb-2">
          Portfolio MVP · Synthetic data only ·{" "}
          <a href="https://github.com" className="text-emerald-700 hover:text-emerald-800 font-medium underline">
            GitHub
          </a>
        </p>
        <p className="text-xs text-slate-400">
          Not intended for real PHI. See <code className="text-slate-600">HIPAA_GOLIVE.md</code> for the production gap list.
        </p>
      </footer>
    </main>
  );
}

function Feature({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold text-lg mb-4">
        {number}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

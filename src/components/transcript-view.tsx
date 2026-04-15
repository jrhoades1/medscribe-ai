type Props = {
  transcript: string;
};

export function TranscriptView({ transcript }: Props) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3">
        Transcript
      </h2>
      <p className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed">
        {transcript}
      </p>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { DiagnosisCode, EMCode, SoapNote } from "@/types/soap";

type Props = {
  note: SoapNote;
};

export function ClinicalNote({ note }: Props) {
  const [edited, setEdited] = useState<SoapNote>(note);
  const [copied, setCopied] = useState(false);

  // If a new AI-generated note arrives (e.g. user records again), reset edits.
  useEffect(() => {
    setEdited(note);
  }, [note]);

  const isDirty =
    edited.subjective !== note.subjective ||
    edited.objective !== note.objective ||
    edited.assessment !== note.assessment ||
    edited.plan !== note.plan;

  const plainText = formatAsPlainText(edited);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    const blob = new Blob([plainText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soap-note-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function resetToAI() {
    setEdited(note);
  }

  function updateField(field: keyof SoapNote, value: string) {
    setEdited((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <section className="rounded-xl border-2 border-emerald-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-emerald-50 border-b border-emerald-200 gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-900">
              SOAP Clinical Note
            </h2>
            {isDirty && (
              <p className="text-xs text-emerald-700">Edited — click Reset to restore AI draft</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isDirty && (
            <button
              type="button"
              onClick={resetToAI}
              className="text-xs px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition shadow-sm"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={copyToClipboard}
            className="text-xs px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition shadow-sm"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={download}
            className="text-xs px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition shadow-sm"
          >
            Download .txt
          </button>
        </div>
      </div>

      {/* Editable sections */}
      <div className="divide-y divide-slate-200">
        <EditableSection
          label="Subjective"
          value={edited.subjective}
          onChange={(v) => updateField("subjective", v)}
        />
        <EditableSection
          label="Objective"
          value={edited.objective}
          onChange={(v) => updateField("objective", v)}
        />
        <EditableSection
          label="Assessment"
          value={edited.assessment}
          onChange={(v) => updateField("assessment", v)}
          footer={
            edited.diagnosis_codes && edited.diagnosis_codes.length > 0 ? (
              <DiagnosisCodeList codes={edited.diagnosis_codes} />
            ) : null
          }
        />
        <EditableSection
          label="Plan"
          value={edited.plan}
          onChange={(v) => updateField("plan", v)}
          footer={edited.billing_code ? <EMCodePill code={edited.billing_code} /> : null}
        />
      </div>

      {/* Footer hint */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
        Click any section to edit. A clinician must review and sign before this enters a
        medical record. Suggested codes are AI drafts — verify before billing.
      </div>
    </section>
  );
}

function DiagnosisCodeList({ codes }: { codes: DiagnosisCode[] }) {
  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
        Suggested ICD-10 Codes
      </h4>
      <ul className="flex flex-wrap gap-2">
        {codes.map((c) => (
          <li
            key={c.code}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs ${confidenceStyles(c.confidence)}`}
            title={`Confidence: ${c.confidence}`}
          >
            <span className="font-mono font-semibold">{c.code}</span>
            <span className="text-slate-700">{c.description}</span>
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              {c.confidence}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EMCodePill({ code }: { code: EMCode }) {
  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
        Suggested E/M Code
      </h4>
      <div className="inline-flex flex-col gap-1 px-4 py-3 rounded-lg border border-blue-200 bg-blue-50">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-blue-900 text-base">{code.code}</span>
          <span className="text-sm text-blue-900">{code.description}</span>
        </div>
        <p className="text-xs text-blue-800/80 italic max-w-prose">{code.rationale}</p>
      </div>
    </div>
  );
}

function confidenceStyles(confidence: DiagnosisCode["confidence"]): string {
  switch (confidence) {
    case "high":
      return "border-emerald-300 bg-emerald-50 text-emerald-900";
    case "medium":
      return "border-amber-300 bg-amber-50 text-amber-900";
    case "low":
      return "border-slate-300 bg-slate-50 text-slate-800";
  }
}

function EditableSection({
  label,
  value,
  onChange,
  footer,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  footer?: React.ReactNode;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea to fit its content.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className="px-6 py-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
        {label}
      </h3>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={1}
        className="w-full resize-none bg-transparent text-slate-900 text-base leading-relaxed font-sans outline-none focus:bg-emerald-50/50 focus:ring-2 focus:ring-emerald-200 focus:ring-offset-2 focus:ring-offset-white rounded-md -mx-1 px-1 transition-colors"
        spellCheck
      />
      {footer}
    </div>
  );
}

function formatAsPlainText(note: SoapNote): string {
  const lines: string[] = [
    "SOAP NOTE",
    "=========",
    "",
    "SUBJECTIVE",
    note.subjective,
    "",
    "OBJECTIVE",
    note.objective,
    "",
    "ASSESSMENT",
    note.assessment,
  ];

  if (note.diagnosis_codes && note.diagnosis_codes.length > 0) {
    lines.push("", "Suggested ICD-10 Codes:");
    for (const c of note.diagnosis_codes) {
      lines.push(`  - ${c.code}  ${c.description}  [${c.confidence} confidence]`);
    }
  }

  lines.push("", "PLAN", note.plan);

  if (note.billing_code) {
    lines.push(
      "",
      `Suggested E/M Code: ${note.billing_code.code}  ${note.billing_code.description}`,
      `  Rationale: ${note.billing_code.rationale}`
    );
  }

  lines.push(
    "",
    "---",
    "Generated by MedScribe AI (demo — synthetic data only)",
    "Codes are AI suggestions — verify before billing."
  );

  return lines.join("\n");
}

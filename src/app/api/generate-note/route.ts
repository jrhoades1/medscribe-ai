import { NextResponse } from "next/server";
import { getOpenAI, SOAP_SYSTEM_PROMPT } from "@/lib/openai";
import type { SoapNote } from "@/types/soap";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_TRANSCRIPT_CHARS = 60_000;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { transcript?: unknown };
    const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";

    if (!transcript) {
      return NextResponse.json({ error: "transcript is required" }, { status: 400 });
    }
    if (transcript.length > MAX_TRANSCRIPT_CHARS) {
      return NextResponse.json(
        { error: `transcript exceeds ${MAX_TRANSCRIPT_CHARS} characters` },
        { status: 413 }
      );
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SOAP_SYSTEM_PROMPT },
        { role: "user", content: `Transcript:\n\n${transcript}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "empty model response" }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "model returned invalid JSON" }, { status: 502 });
    }

    const note = coerceSoapNote(parsed);
    if (!note) {
      return NextResponse.json(
        { error: "model response missing required SOAP fields" },
        { status: 502 }
      );
    }

    return NextResponse.json({ note });
  } catch (err) {
    const message = err instanceof Error ? err.message : "note generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function coerceSoapNote(value: unknown): SoapNote | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const keys: (keyof SoapNote)[] = ["subjective", "objective", "assessment", "plan"];
  const out: Partial<SoapNote> = {};
  for (const k of keys) {
    if (typeof v[k] !== "string") return null;
    out[k] = v[k] as string;
  }
  return out as SoapNote;
}

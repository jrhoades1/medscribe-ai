import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, SOAP_SYSTEM_PROMPT } from "@/lib/anthropic";
import type { SoapNote } from "@/types/soap";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TRANSCRIPT_CHARS = 60_000;

const SoapNoteSchema = z.object({
  subjective: z.string(),
  objective: z.string(),
  assessment: z.string(),
  plan: z.string(),
});

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

    const anthropic = getAnthropic();
    const response = await anthropic.messages.parse({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: SOAP_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: `Transcript:\n\n${transcript}` },
      ],
      output_config: {
        format: zodOutputFormat(SoapNoteSchema),
      },
    });

    const note: SoapNote | null = response.parsed_output;
    if (!note) {
      return NextResponse.json(
        { error: "model returned empty or invalid SOAP note" },
        { status: 502 }
      );
    }

    return NextResponse.json({ note });
  } catch (err) {
    if (err instanceof Anthropic.BadRequestError) {
      return NextResponse.json({ error: `bad request: ${err.message}` }, { status: 400 });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "invalid anthropic api key" }, { status: 500 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "rate limited, retry shortly" }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `anthropic error: ${err.message}` }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : "note generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

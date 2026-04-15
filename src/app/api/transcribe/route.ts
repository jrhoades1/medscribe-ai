import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024; // Whisper API limit

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "audio field must be a file" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "audio file is empty" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `audio file exceeds ${MAX_BYTES / 1024 / 1024}MB limit` },
        { status: 413 }
      );
    }

    const openai = getOpenAI();
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "text",
    });

    const transcript = typeof transcription === "string" ? transcription : String(transcription);
    return NextResponse.json({ transcript });
  } catch (err) {
    const message = err instanceof Error ? err.message : "transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

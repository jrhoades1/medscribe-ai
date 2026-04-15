import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { SoapNote } from "@/types/soap";

export const runtime = "nodejs";

type PostBody = {
  transcript?: unknown;
  note?: unknown;
};

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as PostBody;
    const transcript = typeof body.transcript === "string" ? body.transcript : null;
    const note = coerceSoapNote(body.note);

    if (!transcript || !note) {
      return NextResponse.json({ error: "transcript and valid note required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("consultations")
      .insert({
        user_id: user.id,
        audio_path: null,
        transcript,
        clinical_note: note,
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "insert failed" }, { status: 500 });
    }

    return NextResponse.json({ consultation: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "consultations insert failed";
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

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { DiagnosisCode, SoapNote } from "@/types/soap";

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

  // Required string fields
  if (
    typeof v.subjective !== "string" ||
    typeof v.objective !== "string" ||
    typeof v.assessment !== "string" ||
    typeof v.plan !== "string"
  ) {
    return null;
  }

  const note: SoapNote = {
    subjective: v.subjective,
    objective: v.objective,
    assessment: v.assessment,
    plan: v.plan,
  };

  // Optional structured fields — passthrough only if well-shaped.
  if (Array.isArray(v.diagnosis_codes)) {
    const codes = v.diagnosis_codes.filter(
      (c): c is DiagnosisCode =>
        !!c &&
        typeof c === "object" &&
        typeof (c as Record<string, unknown>).code === "string" &&
        typeof (c as Record<string, unknown>).description === "string" &&
        ["high", "medium", "low"].includes(
          (c as Record<string, unknown>).confidence as string
        )
    );
    if (codes.length > 0) note.diagnosis_codes = codes;
  }

  if (v.billing_code && typeof v.billing_code === "object") {
    const bc = v.billing_code as Record<string, unknown>;
    if (
      typeof bc.code === "string" &&
      typeof bc.description === "string" &&
      typeof bc.rationale === "string"
    ) {
      note.billing_code = { code: bc.code, description: bc.description, rationale: bc.rationale };
    }
  }

  return note;
}

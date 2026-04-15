import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Consultation = {
  id: string;
  user_id: string;
  audio_path: string | null;
  transcript: string | null;
  clinical_note: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  } | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      consultations: {
        Row: Consultation;
        Insert: Omit<Consultation, "id" | "created_at">;
        Update: Partial<Omit<Consultation, "id" | "user_id" | "created_at">>;
      };
    };
  };
};

export function createServiceClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

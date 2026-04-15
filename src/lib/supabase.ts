import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

export function createBrowserClient(): SupabaseClient<Database> {
  return createClient<Database>(url, anonKey);
}

export function createServiceClient(): SupabaseClient<Database> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for server-side operations");
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

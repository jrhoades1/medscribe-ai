import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { DashboardClient } from "./dashboard-client";
import type { Consultation } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: history } = await supabase
    .from("consultations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <DashboardClient
      userEmail={user.email ?? "unknown"}
      initialHistory={(history ?? []) as Consultation[]}
    />
  );
}

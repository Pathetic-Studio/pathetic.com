// app/api/booth/credits/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ credits: null, authenticated: false });
    }

    const { data, error } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("[booth/credits] Error fetching credits:", error);
      return NextResponse.json({ credits: null, authenticated: true });
    }

    return NextResponse.json({
      credits: data?.credits ?? 0,
      authenticated: true,
    });
  } catch (err) {
    console.error("[booth/credits] Error:", err);
    return NextResponse.json({ credits: null, authenticated: false });
  }
}

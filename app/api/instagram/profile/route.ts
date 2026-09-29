import { NextResponse } from "next/server";
import { INSTAGRAM_SNAPSHOT } from "@/lib/instagram/profile";
import { readInstagram } from "@/lib/instagram/server";

export async function GET() {
  const result = await readInstagram().catch(() => null);
  return NextResponse.json(result?.profile ?? INSTAGRAM_SNAPSHOT, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}

import { NextRequest } from "next/server";
import { readInstagram } from "@/lib/instagram/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "";
  if (!/^(avatar|\d+)$/.test(id)) return new Response(null, { status: 400 });
  const feed = await readInstagram().catch(() => null);
  const url = feed?.images[id];
  if (!url) return new Response(null, { status: 404 });
  try {
    const image = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    });
    const type = image.headers.get("content-type") || "";
    if (!image.ok || !/^image\/(jpeg|png|webp|avif)(;|$)/.test(type))
      return new Response(null, { status: 502 });
    // Limit streamed bytes too; a missing Content-Length cannot bypass the cap.
    const reader = image.body?.getReader();
    if (!reader) return new Response(null, { status: 502 });
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 8 * 1024 * 1024) {
        await reader.cancel();
        return new Response(null, { status: 413 });
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return new Response(bytes, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}

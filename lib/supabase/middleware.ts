// lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (
    !request.cookies
      .getAll()
      .some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name))
  )
    return supabaseResponse;

  const controller = new AbortController();
  let acceptingCookies = true;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: controller.signal }),
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          if (!acceptingCookies) return;
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Retained for future session-refresh middleware. Bound the whole refresh,
  // including retries; protected routes must still validate their own users.
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => {
        deadline = setTimeout(() => {
          acceptingCookies = false;
          controller.abort();
          reject(new Error("Session refresh deadline exceeded"));
        }, 4000);
      }),
    ]);
  } catch {
    console.warn(
      "Session refresh unavailable; continuing to route-level authentication.",
    );
  } finally {
    acceptingCookies = false;
    clearTimeout(deadline);
  }

  return supabaseResponse;
}

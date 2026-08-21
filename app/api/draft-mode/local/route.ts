import { draftMode } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

function getLocalRedirectUrl(request: NextRequest) {
  const fallbackUrl = new URL("/", request.nextUrl.origin);
  const requestedPath = request.nextUrl.searchParams.get("path");

  if (!requestedPath) {
    return fallbackUrl;
  }

  try {
    const redirectUrl = new URL(requestedPath, request.nextUrl.origin);

    return redirectUrl.origin === request.nextUrl.origin
      ? redirectUrl
      : fallbackUrl;
  } catch {
    return fallbackUrl;
  }
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not Found", { status: 404 });
  }

  (await draftMode()).enable();

  return NextResponse.redirect(getLocalRedirectUrl(request));
}

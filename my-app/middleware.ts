import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LISTENER_APPLICANT_COOKIE } from "./app/listener/lib/constants";

export function middleware(request: NextRequest) {
  const id = request.cookies.get(LISTENER_APPLICANT_COOKIE)?.value;
  if (!id) {
    return NextResponse.redirect(new URL("/listener", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/listener/jobs/:path*"],
};

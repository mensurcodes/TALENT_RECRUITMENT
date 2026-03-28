import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { APPLICANT_SESSION_COOKIE } from "./app/applicant/lib/constants";

export function proxy(request: NextRequest) {
  const id = request.cookies.get(APPLICANT_SESSION_COOKIE)?.value;
  if (!id) {
    return NextResponse.redirect(new URL("/applicant", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/applicant/jobs/:path*"],
};

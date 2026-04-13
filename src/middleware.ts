import { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Use next-intl middleware for internationalization routing
  const response = intlMiddleware(request);

  try {
    // Update auth session via Supabase when public env vars are available.
    const sessionResponse = await updateSession(request);
    const cookiesToSet = sessionResponse.cookies.getAll();
    cookiesToSet.forEach(({ name, value, ...options }) => {
      response.cookies.set(name, value, options);
    });
  } catch (error) {
    console.warn("Skipping Supabase session update in middleware:", error);
  }

  return response;
}

export const config = {
  matcher: [
    // Next-intl expects to match the root and locales, but skipping API and standard assets
    "/",
    "/(vi|en)/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

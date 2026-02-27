import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Supabase auth for /app, /login, /signup — exclude from i18n
  if (pathname.startsWith("/app") || pathname === "/login" || pathname === "/signup") {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (pathname.startsWith("/app") && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if ((pathname === "/login" || pathname === "/signup") && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  // next-intl for marketing routes only — exclude /api, /display, /submit, /invite
  if (
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/display") &&
    !pathname.startsWith("/submit") &&
    !pathname.startsWith("/invite")
  ) {
    return intlMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|display|submit|invite|_next|_vercel|.*\\..*).*)",
    "/app/:path*",
    "/login",
    "/signup",
  ],
};

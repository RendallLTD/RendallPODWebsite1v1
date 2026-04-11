import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const protectedPaths = ["/dashboard", "/design", "/checkout"];

export async function proxy(request: NextRequest) {
  // Site-wide password gate (Basic Auth). Only active when SITE_PASSWORD env var is set.
  // Set SITE_PASSWORD in Vercel project env vars to lock the site; unset to disable.
  const sitePassword = process.env.SITE_PASSWORD;
  // Bypass Basic Auth for Stripe webhook paths — Stripe cannot send Basic Auth
  // credentials and would otherwise hit a 401. Webhook routes verify the
  // stripe-signature header for their own authentication.
  if (
    sitePassword &&
    !request.nextUrl.pathname.startsWith("/api/webhooks/")
  ) {
    const auth = request.headers.get("authorization");
    const expected = "Basic " + btoa("rendall:" + sitePassword);
    if (auth !== expected) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Rendall"' },
      });
    }
  }

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

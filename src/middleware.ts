import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, let requests through (dev fallback)
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { session } } = await supabase.auth.getSession();

  // If no session, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify the user is an operations user
  const { data: opUser } = await supabase
    .from('operations_users')
    .select('status')
    .eq('id', session.user.id)
    .single();

  if (!opUser) {
    // Not an operations user — clear session and redirect
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (opUser.status !== 'Active') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes — including /api/setup)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - setup (one-time Super Admin creation — public until first account is created)
     * - login, forgot-password, reset-password, change-password (auth pages)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|setup|login|forgot-password|reset-password|change-password).*)',
  ],
};

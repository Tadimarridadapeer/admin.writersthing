import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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

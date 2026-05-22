import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const NURSE_ALLOWED = ['/log', '/recap', '/profile'];

export function middleware(request: NextRequest) {
  const role = request.cookies.get('role')?.value;
  const { pathname } = request.nextUrl;

  // Pages publiques toujours autorisées
  if (pathname.startsWith('/login') || pathname === '/') {
    return NextResponse.next();
  }

  if (role === 'puer') {
    const allowed = NURSE_ALLOWED.some((p) => pathname.startsWith(p));
    if (!allowed) {
      return NextResponse.redirect(new URL('/log', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)'],
};

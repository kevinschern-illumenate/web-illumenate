import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require authentication
const protectedPaths = ['/dashboard'];

// Paths that should redirect to dashboard if already authenticated
const authPaths = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for Frappe session cookie (sid)
  const sessionCookie = request.cookies.get('sid');
  const isAuthenticated = sessionCookie && sessionCookie.value && sessionCookie.value !== 'Guest';
  
  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  // Check if the current path is an auth path
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));
  
  // Redirect unauthenticated users trying to access protected routes to login
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect authenticated users trying to access auth pages to dashboard
  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

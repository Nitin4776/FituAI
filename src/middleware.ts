import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const isPublicPage = pathname === '/signin' || pathname === '/signup';

  // If no session and trying to access a protected route, redirect to signin
  if (!session && !isPublicPage) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }
  
  // If there is a session and the user is on a public page, redirect to dashboard
  if (session && isPublicPage) {
      return NextResponse.redirect(new URL('/', request.url));
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

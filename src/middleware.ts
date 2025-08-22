import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initFirebaseAdminApp } from '@/lib/firebase.server';
import { getAuth } from 'firebase-admin/auth';

async function verifySessionCookie(sessionCookie: string) {
  initFirebaseAdminApp();
  try {
    await getAuth().verifySessionCookie(sessionCookie, true);
    return true;
  } catch (error) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const isPublicPage = ['/signin', '/signup'].includes(pathname);

  if (!session) {
    if (isPublicPage) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  const isValidSession = await verifySessionCookie(session);

  if (!isValidSession) {
     if (isPublicPage) {
      return NextResponse.next();
    }
    // Delete the invalid cookie and redirect to signin
    const response = NextResponse.redirect(new URL('/signin', request.url));
    response.cookies.delete('session');
    return response;
  }
  
  if (isPublicPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth/session (our session API)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth/session).*)',
  ],
};

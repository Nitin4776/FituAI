import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let the client-side AuthProvider handle redirects for pages.
  // The middleware shouldn't redirect page requests to avoid conflicts with client-side routing.
  if (pathname.startsWith('/api/')) {
    const session = request.cookies.get('session')?.value;
    if (!session) {
      // You can add API route protection here if needed in the future
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
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
     * - the pages themselves
     */
    '/((?!_next/static|_next/image|favicon.ico|signin|signup|).*)',
  ],
};

import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import {initFirebaseAdminApp} from '@/lib/firebase.server';
import {getAuth} from 'firebase-admin/auth';
import {cookies} from 'next/headers';

// This is the endpoint that will be called by the client to set the session cookie.
// It takes an ID token from the client, verifies it, and then creates a session cookie.
export async function POST(request: NextRequest) {
  initFirebaseAdminApp();
  const {idToken} = await request.json();
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const sessionCookie = await getAuth().createSessionCookie(idToken, {
      expiresIn,
    });
    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
    });
    return NextResponse.json({status: 'success'});
  } catch (error) {
    return NextResponse.json({status: 'error'}, {status: 401});
  }
}

// This endpoint clears the session cookie.
export async function DELETE() {
  cookies().delete('session');
  return NextResponse.json({status: 'success'});
}

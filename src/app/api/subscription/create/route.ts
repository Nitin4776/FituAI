
import { NextResponse, type NextRequest } from 'next/server';
import { initFirebaseAdminApp, auth as adminAuth, db } from '@/lib/firebase.server';
import { cookies } from 'next/headers';

initFirebaseAdminApp();

export async function POST(request: NextRequest) {
  const { planId, returnUrl } = await request.json();

  if (!planId) {
    return NextResponse.json({ error: "planId is required" }, { status: 400 });
  }

  try {
    const sessionCookie = cookies().get("session")?.value || "";
    if (!sessionCookie) {
        return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    const decodedToken = await adminAuth().verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;
    
    const userDocRef = await db().collection('users').doc(userId).get();
    if (!userDocRef.exists) {
        return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }
    const userData = userDocRef.data();

    if (!userData || !userData.name || !userData.email || !userData.phoneNumber) {
        return NextResponse.json({ error: "User profile is incomplete. Please provide name, email, and phone number." }, { status: 400 });
    }

    const subscriptionId = `sub_${userId}_${Date.now()}`;
    const apiBaseUrl = 'https://sandbox.cashfree.com/pg';

    const response = await fetch(`${apiBaseUrl}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_APP_ID!,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
        "x-api-version": "2023-08-01"
      },
      body: JSON.stringify({
        subscription_id: subscriptionId,
        plan_id: planId,
        customer_details: {
            customer_id: userId,
            customer_name: userData.name,
            customer_email: userData.email,
            customer_phone: userData.phoneNumber.replace('+', ''),
        },
        subscription_meta: {
            return_url: returnUrl
        }
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'Failed to create subscription with Cashfree');
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Cashfree subscription creation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

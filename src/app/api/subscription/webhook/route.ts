
import { NextResponse, type NextRequest } from 'next/server';
import { updateUserSubscription } from '@/services/firestore.server';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    console.log("Received webhook event:", JSON.stringify(event, null, 2));

    if (event.type === 'SUBSCRIPTION.STATUS_UPDATE') {
      const sub = event.data.subscription;
      const userId = sub.customer_details.customer_id;
      const planId = sub.plan_id;
      const status = sub.subscription_status;
      const subId = sub.subscription_id;
      const nextPaymentDate = sub.subscription_next_payment_date ? Timestamp.fromDate(new Date(sub.subscription_next_payment_date)) : undefined;

      await updateUserSubscription(userId, {
        plan: planId,
        status: status,
        subscriptionId: subId,
        nextPaymentDate: nextPaymentDate,
      });

      console.log(`Successfully updated subscription for user ${userId} to status ${status}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: 'Webhook processing failed', details: error.message }, { status: 500 });
  }
}

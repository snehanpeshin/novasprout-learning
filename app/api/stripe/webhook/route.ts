import { NextResponse } from "next/server";
import { savePayment, upsertSubscription } from "../../../lib/supabase";
import { verifyStripeSignature } from "../../../lib/stripe";

export const runtime = "nodejs";

type StripeEvent = {
  created: number;
  data: {
    object: StripeCheckoutSession | StripeSubscription;
  };
  type: string;
};

type StripeCheckoutSession = {
  amount_total?: number;
  currency?: string;
  customer?: string;
  customer_details?: {
    email?: string;
    name?: string;
  };
  id: string;
  metadata?: {
    dba_name?: string;
    product_name?: string;
  };
};

type StripeSubscription = {
  current_period_end?: number;
  current_period_start?: number;
  customer?: string;
  id: string;
  metadata?: {
    customer_email?: string;
    customer_name?: string;
    dba_name?: string;
    product_name?: string;
  };
  status: string;
};

function dateFromUnix(timestamp?: number) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
  }

  const payload = await request.text();
  const signatureHeader = request.headers.get("stripe-signature");

  if (!verifyStripeSignature({ payload, secret: webhookSecret, signatureHeader })) {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as StripeCheckoutSession;
      await savePayment({
        amount: (session.amount_total ?? 0) / 100,
        currency: session.currency ?? "usd",
        customer_email: session.customer_details?.email ?? null,
        customer_name: session.customer_details?.name ?? null,
        dba_name: session.metadata?.dba_name ?? "NovaSprout Learning",
        payment_date: new Date(event.created * 1000).toISOString(),
        product_name: session.metadata?.product_name ?? "NovaSprout Learning checkout",
        stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
        stripe_session_id: session.id
      });
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as StripeSubscription;
      await upsertSubscription({
        current_period_end: dateFromUnix(subscription.current_period_end),
        current_period_start: dateFromUnix(subscription.current_period_start),
        customer_email: subscription.metadata?.customer_email ?? null,
        customer_name: subscription.metadata?.customer_name ?? null,
        dba_name: subscription.metadata?.dba_name ?? "NovaSprout Learning",
        product_name: subscription.metadata?.product_name ?? "NovaSprout Learning monthly subscription",
        status: subscription.status,
        stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : null,
        stripe_subscription_id: subscription.id
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

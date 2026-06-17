import { NextResponse } from "next/server";
import { CheckoutProductKey, createCheckoutSession } from "../../../lib/stripe";

export const runtime = "nodejs";

const allowedProductKeys = new Set<CheckoutProductKey>(["tutoring_session", "monthly_subscription"]);

export async function POST(request: Request) {
  try {
    const { productKey } = (await request.json()) as { productKey?: CheckoutProductKey };

    if (!productKey || !allowedProductKeys.has(productKey)) {
      return NextResponse.json({ error: "Invalid productKey" }, { status: 400 });
    }

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const session = await createCheckoutSession({ origin, productKey });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
  }
}

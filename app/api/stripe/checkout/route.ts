import { NextResponse } from "next/server.js";
import { CheckoutProductKey, createCheckoutSession } from "../../../lib/stripe.ts";

import crypto from "node:crypto";
import { checkoutCookie, pendingCookie, hash, trustedOrigin, usedBudget } from "../../../lib/webAiAccess.ts";

export const runtime = "nodejs";

const allowedProductKeys = new Set<CheckoutProductKey>(["tutoring_session", "monthly_subscription", "ai_lesson", "ai_subscription"]);

export async function POST(request: Request) {
  try {
    const { productKey } = (await request.json()) as { productKey?: CheckoutProductKey };

    if (!productKey || !allowedProductKeys.has(productKey)) {
      return NextResponse.json({ error: "Invalid productKey" }, { status: 400 });
    }

    const origin = trustedOrigin(request);
    if (productKey === "ai_lesson" || productKey === "ai_subscription") await usedBudget("web:health");
    const nonce = crypto.randomBytes(32).toString("base64url");
    const session = await createCheckoutSession({ origin, productKey, browserNonce: hash(nonce) });
    const response = NextResponse.json({ id: session.id, url: session.url }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(pendingCookie, session.id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 86400 });
    response.cookies.set(checkoutCookie, nonce, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 86400 });
    return response;
  } catch (error) {
    console.error("[stripe] Checkout is unavailable.");
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
  }
}

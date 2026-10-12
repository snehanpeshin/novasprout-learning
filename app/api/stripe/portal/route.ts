import { NextResponse } from "next/server";
import { stripeRequest, trustedOrigin, webProof } from "../../../lib/webAiAccess.ts";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const origin = trustedOrigin(request);
    const proof = webProof(request);
    if (!proof?.sessionId) return NextResponse.json({ error: "Restore your paid access first." }, { status: 401 });
    const session = await stripeRequest(`checkout/sessions/${encodeURIComponent(proof.sessionId)}`);
    if (!session.customer) return NextResponse.json({ error: "No billing account found." }, { status: 404 });
    const body = new URLSearchParams({ customer: session.customer, return_url: `${origin}/ai-lesson-generator` });
    if (process.env.STRIPE_NOVASPROUT_AI_PORTAL_CONFIGURATION_ID) body.set("configuration", process.env.STRIPE_NOVASPROUT_AI_PORTAL_CONFIGURATION_ID);
    const portal = await stripeRequest("billing_portal/sessions", body);
    return NextResponse.json({ url: portal.url }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Billing is temporarily unavailable." }, { status: 503 }); }
}

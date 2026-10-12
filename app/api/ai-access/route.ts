import { NextResponse } from "next/server.js";
import { accessCookie, checkoutCookie, pendingCookie, cookie, getWebAccess, hash, signClaims, stripeRequest, trustedOrigin, usedBudget, verifyClaims, verifyPaidSession } from "../../lib/webAiAccess.ts";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    let access = await getWebAccess(request);
    let activatedToken = "";
    if (!access && cookie(request, pendingCookie) && cookie(request, checkoutCookie)) {
      const verified = await verifyPaidSession(cookie(request, pendingCookie));
      if (verified && hash(cookie(request, checkoutCookie)) === verified.session.metadata?.browser_nonce) {
        access = verified.access;
        activatedToken = signClaims({ kind: "web", sessionId: access.sessionId, exp: Date.now() + 365 * 86400000 });
      }
    }
    if (!access) return NextResponse.json({ active: false }, { headers: { "Cache-Control": "no-store" } });
    const response = NextResponse.json({ active: true, plan: access.plan, remaining: Math.max(0, access.limit - await usedBudget(access.budgetKey)), renewalDate: access.plan === "monthly" ? new Date(access.expiresAt).toISOString() : null, recoveryCode: activatedToken || cookie(request, accessCookie) }, { headers: { "Cache-Control": "no-store" } });
    if (activatedToken) {
      response.cookies.set(accessCookie, activatedToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 365 * 86400 });
      response.cookies.delete(checkoutCookie); response.cookies.delete(pendingCookie);
    }
    return response;
  } catch { return NextResponse.json({ error: "Could not verify paid access. Please try again." }, { status: 503 }); }
}
export async function POST(request: Request) {
  try {
    trustedOrigin(request);
    const body = await request.json();
    let sessionId: string;
    if (typeof body.recoveryCode === "string") {
      const proof = verifyClaims(body.recoveryCode, "web");
      if (!proof?.sessionId) return NextResponse.json({ error: "This access code is invalid or expired." }, { status: 401 });
      sessionId = proof.sessionId;
    } else {
      sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    }
    const verified = await verifyPaidSession(sessionId);
    if (!verified) return NextResponse.json({ error: "Payment is not complete, or this purchase is no longer active." }, { status: 402 });
    if (!body.recoveryCode) {
      const nonce = cookie(request, checkoutCookie);
      if (!nonce || hash(nonce) !== verified.session.metadata?.browser_nonce) return NextResponse.json({ error: "Return to the browser where you started checkout, or restore your private access code." }, { status: 401 });
    }
    const token = signClaims({ kind: "web", sessionId, exp: Date.now() + 365 * 86400000 });
    const response = NextResponse.json({ active: true, plan: verified.access.plan }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(accessCookie, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 365 * 86400 });
    response.cookies.delete(checkoutCookie); response.cookies.delete(pendingCookie);
    return response;
  } catch { return NextResponse.json({ error: "Could not activate access. Please try again or contact support." }, { status: 503 }); }
}

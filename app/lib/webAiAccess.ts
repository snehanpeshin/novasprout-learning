import crypto from "node:crypto";
import { takeBudget } from "./usageStore.ts";
export { takeBudget, usedBudget, releaseBudget, refundFailedResponse } from "./usageStore.ts";

export const accessCookie = "ns_ai_access";
export const checkoutCookie = "ns_ai_checkout";
export const pendingCookie = "ns_ai_pending";
type Claims = { kind: "web" | "lesson"; exp: number; sessionId?: string; owner?: string; responseId?: string };
export type WebAccess = { owner: string; sessionId: string; customer: string; subscription?: string; plan: "lesson" | "monthly"; budgetKey: string; limit: number; expiresAt: number };

export function hash(value: string) { return crypto.createHash("sha256").update(value).digest("hex"); }
function secret() {
  const value = process.env.AI_WEB_ACCESS_SECRET?.trim();
  if (!value || value.length < 32) throw new Error("Paid access is not configured.");
  return value;
}
export function signClaims(claims: Claims) {
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `ns1.${body}.${signature}`;
}
export function verifyClaims(token: string, kind: Claims["kind"]): Claims | null {
  try {
    const [prefix, body, signature, extra] = token.split(".");
    if (prefix !== "ns1" || !body || !signature || extra || token.length > 2000) return null;
    const expected = crypto.createHmac("sha256", secret()).update(body).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
    const claims = JSON.parse(Buffer.from(body, "base64url").toString()) as Claims;
    return claims.kind === kind && Number.isFinite(claims.exp) && claims.exp > Date.now() ? claims : null;
  } catch { return null; }
}
export function cookie(request: Request, name: string) {
  try {
    const part = request.headers.get("cookie")?.split(";").map(p => p.trim()).find(p => p.startsWith(`${name}=`));
    return part ? decodeURIComponent(part.slice(name.length + 1)) : "";
  } catch { return ""; }
}
export function webProof(request: Request) {
  const header = request.headers.get("x-ai-access-token")?.trim() || "";
  return verifyClaims(header.startsWith("ns1.") ? header : cookie(request, accessCookie), "web");
}
export function requestOwner(request: Request) {
  const proof = webProof(request);
  return hash(proof?.sessionId ? `web:${proof.sessionId}` : request.headers.get("x-apple-transaction-jws")?.trim() || request.headers.get("x-ai-access-token")?.trim() || "unauthenticated");
}
export function trustedOrigin(request: Request) {
  const canonical = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.novasproutlearning.com");
  const allowed = new Set([canonical.origin, `https://${canonical.hostname.replace(/^www\./, "")}`, `https://www.${canonical.hostname.replace(/^www\./, "")}`]);
  if (process.env.NODE_ENV !== "production") { allowed.add("http://localhost:3000"); allowed.add("http://127.0.0.1:3000"); }
  const origin = request.headers.get("origin") || new URL(request.url).origin;
  if (!allowed.has(origin)) throw new Error("Use checkout from the NovaSprout website.");
  return origin;
}
export async function stripeRequest(path: string, body?: URLSearchParams) {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Payment service is unavailable.");
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? "POST" : "GET", body, cache: "no-store", signal: AbortSignal.timeout(8000),
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Stripe-Version": "2024-06-20", ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) }
  });
  if (!response.ok) throw new Error("Payment verification is temporarily unavailable.");
  return response.json();
}
export function paidCheckoutDetails(session: any): WebAccess | null {
  const key = session.metadata?.product_key;
  const price = session.line_items?.data?.[0]?.price?.id;
  if (session.status !== "complete" || session.payment_status !== "paid" || !session.customer || !["ai_lesson", "ai_subscription"].includes(key)) return null;
  if (key === "ai_lesson") {
    if (session.mode !== "payment" || price !== process.env.STRIPE_NOVASPROUT_AI_LESSON_PRICE_ID) return null;
    return { owner: hash(`web:${session.id}`), sessionId: session.id, customer: session.customer, plan: "lesson", budgetKey: `web:purchase:${session.id}`, limit: 1, expiresAt: Date.now() + 365 * 86400000 };
  }
  const sub = session.subscription;
  const start = sub?.current_period_start ?? sub?.items?.data?.[0]?.current_period_start;
  const end = sub?.current_period_end ?? sub?.items?.data?.[0]?.current_period_end;
  const invoice = sub?.latest_invoice;
  if (session.mode !== "subscription" || price !== process.env.STRIPE_NOVASPROUT_AI_MONTHLY_PRICE_ID || sub?.items?.data?.[0]?.price?.id !== price || sub?.status !== "active" || !invoice?.paid || !start || !end || end * 1000 <= Date.now()) return null;
  return { owner: hash(`web:${session.id}`), sessionId: session.id, customer: session.customer, subscription: sub.id, plan: "monthly", budgetKey: `web:month:${sub.id}:${start}`, limit: 20, expiresAt: end * 1000 };
}
export async function verifyPaidSession(sessionId: string) {
  if (!/^cs_(live|test)_[A-Za-z0-9]{8,240}$/.test(sessionId)) return null;
  const session = await stripeRequest(`checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=line_items&expand[]=subscription.latest_invoice`);
  const access = paidCheckoutDetails(session);
  if (!access) return null;
  const paymentIntent = access.plan === "lesson" ? session.payment_intent : session.subscription.latest_invoice.payment_intent;
  if (paymentIntent) {
    const intent = await stripeRequest(`payment_intents/${encodeURIComponent(paymentIntent)}?expand[]=latest_charge`);
    if (intent.status !== "succeeded" || intent.latest_charge?.refunded || intent.latest_charge?.amount_refunded > 0 || intent.latest_charge?.disputed) return null;
  }
  return { access, session };
}
export async function getWebAccess(request: Request) {
  const proof = webProof(request);
  if (!proof?.sessionId) return null;
  if (request.method !== "GET") trustedOrigin(request);
  return (await verifyPaidSession(proof.sessionId))?.access || null;
}
export function lessonTicket(request: Request, responseId: string, createdAt?: number) {
  return signClaims({ kind: "lesson", owner: requestOwner(request), responseId, exp: (createdAt ? createdAt * 1000 : Date.now()) + 24 * 3600000 });
}
export function ticketClaims(request: Request) {
  const proof = verifyClaims(request.headers.get("x-ai-lesson-ticket") || "", "lesson");
  return proof?.owner === requestOwner(request) && proof.responseId ? proof : null;
}
export async function authorizeLessonStep(request: Request, step: "images" | "assets" | "coach", count = 1) {
  if (!webProof(request)) return true; // Preserve verified Apple purchases and private beta access.
  const ticket = ticketClaims(request); if (!ticket) return false;
  const limit = step === "images" ? 3 : step === "assets" ? 2 : 10;
  for (let i = 0; i < count; i++) if (!await takeBudget(`web:step:${ticket.responseId}:${step}`, limit, ticket.exp)) return false;
  return true;
}

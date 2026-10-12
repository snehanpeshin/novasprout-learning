import assert from "node:assert/strict";
import test from "node:test";
import crypto from "node:crypto";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { authorizeLessonStep, hash, paidCheckoutDetails, requestOwner, signClaims, ticketClaims, trustedOrigin, verifyClaims, verifyPaidSession } from "../app/lib/webAiAccess.ts";
import { isAiAccessAllowed } from "../app/lib/aiAccess.ts";
import { GET, POST } from "../app/api/ai-access/route.ts";
import { verifyStripeSignature } from "../app/lib/stripe.ts";
Object.assign(process.env, { AI_WEB_ACCESS_SECRET: "a-secure-test-only-key-with-over-32-characters", STRIPE_NOVASPROUT_AI_LESSON_PRICE_ID: "price_single", STRIPE_NOVASPROUT_AI_MONTHLY_PRICE_ID: "price_monthly", STRIPE_SECRET_KEY: "sk_test_fake", SUPABASE_URL: "https://database.example", SUPABASE_SERVICE_ROLE_KEY: "service-test", NEXT_PUBLIC_SITE_URL: "https://www.novasproutlearning.com", NODE_ENV: "production", AI_USAGE_TABLE: "test-usage" });
const sessionId = "cs_test_12345678901234567890";
function purchase() { return { id: sessionId, status:"complete", payment_status:"paid", customer:"cus_parent", payment_intent:"pi_paid", mode:"payment", metadata:{product_key:"ai_lesson", browser_nonce:hash("browser-secret")}, line_items:{data:[{price:{id:"price_single"}}]} }; }
function monthly() { return { ...purchase(), mode:"subscription", metadata:{product_key:"ai_subscription"}, line_items:{data:[{price:{id:"price_monthly"}}]}, subscription:{id:"sub_parent", status:"active", current_period_start:Math.floor(Date.now()/1000)-100, current_period_end:Math.floor(Date.now()/1000)+10000, items:{data:[{price:{id:"price_monthly"}}]}, latest_invoice:{paid:true,payment_intent:"pi_paid"}} }; }
function request(cookie = "", body: unknown = {}) { return new Request("https://www.novasproutlearning.com/api/ai-access", { method:"POST", headers:{origin:"https://www.novasproutlearning.com", cookie, "Content-Type":"application/json"}, body:JSON.stringify(body) }); }
function mockServices(session: any = purchase(), charge: any = {}, databaseFails = false) {
  const original = globalThis.fetch;
  const originalSend=DynamoDBDocumentClient.prototype.send;
  DynamoDBDocumentClient.prototype.send=(async () => { if (databaseFails) throw new Error("Database unavailable"); return {Item:{used:0}}; }) as any;
  globalThis.fetch = async (url: any) => {
    const path=String(url);
    if (path.includes("checkout/sessions")) return Response.json(session);
    if (path.includes("payment_intents")) return Response.json({status:"succeeded",latest_charge:charge});
    if (path.includes("database.example")) return databaseFails ? new Response("down", {status:503}) : Response.json([]);
    throw new Error("Unexpected service request");
  };
  return () => { globalThis.fetch=original; DynamoDBDocumentClient.prototype.send=originalSend; };
}
test("signed purchase proofs reject tampering, expiry and wrong purpose", () => {
  const token=signClaims({kind:"web",sessionId,exp:Date.now()+10000});
  assert.equal(verifyClaims(token,"web")?.sessionId,sessionId);
  assert.equal(verifyClaims(token.slice(0,-1)+"!","web"),null);
  assert.equal(verifyClaims(token,"lesson"),null);
  assert.equal(verifyClaims(signClaims({kind:"web",sessionId,exp:Date.now()-1}),"web"),null);
});
test("a known or approved email is never authentication", async () => {
  process.env.AI_LESSON_ALLOWED_EMAILS="parent@example.com";
  assert.equal(await isAiAccessAllowed(new Request("https://www.novasproutlearning.com/api/ai-lesson",{headers:{"x-ai-access-token":"parent@example.com"}})),false);
});
test("unpaid, wrong-price and wrong-product purchases cannot unlock lessons", () => {
  for (const changed of [{payment_status:"unpaid"},{status:"open"},{metadata:{product_key:"tutoring_session"}},{line_items:{data:[{price:{id:"price_other"}}]}}]) assert.equal(paidCheckoutDetails({...purchase(),...changed}),null);
  assert.equal(paidCheckoutDetails(purchase())?.limit,1);
});
test("monthly allowance is scoped to the paid renewal period", () => {
  const first=monthly(); const next=monthly(); next.subscription.current_period_start+=10000;
  assert.equal(paidCheckoutDetails(first)?.limit,20);
  assert.notEqual(paidCheckoutDetails(first)?.budgetKey,paidCheckoutDetails(next)?.budgetKey);
  first.subscription.status="past_due";assert.equal(paidCheckoutDetails(first),null);
  const unpaid=monthly();unpaid.subscription.latest_invoice.paid=false;assert.equal(paidCheckoutDetails(unpaid),null);
});
test("refunded, partially refunded and disputed charges are denied", async () => {
  for (const charge of [{refunded:true},{amount_refunded:1},{disputed:true}]) {
    const restore=mockServices(purchase(),charge);
    try { assert.equal(await verifyPaidSession(sessionId),null); } finally { restore(); }
  }
});
test("a paid checkout ID alone cannot steal access", async () => {
  const restore=mockServices();try { const response=await POST(request("",{sessionId}));assert.equal(response.status,401); } finally {restore();}
});
test("activation verifies the checkout browser and sets a secure HttpOnly cookie", async () => {
  const restore=mockServices();try { const response=await POST(request("ns_ai_checkout=browser-secret",{sessionId}));assert.equal(response.status,200);assert.match(response.headers.get("set-cookie")!,/ns_ai_access=.*HttpOnly/i);assert.match(response.headers.get("set-cookie")!,/Secure/); } finally {restore();}
});
test("returning after interrupted checkout activates the browser's own paid purchase", async () => {
  const restore=mockServices();try { const response=await GET(new Request("https://www.novasproutlearning.com/api/ai-access",{headers:{cookie:`ns_ai_checkout=browser-secret; ns_ai_pending=${sessionId}`}}));assert.equal((await response.json()).active,true);assert.match(response.headers.get("set-cookie")!,/ns_ai_access=/); } finally {restore();}
});
test("restore requires a signed purchase proof and rechecks payment", async () => {
  const restore=mockServices();try { const token=signClaims({kind:"web",sessionId,exp:Date.now()+10000});assert.equal((await POST(request("",{recoveryCode:token}))).status,200);assert.equal((await POST(request("",{recoveryCode:token+"bad"}))).status,401); } finally {restore();}
});
test("lesson tickets cannot be used by a different purchaser", () => {
  const first=signClaims({kind:"web",sessionId,exp:Date.now()+10000});
  const owner=requestOwner(new Request("https://www.novasproutlearning.com",{headers:{cookie:`ns_ai_access=${first}`}}));
  const ticket=signClaims({kind:"lesson",owner,responseId:"resp_testlesson",exp:Date.now()+10000});
  const another=signClaims({kind:"web",sessionId:"cs_test_another",exp:Date.now()+10000});
  assert.equal(ticketClaims(new Request("https://www.novasproutlearning.com",{headers:{cookie:`ns_ai_access=${another}`,"x-ai-lesson-ticket":ticket}})),null);
});
test("database outages fail closed for paid image budgets", async () => {
  const token=signClaims({kind:"web",sessionId,exp:Date.now()+10000});
  const headers={cookie:`ns_ai_access=${token}`,"x-ai-lesson-ticket":""};
  const owner=requestOwner(new Request("https://www.novasproutlearning.com",{headers}));
  headers["x-ai-lesson-ticket"]=signClaims({kind:"lesson",owner,responseId:"resp_testlesson",exp:Date.now()+10000});
  const restore=mockServices(purchase(),{},true);
  try { await assert.rejects(authorizeLessonStep(new Request("https://www.novasproutlearning.com",{headers}),"images")); } finally {restore();}
});
test("checkout redirects cannot use an attacker-provided origin", () => { assert.throws(()=>trustedOrigin(new Request("https://www.novasproutlearning.com",{headers:{origin:"https://attacker.example"}}))); });
test("webhook signatures reject replay and accept any matching rotated v1 signature", () => {
  const payload='{"type":"checkout.session.completed"}';const secret="webhook-test";const timestamp=Math.floor(Date.now()/1000);
  const digest=crypto.createHmac("sha256",secret).update(`${timestamp}.${payload}`).digest("hex");
  assert.equal(verifyStripeSignature({payload,secret,signatureHeader:`t=${timestamp},v1=${"0".repeat(64)},v1=${digest}`}),true);
  assert.equal(verifyStripeSignature({payload,secret,signatureHeader:`t=${timestamp-1000},v1=${digest}`}),false);
});

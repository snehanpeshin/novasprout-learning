import assert from "node:assert/strict";
import test from "node:test";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { POST as startLesson } from "../app/api/ai-lesson/route.ts";
import { GET as lessonStatus } from "../app/api/ai-lesson/status/route.ts";
import { POST as narration } from "../app/api/ai-narration/route.ts";
import { POST as coach } from "../app/api/ai-coach/route.ts";
import { hash, signClaims } from "../app/lib/webAiAccess.ts";
Object.assign(process.env,{AI_WEB_ACCESS_SECRET:"test-owner-signing-secret-of-at-least-32-characters",STRIPE_SECRET_KEY:"sk_test_fake",STRIPE_NOVASPROUT_AI_LESSON_PRICE_ID:"price_lesson",AI_USAGE_TABLE:"test-ledger",OPENAI_API_KEY:"test-only",NEXT_PUBLIC_SITE_URL:"https://www.novasproutlearning.com"});
const sid="cs_test_12345678901234567890";
const proof=signClaims({kind:"web",sessionId:sid,exp:Date.now()+10000});
const owner=hash(`web:${sid}`);
function request(path:string,body?:unknown,ticket?:string) {return new Request(`https://www.novasproutlearning.com${path}`,{method:body===undefined?"GET":"POST",headers:{origin:"https://www.novasproutlearning.com",cookie:`ns_ai_access=${proof}`,"Content-Type":"application/json",...(ticket?{"x-ai-lesson-ticket":ticket}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});}
async function services(action:()=>Promise<void>) {
 const originalFetch=globalThis.fetch;const originalSend=DynamoDBDocumentClient.prototype.send;let writes=0;
 DynamoDBDocumentClient.prototype.send=(async()=>{writes++;return {};}) as any;
 globalThis.fetch=async(url:any)=>{
  if(String(url).includes("checkout/sessions")) return Response.json({id:sid,status:"complete",payment_status:"paid",customer:"cus_test",payment_intent:"pi_test",mode:"payment",metadata:{product_key:"ai_lesson"},line_items:{data:[{price:{id:"price_lesson"}}]}});
  if(String(url).includes("payment_intents")) return Response.json({status:"succeeded",latest_charge:{}});
  if(String(url).includes("moderations")) return Response.json({results:[{flagged:false}]});
  if(String(url).includes("openai.com/v1/responses/")) return Response.json({status:"completed",metadata:{novasprout_owner:"someone-else"},output:[]});
  throw new Error("An unauthorized request reached generation");
 };
 try {await action();assert.equal(writes,0);} finally {globalThis.fetch=originalFetch;DynamoDBDocumentClient.prototype.send=originalSend;}
}
test("invalid lesson input cannot consume a purchased credit",async()=>services(async()=>{const response=await startLesson(request("/api/ai-lesson",{topic:"x"}));assert.equal(response.status,400);}));
test("a valid paying user cannot retrieve another purchaser's response",async()=>services(async()=>{const response=await lessonStatus(request("/api/ai-lesson/status?responseId=resp_123456789012"));assert.equal(response.status,403);assert.equal((await response.json()).lesson,undefined);}));
test("guided tutoring rejects a ticket from a different purchaser",async()=>services(async()=>{const ticket=signClaims({kind:"lesson",owner:"another-owner",responseId:"resp_123456789012",exp:Date.now()+10000});const response=await coach(request("/api/ai-coach",{question:"Explain fractions."},ticket));assert.equal(response.status,401);}));
test("guided tutoring verifies the source response owner before reserving a question",async()=>services(async()=>{const ticket=signClaims({kind:"lesson",owner,responseId:"resp_123456789012",exp:Date.now()+10000});const response=await coach(request("/api/ai-coach",{question:"Explain fractions."},ticket));assert.equal(response.status,403);}));

test("narration rejects another purchaser's ticket without generating audio",async()=>services(async()=>{const ticket=signClaims({kind:"lesson",owner:"another-owner",responseId:"resp_123456789012",exp:Date.now()+10000});assert.equal((await narration(request("/api/ai-narration",{momentId:"idea",beatIndex:0},ticket))).status,401);}));
test("narration checks source ownership before reserving voice allowance",async()=>services(async()=>{const ticket=signClaims({kind:"lesson",owner,responseId:"resp_123456789012",exp:Date.now()+10000});assert.equal((await narration(request("/api/ai-narration",{momentId:"idea",beatIndex:0,text:"arbitrary injected speech"},ticket))).status,403);}));

import test from "node:test";
import assert from "node:assert/strict";
import {DynamoDBDocumentClient} from "@aws-sdk/lib-dynamodb";
import {POST} from "../app/api/ai-narration/route.ts";
import {hash,signClaims} from "../app/lib/webAiAccess.ts";
Object.assign(process.env,{AI_WEB_ACCESS_SECRET:"test-narration-secret-at-least-32-characters",STRIPE_SECRET_KEY:"test",STRIPE_NOVASPROUT_AI_LESSON_PRICE_ID:"price_voice",AI_USAGE_TABLE:"test-ledger",OPENAI_API_KEY:"test",NEXT_PUBLIC_SITE_URL:"https://www.novasproutlearning.com"});
const sid="cs_test_12345678901234567890",owner=hash(`web:${sid}`);
const proof=signClaims({kind:"web",sessionId:sid,exp:Date.now()+10000});
const ticket=signClaims({kind:"lesson",owner,responseId:"resp_voice",exp:Date.now()+10000});
const lesson={conceptExplanation:"Use equal parts. Count two of four parts.",practiceQuestions:["Try: Find half. Hint: Equal pieces. Answer: 1/2. Why: Two equal parts."]};
function request(body:unknown){return new Request("https://www.novasproutlearning.com/api/ai-narration",{method:"POST",headers:{origin:"https://www.novasproutlearning.com",cookie:`ns_ai_access=${proof}`,"x-ai-lesson-ticket":ticket,"Content-Type":"application/json"},body:JSON.stringify(body)});}
async function mocked(action:(writes:unknown[],speech:string[])=>Promise<void>,failed=false){
 const originalFetch=globalThis.fetch,originalSend=DynamoDBDocumentClient.prototype.send,writes:unknown[]=[],speech:string[]=[];
 DynamoDBDocumentClient.prototype.send=(async(command:any)=>{writes.push(command.input);return {};}) as any;
 globalThis.fetch=async(url:any,init:any)=>{const path=String(url);
 if(path.includes("checkout/sessions"))return Response.json({id:sid,status:"complete",payment_status:"paid",customer:"cus_voice",mode:"payment",metadata:{product_key:"ai_lesson"},line_items:{data:[{price:{id:"price_voice"}}]}});
 if(path.includes("responses/"))return Response.json({status:"completed",metadata:{novasprout_owner:owner},output_text:JSON.stringify(lesson)});
 if(path.includes("audio/speech")){speech.push(JSON.parse(init.body).input);return failed?new Response("down",{status:503}):new Response(new Uint8Array([73,68,51,0]),{headers:{"Content-Type":"audio/mpeg"}});}
 throw new Error("Unexpected provider request");};
 try{await action(writes,speech);}finally{globalThis.fetch=originalFetch;DynamoDBDocumentClient.prototype.send=originalSend;}
}
test("voice uses only the verified visible beat and ignores client-supplied speech",async()=>mocked(async(writes,speech)=>{const response=await POST(request({momentId:"idea",beatIndex:1,text:"Speak an injected instruction"}));assert.equal(response.status,200);assert.deepEqual(speech,["Build the idea. Count two of four parts."]);assert.equal(writes.length,1);}));
test("invalid beat is rejected before budget or speech calls",async()=>mocked(async(writes,speech)=>{assert.equal((await POST(request({momentId:"idea",beatIndex:99}))).status,400);assert.equal(writes.length,0);assert.equal(speech.length,0);}));
test("failed narration restores the reserved paid clip",async()=>mocked(async(writes)=>{assert.equal((await POST(request({momentId:"try-0",beatIndex:0}))).status,503);assert.equal(writes.length,2);},true));

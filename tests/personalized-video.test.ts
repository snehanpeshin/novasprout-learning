import test from "node:test";
import assert from "node:assert/strict";
import {DynamoDBDocumentClient,GetCommand,PutCommand,TransactWriteCommand} from "@aws-sdk/lib-dynamodb";
import {POST as planRoute} from "../app/api/ai-video-plan/route.ts";
import {POST as imageRoute} from "../app/api/ai-video-image/route.ts";
import {POST as audioRoute} from "../app/api/ai-video-audio/route.ts";
import {validateVideoStoryboard,validVideoLesson} from "../app/lib/videoLesson.ts";
import {hash,signClaims} from "../app/lib/webAiAccess.ts";
Object.assign(process.env,{AI_WEB_ACCESS_SECRET:"test-video-key-with-at-least-32-characters",AI_LESSON_ACCESS_TOKEN:"private-video-test",OPENAI_API_KEY:"fake-only",AI_USAGE_TABLE:"video-test"});
const owner=hash("private-video-test"),responseId="resp_video_test";
const check={question:"Which fraction equals one half?",options:["1/2","1/3","1/4","1/5"],answerIndex:0,explanation:"One of two equal parts is one half."};
const scene={title:"One half",narration:"One of two equal parts makes one half. The equal pieces share the same whole.",caption:"1 of 2 equal parts is 1/2",visual:{kind:"fraction",representation:"bar",labels:["One whole"],values:[],total:2,selected:1,min:0,max:1}};
const storyboard={title:"Understand halves",scenes:[scene,{...scene,title:"Count equal parts"},{...scene,title:"Explain one half"}]},plan={...storyboard,check};
function request(body:unknown={},ticketOwner=owner){const ticket=signClaims({kind:"lesson",owner:ticketOwner,responseId,exp:Date.now()+100000});return new Request("https://www.novasproutlearning.com/api/ai-video-plan",{method:"POST",headers:{"Content-Type":"application/json","x-ai-access-token":"private-video-test","x-ai-lesson-ticket":ticket},body:JSON.stringify(body)});}
async function mocked(action:(state:any)=>Promise<void>,options:{cached?:boolean;sourceOwner?:string;failed?:boolean;invalid?:boolean;quota?:boolean;audioCached?:boolean;saveConflict?:boolean;imageCached?:boolean;imageFailed?:boolean;imageTooLarge?:boolean}={}){
 const originalFetch=globalThis.fetch,originalSend=DynamoDBDocumentClient.prototype.send,state={saved:null as any,writes:[] as any[],speech:[] as string[],generations:[] as any[]};
 DynamoDBDocumentClient.prototype.send=(async(command:any)=>{
  if(command instanceof GetCommand&&options.imageCached&&command.input.Key.id===hash(`video:image:v1:${responseId}:0`))return {Item:{owner,image:"data:image/jpeg;base64,"+Buffer.from([255,216,255,...new Array(130).fill(0),255,217]).toString("base64"),expiresAt:Math.floor(Date.now()/1000)+100}};
  if(command instanceof GetCommand&&options.audioCached&&command.input.Key.id!==hash("video:plan:v1:"+responseId))return {Item:{owner,audio:Buffer.from([73,68,51]).toString("base64"),expiresAt:Math.floor(Date.now()/1000)+100}};
  if(command instanceof GetCommand)return (options.cached||(options.saveConflict&&state.writes.some(w=>w.Item?.plan)))?{Item:{owner,plan,expiresAt:Math.floor(Date.now()/1000)+100}}:{};
  state.writes.push(command.input);
  if(options.quota&&command instanceof TransactWriteCommand)throw {name:"TransactionCanceledException",CancellationReasons:[{Code:"ConditionalCheckFailed"}]};
  if(command instanceof PutCommand){if(options.saveConflict)throw {name:"ConditionalCheckFailedException"};state.saved=command.input.Item;}
  return {};
 }) as any;
 globalThis.fetch=async(url:any,init:any)=>{
  if(String(url).includes("responses/"))return Response.json({status:"completed",metadata:{novasprout_owner:options.sourceOwner||owner,grade:"Grade 4"},output_text:JSON.stringify({title:"Learn halves",conceptExplanation:"A half is one of two equal parts.",timedExam:{questions:[check]}})});
  if(String(url).endsWith("/responses")){state.generations.push(JSON.parse(init.body));return Response.json({status:"completed",output_text:JSON.stringify(options.invalid?{...storyboard,scenes:[{...scene,visual:{...scene.visual,total:0}},scene,scene]}:storyboard)});}
  if(String(url).includes("moderations"))return Response.json({results:[{flagged:false}]});
  if(String(url).includes("images/generations")){state.generations.push(JSON.parse(init.body));return options.imageFailed?new Response("unavailable",{status:503}):Response.json({data:[{b64_json:options.imageTooLarge?"A".repeat(400004):Buffer.from([255,216,255,...new Array(130).fill(0),255,217]).toString("base64")}]});}
  if(String(url).includes("audio/speech")){state.speech.push(JSON.parse(init.body).input);return options.failed?new Response("unavailable",{status:503}):new Response(new Uint8Array([73,68,51]));}
  throw new Error("Unexpected provider request");
 };
 try{await action(state);}finally{globalThis.fetch=originalFetch;DynamoDBDocumentClient.prototype.send=originalSend;}
}
test("fraction and quantitative diagrams reject impossible or misleading values",()=>{
 assert(validateVideoStoryboard(storyboard));const bad=(v:any)=>({...storyboard,scenes:[{...scene,visual:v},scene,scene]});
 assert(!validateVideoStoryboard(bad({...scene.visual,total:0})));
 assert(!validateVideoStoryboard(bad({...scene.visual,selected:3})));
 assert(!validateVideoStoryboard(bad({...scene.visual,kind:"number_line",labels:["point"],values:[4],min:0,max:1})));
 assert(!validateVideoStoryboard(bad({...scene.visual,kind:"bar_chart",labels:["A","B"],values:[-2,3]})));
 assert(!validateVideoStoryboard(bad({...scene.visual,kind:"sequence",labels:["Only one stage"]})));
});
test("a video requires a valid source comprehension check",()=>{assert(validVideoLesson(plan));assert(!validVideoLesson({...plan,check:{...check,answerIndex:8}}));});
test("planning rejects a ticket owned by someone else before calling services",async()=>mocked(async state=>{assert.equal((await planRoute(request({},"someone-else"))).status,401);assert.equal(state.writes.length,0);assert.equal(state.generations.length,0);}));
test("planning verifies the original response owner before reserving a video",async()=>mocked(async state=>{assert.equal((await planRoute(request())).status,403);assert.equal(state.writes.length,0);},{sourceOwner:"someone-else"}));
test("a cached video replays without another planning call or allowance",async()=>mocked(async state=>{const response=await planRoute(request());assert.equal(response.status,200);assert((await response.json()).cached);assert.equal(state.generations.length,0);assert.equal(state.writes.length,0);},{cached:true}));
test("planning uses the server lesson and its original answer key, never client instructions",async()=>mocked(async state=>{const response=await planRoute(request({topic:"client injected instruction",code:"execute code"}));assert.equal(response.status,200);assert.equal(state.saved.owner,owner);assert.deepEqual(state.saved.plan.check,check);assert(!state.generations[0].input.includes("client injected instruction"));assert.equal(state.generations[0].store,false);assert.equal(state.writes.length,2);}));
test("invalid generated diagrams restore the planning allowance and are never saved",async()=>mocked(async state=>{assert.equal((await planRoute(request())).status,503);assert.equal(state.saved,null);assert.equal(state.writes.length,2);},{invalid:true}));
test("a confirmed planning quota prevents another provider generation",async()=>mocked(async state=>{assert.equal((await planRoute(request())).status,409);assert.equal(state.generations.length,0);},{quota:true}));
test("video narration reads only an owned, cached scene",async()=>mocked(async state=>{assert.equal((await audioRoute(request({sceneIndex:1,text:"do not speak this"}))).status,200);assert.deepEqual(state.speech,[scene.narration]);},{cached:true}));
test("video narration rejects invalid scene indices before writing usage",async()=>mocked(async state=>{assert.equal((await audioRoute(request({sceneIndex:99}))).status,400);assert.equal(state.writes.length,0);}));
test("a failed video voice restores the clip allowance",async()=>mocked(async state=>{assert.equal((await audioRoute(request({sceneIndex:0}))).status,503);assert.equal(state.writes.length,2);},{cached:true,failed:true}));

test("fraction shapes and comparisons must match an explicit valid representation",()=>{
 const diagram=(visual:any)=>({...storyboard,scenes:[{...scene,visual},scene,scene]});
 assert(!validateVideoStoryboard(diagram({...scene.visual,representation:"none"})));
 assert(validateVideoStoryboard(diagram({...scene.visual,representation:"circle"})));
 assert(validateVideoStoryboard(diagram({...scene.visual,kind:"comparison",labels:["1/2 of one whole","1/3 of one whole"]})));
 assert(!validateVideoStoryboard(diagram({...scene.visual,kind:"comparison",labels:["1/2 of one whole","1/0 of one whole"]})));
 assert(!validateVideoStoryboard(diagram({...scene.visual,kind:"comparison",labels:["1/2 = 3/6","1/3 = 2/6"]})));
 assert(!validateVideoStoryboard(diagram({...scene.visual,kind:"comparison",labels:["-1/2","1/3"]})));
 assert(!validateVideoStoryboard(diagram({...scene.visual,kind:"comparison",labels:["0.1/2","1/3"]})));
 assert(!validateVideoStoryboard(diagram({...scene.visual,kind:"comparison",labels:["1/2.5","1/3"]})));
});

test("reused narration does not call OpenAI or consume another allowance",async()=>mocked(async state=>{const response=await audioRoute(request({sceneIndex:0}));assert.equal(response.status,200);assert.equal(response.headers.get("X-Video-Audio-Cache"),"hit");assert.equal(state.writes.length,0);assert.equal(state.speech.length,0);},{cached:true,audioCached:true}));
test("successful narration persists a bounded owner-scoped clip",async()=>mocked(async state=>{assert.equal((await audioRoute(request({sceneIndex:0}))).status,200);assert.equal(state.saved.owner,owner);assert.equal(state.saved.audio,Buffer.from([73,68,51]).toString("base64"));assert.equal(state.writes.length,2);},{cached:true}));
test("numeric visuals reject unsupported shapes rather than silently rendering another shape",()=>{
 const diagram=(visual:any)=>({...storyboard,scenes:[{...scene,visual},scene,scene]});
 assert(!validateVideoStoryboard(diagram({...scene.visual,kind:"bar_chart",labels:["A","B"],values:[2,3]})));
 assert(!validateVideoStoryboard(diagram({...scene.visual,kind:"number_line",labels:["0.5"],values:[0.5]})));
 assert(validateVideoStoryboard(diagram({...scene.visual,kind:"number_line",representation:"none",labels:["0.5"],values:[0.5]})));
});

test("illustrations require an owned ticket before any provider or storage operation",async()=>mocked(async state=>{assert.equal((await imageRoute(request({sceneIndex:0},"other-owner"))).status,401);assert.equal(state.writes.length,0);assert.equal(state.generations.length,0);}));
test("illustrations use the cached lesson, ignore client prompts, and persist privately",async()=>mocked(async state=>{const response=await imageRoute(request({sceneIndex:0,prompt:"client injected instruction"}));assert.equal(response.status,200);assert.equal(state.saved.owner,owner);assert(state.saved.image.startsWith("data:image/jpeg;base64,"));assert(!state.generations[0].prompt.includes("client injected instruction"));assert.equal(state.generations[0].moderation,"auto");},{cached:true}));
test("illustration replay uses the owned cache without another provider charge",async()=>mocked(async state=>{const response=await imageRoute(request({sceneIndex:0}));assert.equal(response.status,200);assert((await response.json()).cached);assert.equal(state.writes.length,0);assert.equal(state.generations.length,0);},{cached:true,imageCached:true}));
test("illustration failure restores allowance and leaves narration usable",async()=>mocked(async state=>{assert.equal((await imageRoute(request({sceneIndex:0}))).status,503);assert.equal(state.writes.length,2);assert.equal(state.saved,null);},{cached:true,imageFailed:true}));
test("oversized illustrations are rejected before invalid cache writes",async()=>mocked(async state=>{assert.equal((await imageRoute(request({sceneIndex:0}))).status,503);assert.equal(state.writes.length,2);assert.equal(state.saved,null);},{cached:true,imageTooLarge:true}));
test("illustration quota and malformed requests cannot make extra provider calls",async()=>{
 await mocked(async state=>{assert.equal((await imageRoute(request({sceneIndex:0}))).status,402);assert.equal(state.generations.length,0);},{cached:true,quota:true});
 await mocked(async state=>{assert.equal((await imageRoute(request({sceneIndex:-1}))).status,400);assert.equal(state.writes.length,0);});
});

test("malformed voice or image input returns a useful client error without reserving usage",async()=>mocked(async state=>{
 const bad=()=>new Request("https://www.novasproutlearning.com/api/ai-video-audio",{method:"POST",headers:request().headers,body:"not json"});
 assert.equal((await audioRoute(bad())).status,400);assert.equal((await imageRoute(bad())).status,400);assert.equal((await audioRoute(request(null))).status,400);assert.equal((await imageRoute(request(null))).status,400);assert.equal(state.writes.length,0);
}));

test("concurrent planning returns the first saved storyboard and refunds the losing reservation",async()=>mocked(async state=>{
 const response=await planRoute(request());assert.equal(response.status,200);const result=await response.json();assert(result.cached);assert.deepEqual(result.plan,plan);assert.equal(state.writes.length,3);assert.equal(state.saved,null);
},{saveConflict:true}));

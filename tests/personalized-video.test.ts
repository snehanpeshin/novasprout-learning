import test from "node:test";
import assert from "node:assert/strict";
import {DynamoDBDocumentClient,GetCommand,PutCommand,TransactWriteCommand} from "@aws-sdk/lib-dynamodb";
import {POST as planRoute} from "../app/api/ai-video-plan/route.ts";
import {POST as audioRoute} from "../app/api/ai-video-audio/route.ts";
import {validateVideoStoryboard,validVideoLesson} from "../app/lib/videoLesson.ts";
import {hash,signClaims} from "../app/lib/webAiAccess.ts";
Object.assign(process.env,{AI_WEB_ACCESS_SECRET:"test-video-key-with-at-least-32-characters",AI_LESSON_ACCESS_TOKEN:"private-video-test",OPENAI_API_KEY:"fake-only",AI_USAGE_TABLE:"video-test"});
const owner=hash("private-video-test"),responseId="resp_video_test";
const check={question:"Which fraction equals one half?",options:["1/2","1/3","1/4","1/5"],answerIndex:0,explanation:"One of two equal parts is one half."};
const scene={title:"One half",narration:"One of two equal parts makes one half. The equal pieces share the same whole.",caption:"1 of 2 equal parts is 1/2",visual:{kind:"fraction",representation:"bar",labels:["One whole"],values:[],total:2,selected:1,min:0,max:1}};
const storyboard={title:"Understand halves",scenes:[scene,{...scene,title:"Count equal parts"},{...scene,title:"Explain one half"}]},plan={...storyboard,check};
function request(body:unknown={},ticketOwner=owner){const ticket=signClaims({kind:"lesson",owner:ticketOwner,responseId,exp:Date.now()+100000});return new Request("https://www.novasproutlearning.com/api/ai-video-plan",{method:"POST",headers:{"Content-Type":"application/json","x-ai-access-token":"private-video-test","x-ai-lesson-ticket":ticket},body:JSON.stringify(body)});}
async function mocked(action:(state:any)=>Promise<void>,options:{cached?:boolean;sourceOwner?:string;failed?:boolean;invalid?:boolean;quota?:boolean}={}){
 const originalFetch=globalThis.fetch,originalSend=DynamoDBDocumentClient.prototype.send,state={saved:null as any,writes:[] as any[],speech:[] as string[],generations:[] as any[]};
 DynamoDBDocumentClient.prototype.send=(async(command:any)=>{
  if(command instanceof GetCommand)return options.cached?{Item:{owner,plan,expiresAt:Math.floor(Date.now()/1000)+100}}:{};
  state.writes.push(command.input);
  if(options.quota&&command instanceof TransactWriteCommand)throw {name:"TransactionCanceledException",CancellationReasons:[{Code:"ConditionalCheckFailed"}]};
  if(command instanceof PutCommand)state.saved=command.input.Item;
  return {};
 }) as any;
 globalThis.fetch=async(url:any,init:any)=>{
  if(String(url).includes("responses/"))return Response.json({status:"completed",metadata:{novasprout_owner:options.sourceOwner||owner,grade:"Grade 4"},output_text:JSON.stringify({title:"Learn halves",conceptExplanation:"A half is one of two equal parts.",timedExam:{questions:[check]}})});
  if(String(url).endsWith("/responses")){state.generations.push(JSON.parse(init.body));return Response.json({status:"completed",output_text:JSON.stringify(options.invalid?{...storyboard,scenes:[{...scene,visual:{...scene.visual,total:0}},scene,scene]}:storyboard)});}
  if(String(url).includes("moderations"))return Response.json({results:[{flagged:false}]});
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
});

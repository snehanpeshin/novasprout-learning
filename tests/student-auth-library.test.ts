import test,{after} from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {CognitoJwtVerifier} from "aws-jwt-verify";
import {DynamoDBDocumentClient,GetCommand,DeleteCommand} from "@aws-sdk/lib-dynamodb";
import {studentSession,verifyStudentTokens,sealOAuth,readOAuth,safeStudentReturn,readSmallJson,studentCookies} from "../app/lib/studentAuth.ts";
import {GET as login} from "../app/api/student-auth/login/route.ts";
import {GET as callback} from "../app/api/student-auth/callback/route.ts";
import {GET as sessionRoute} from "../app/api/student-auth/session/route.ts";
import {POST as logout} from "../app/api/student-auth/logout/route.ts";
import {GET as readLesson,DELETE as deleteLesson} from "../app/api/student-library/[lessonId]/route.ts";
import {GET as listLessons,POST as saveLesson} from "../app/api/student-library/route.ts";
Object.assign(process.env,{STUDENT_USER_POOL_ID:"us-east-1_TestStudents",STUDENT_CLIENT_ID:"studenttestclient",STUDENT_AUTH_DOMAIN:"https://student-test.auth.us-east-1.amazoncognito.com",STUDENT_SESSION_SECRET:"a-test-student-session-secret-with-over-32-characters",STUDENT_LIBRARY_TABLE:"test-library",NEXT_PUBLIC_SITE_URL:"https://www.novasproutlearning.com",NODE_ENV:"production"});
const originalCreate=CognitoJwtVerifier.create;
const {privateKey,publicKey}=crypto.generateKeyPairSync("rsa",{modulusLength:2048});
const jwk={...publicKey.export({format:"jwk"}),kid:"test-library-key",alg:"RS256",use:"sig"};
(CognitoJwtVerifier as any).create=(config:any)=>{const verifier:any=originalCreate.call(CognitoJwtVerifier,config as any);verifier.cacheJwks({keys:[jwk]});return verifier;};
after(()=>{(CognitoJwtVerifier as any).create=originalCreate;});
function token(kind:"access"|"id",subject="student-a",extra:Record<string,unknown>={}){
 const now=Math.floor(Date.now()/1000),claims={sub:subject,iss:"https://cognito-idp.us-east-1.amazonaws.com/us-east-1_TestStudents",iat:now,exp:now+900,token_use:kind,...(kind==="access"?{client_id:"studenttestclient",scope:"openid email"}:{aud:"studenttestclient",email:subject+"@example.invalid",email_verified:true}),...extra};
 const header=Buffer.from(JSON.stringify({alg:"RS256",kid:jwk.kid})).toString("base64url"),body=Buffer.from(JSON.stringify(claims)).toString("base64url"),data=header+"."+body;
 return data+"."+crypto.sign("RSA-SHA256",Buffer.from(data),privateKey).toString("base64url");
}
function request(path:string,subject="student-a",init:RequestInit={}){
 const access=token("access",subject),id=token("id",subject),headers=new Headers(init.headers);
 headers.set("cookie",studentCookies.access+"="+access+"; "+studentCookies.id+"="+id);
 headers.set("origin","https://www.novasproutlearning.com");headers.set("x-novasprout-library","1");headers.set("x-student-account",subject);
 return new Request("https://www.novasproutlearning.com"+path,{...init,headers});
}
test("student sessions verify real RSA signatures and matching access/ID subjects",async()=>{
 const value=await studentSession(request("/api/student-auth/session"));assert.equal(value?.studentId,"student-a");
 await assert.rejects(verifyStudentTokens(token("access","student-a"),token("id","student-b")));
 const access=token("access");await assert.rejects(verifyStudentTokens(access.slice(0,-12)+"invalid",token("id")));
});
test("expired, wrong-audience, wrong-issuer, wrong-use and unverified-email tokens are denied",async()=>{
 for(const [access,id] of [
 [token("access","student-a",{exp:1}),token("id")],
 [token("access","student-a",{client_id:"another-client"}),token("id")],
 [token("access","student-a",{iss:"https://attacker.invalid"}),token("id")],
 [token("id"),token("id")],
 [token("access"),token("id","student-a",{email_verified:false})]
 ])await assert.rejects(verifyStudentTokens(access,id));
});
test("OAuth state is signed, expires, and cannot contain an external return location",()=>{
 const proof={state:"state",verifier:"verifier",returnTo:"https://attacker.invalid",expiresAt:Date.now()+600000},sealed=sealOAuth(proof);
 assert.equal(readOAuth(sealed)?.returnTo,"/library");assert.equal(readOAuth(sealed+"bad"),null);
 assert.equal(readOAuth(sealOAuth({...proof,expiresAt:Date.now()-1})),null);
 assert.equal(safeStudentReturn("//attacker.invalid"),"/library");
});
test("the login endpoint uses code + PKCE and an HttpOnly, Secure state cookie",async()=>{
 const response=await login(new Request("https://www.novasproutlearning.com/api/student-auth/login?returnTo=https://attacker.invalid"));
 const target=new URL(response.headers.get("location")!);
 assert.equal(target.searchParams.get("response_type"),"code");assert.equal(target.searchParams.get("code_challenge_method"),"S256");
 const proof=readOAuth(response.cookies.get(studentCookies.oauth)!.value);assert(proof);
 assert.equal(target.searchParams.get("code_challenge"),crypto.createHash("sha256").update(proof.verifier).digest("base64url"));
 assert.equal(proof.returnTo,"/library");assert.match(response.headers.get("set-cookie")!,/HttpOnly/);assert.match(response.headers.get("set-cookie")!,/Secure/);
});
test("a callback with invalid state never exchanges a code or creates a student session",async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=(async()=>{calls++;throw new Error("must not call");}) as any;
 try{const response=await callback(new Request("https://www.novasproutlearning.com/api/student-auth/callback?code=code&state=wrong"));assert.equal(calls,0);assert.match(response.headers.get("location")!,/auth=failed/);assert.equal(response.cookies.get(studentCookies.access),undefined);}
 finally{globalThis.fetch=original;}
});
test("a valid callback exchanges the original verifier and never places tokens in the redirect URL",async()=>{
 const original=globalThis.fetch,proof={state:"random-state",verifier:"original-verifier",returnTo:"/library",expiresAt:Date.now()+600000};
 let received:URLSearchParams|undefined;
 globalThis.fetch=(async(url:any,init:any)=>{assert.equal(String(url),"https://student-test.auth.us-east-1.amazoncognito.com/oauth2/token");received=init.body;return Response.json({access_token:token("access"),id_token:token("id"),refresh_token:"opaque-refresh",expires_in:900});}) as any;
 try{const response=await callback(new Request("https://www.novasproutlearning.com/api/student-auth/callback?code=code&state=random-state",{headers:{cookie:studentCookies.oauth+"="+sealOAuth(proof)}}));assert.equal(received?.get("code_verifier"),proof.verifier);assert.equal(response.headers.get("location"),"https://www.novasproutlearning.com/library");assert(response.cookies.get(studentCookies.access));assert(response.cookies.get(studentCookies.refresh));assert.match(response.headers.get("set-cookie")!,/HttpOnly/);}
 finally{globalThis.fetch=original;}
});
test("an expired access session can rotate refresh cookies without exposing tokens to JavaScript",async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=(async()=>Response.json({access_token:token("access"),id_token:token("id"),refresh_token:"rotated-refresh",expires_in:900})) as any;
 try{const response=await sessionRoute(new Request("https://www.novasproutlearning.com/api/student-auth/session",{headers:{cookie:studentCookies.access+"="+token("access","student-a",{exp:1})+"; "+studentCookies.id+"="+token("id")+"; "+studentCookies.refresh+"=old-refresh"}}));const body=await response.json();assert.equal(body.accountId,"student-a");assert.equal(body.active,true);assert.equal(body.access_token,undefined);assert.equal(response.cookies.get(studentCookies.refresh)?.value,"rotated-refresh");}
 finally{globalThis.fetch=original;}
});
test("unauthenticated library requests do not reach the database",async()=>{
 const original=DynamoDBDocumentClient.prototype.send;let calls=0;DynamoDBDocumentClient.prototype.send=(async()=>{calls++;throw new Error("must not call");}) as any;
 try{const response=await listLessons(new Request("https://www.novasproutlearning.com/api/student-library"));assert.equal(response.status,401);assert.equal(calls,0);assert.match(response.headers.get("cache-control")!,/private, no-store/);}
 finally{DynamoDBDocumentClient.prototype.send=original;}
});
test("cross-site writes and stale account markers are rejected before storage",async()=>{
 const original=DynamoDBDocumentClient.prototype.send;let calls=0;DynamoDBDocumentClient.prototype.send=(async()=>{calls++;return {};}) as any;
 try{
  const foreign=request("/api/student-library","student-a",{method:"POST",body:"{}"});foreign.headers.set("origin","https://attacker.invalid");assert.equal((await saveLesson(foreign)).status,403);
  const stale=request("/api/student-library");stale.headers.set("x-student-account","student-b");assert.equal((await listLessons(stale)).status,409);assert.equal(calls,0);
 }finally{DynamoDBDocumentClient.prototype.send=original;}
});
test("real JWT identity, not a requested lesson ID, controls reads and deletion keys",async()=>{
 const original=DynamoDBDocumentClient.prototype.send,lessonId="a".repeat(32),keys:any[]=[];
 DynamoDBDocumentClient.prototype.send=(async(command:any)=>{const input:any=command.input;keys.push(input.Key);if(command instanceof GetCommand)return input.Key.studentId==="student-a"?{Item:{studentId:"student-a",lessonId,title:"Private lesson"}}:{};if(command instanceof DeleteCommand)return {};throw new Error("unexpected");}) as any;
 try{
  const context={params:Promise.resolve({lessonId})};
  assert.equal((await readLesson(request("/api/student-library/"+lessonId,"student-b"),context)).status,404);
  const mine=await readLesson(request("/api/student-library/"+lessonId),context);assert.equal(mine.status,200);assert.equal((await mine.json()).lesson.studentId,undefined);
  assert.equal((await deleteLesson(request("/api/student-library/"+lessonId,"student-b",{method:"DELETE"}),context)).status,200);
  assert.deepEqual(keys.map(key=>key.studentId),["student-b","student-a","student-b"]);
 }finally{DynamoDBDocumentClient.prototype.send=original;}
});
test("oversized request bodies are rejected while streaming",async()=>{
 await assert.rejects(readSmallJson(new Request("https://example.test",{method:"POST",body:"x".repeat(200)}),100),/too large/);
});
test("sign-out blocks cross-site requests and clears app cookies plus the hosted-login session",async()=>{
 const original=globalThis.fetch;let revoked=false;globalThis.fetch=(async(url:any)=>{revoked=String(url).endsWith("/oauth2/revoke");return new Response("",{status:200});}) as any;
 try{
  const denied=await logout(new Request("https://www.novasproutlearning.com/api/student-auth/logout",{method:"POST",headers:{origin:"https://attacker.invalid"}}));assert.equal(denied.status,403);
  const req=request("/api/student-auth/logout","student-a",{method:"POST"});req.headers.set("cookie",req.headers.get("cookie")+"; "+studentCookies.refresh+"=private-refresh");
  const response=await logout(req);assert.equal(response.status,200);assert(revoked);assert.equal(response.cookies.get(studentCookies.access)?.value,"");assert.match((await response.json()).url,/\/logout\?/);
 }finally{globalThis.fetch=original;}
});

test("a temporary refresh outage preserves the refresh cookie for a later retry",async()=>{
 const original=globalThis.fetch;globalThis.fetch=(async()=>{throw new Error("temporary network failure");}) as any;
 try{const response=await sessionRoute(new Request("https://www.novasproutlearning.com/api/student-auth/session",{headers:{cookie:studentCookies.refresh+"=keep-for-retry"}}));assert.equal(response.status,503);assert.equal(response.cookies.get(studentCookies.refresh),undefined);}
 finally{globalThis.fetch=original;}
});
test("a revoked refresh token clears the expired session instead of keeping the student signed in",async()=>{
 const original=globalThis.fetch;globalThis.fetch=(async()=>Response.json({error:"invalid_grant"},{status:400})) as any;
 try{const response=await sessionRoute(new Request("https://www.novasproutlearning.com/api/student-auth/session",{headers:{cookie:studentCookies.refresh+"=revoked"}}));assert.equal(response.status,200);assert.equal((await response.json()).active,false);assert.equal(response.cookies.get(studentCookies.refresh)?.value,"");}
 finally{globalThis.fetch=original;}
});

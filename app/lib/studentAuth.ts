import crypto from "node:crypto";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { NextResponse } from "next/server.js";
import { cookie } from "./webAiAccess.ts";
export const studentCookies={access:"ns_student_access",id:"ns_student_id",refresh:"ns_student_refresh",oauth:"ns_student_oauth"};
export type StudentSession={studentId:string;email:string};
type TokenPair={access_token:string;id_token:string;refresh_token?:string;expires_in?:number};
export function studentAuthConfig(){
  const userPoolId=process.env.STUDENT_USER_POOL_ID?.trim(),clientId=process.env.STUDENT_CLIENT_ID?.trim(),domain=process.env.STUDENT_AUTH_DOMAIN?.trim(),secret=process.env.STUDENT_SESSION_SECRET?.trim();
  const site=new URL(process.env.NEXT_PUBLIC_SITE_URL||"https://www.novasproutlearning.com");
  if(!userPoolId||!clientId||!domain||!secret||secret.length<32)throw new Error("Student sign-in is not configured.");
  const authDomain=new URL(domain);
  if(authDomain.protocol!=="https:"||!authDomain.hostname.endsWith(".amazoncognito.com"))throw new Error("Invalid student sign-in domain.");
  return {userPoolId,clientId,domain:authDomain.origin,secret,site:site.origin,callback:site.origin+"/api/student-auth/callback"};
}
const verifiers=new Map<string,{access:ReturnType<typeof CognitoJwtVerifier.create>;id:ReturnType<typeof CognitoJwtVerifier.create>}>();
function tokenVerifiers(){
  const config=studentAuthConfig(),key=config.userPoolId+":"+config.clientId;
  if(!verifiers.has(key))verifiers.set(key,{access:CognitoJwtVerifier.create({userPoolId:config.userPoolId,clientId:config.clientId,tokenUse:"access"}),id:CognitoJwtVerifier.create({userPoolId:config.userPoolId,clientId:config.clientId,tokenUse:"id"})});
  return verifiers.get(key)!;
}
export async function verifyStudentTokens(access:string,id:string):Promise<StudentSession>{
  const verifier=tokenVerifiers();
  const [a,i]=await Promise.all([verifier.access.verify(access),verifier.id.verify(id)]);
  if(!a.sub||a.sub!==i.sub||i.email_verified!==true||typeof i.email!=="string")throw new Error("Sign in with a verified email.");
  return {studentId:a.sub,email:i.email};
}
export async function studentSession(request:Request):Promise<StudentSession|null>{
  try{return await verifyStudentTokens(cookie(request,studentCookies.access),cookie(request,studentCookies.id));}catch{return null;}
}
function same(a:string,b:string){return Boolean(a&&Buffer.byteLength(a)===Buffer.byteLength(b)&&crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b)));}
export function sealOAuth(value:{state:string;verifier:string;returnTo:string;expiresAt:number}){
  const body=Buffer.from(JSON.stringify(value)).toString("base64url");
  return body+"."+crypto.createHmac("sha256",studentAuthConfig().secret).update(body).digest("base64url");
}
export function readOAuth(value:string){
  try{
    if(value.length>3000)return null;
    const [body,signature,extra]=value.split(".");
    if(extra||!same(signature,crypto.createHmac("sha256",studentAuthConfig().secret).update(body).digest("base64url")))return null;
    const data=JSON.parse(Buffer.from(body,"base64url").toString());
    if(typeof data.state!=="string"||typeof data.verifier!=="string"||!Number.isFinite(data.expiresAt)||data.expiresAt<Date.now()||data.expiresAt>Date.now()+660000)return null;
    return {...data,returnTo:safeStudentReturn(data.returnTo)};
  }catch{return null;}
}
export function safeStudentReturn(value:unknown){return value==="/ai-lesson-generator#generator"||value==="/ai-lesson-generator"?value:"/library";}
export function validOAuthState(a:string,b:string){return same(a,b);}
export function studentMutationAllowed(request:Request){
  const origin=request.headers.get("origin");
  const expected=new URL(process.env.NEXT_PUBLIC_SITE_URL||"https://www.novasproutlearning.com").origin;
  if(!origin||(origin!==expected&&(process.env.NODE_ENV==="production"||origin!==new URL(request.url).origin))||request.headers.get("x-novasprout-library")!=="1")return false;
  const site=request.headers.get("sec-fetch-site");return !site||site==="same-origin"||site==="none";
}
const secure=()=>process.env.NODE_ENV==="production";
export function setStudentTokens(response:NextResponse,tokens:TokenPair){
  const base={httpOnly:true,secure:secure(),sameSite:"lax" as const,path:"/"};
  const maxAge=Math.min(900,Math.max(60,Number(tokens.expires_in)||900));
  response.cookies.set(studentCookies.access,tokens.access_token,{...base,maxAge});
  response.cookies.set(studentCookies.id,tokens.id_token,{...base,maxAge});
  if(tokens.refresh_token)response.cookies.set(studentCookies.refresh,tokens.refresh_token,{...base,maxAge:30*86400});
}
export function clearStudentCookies(response:NextResponse){
  for(const name of Object.values(studentCookies))response.cookies.set(name,"",{httpOnly:true,secure:secure(),sameSite:"lax",path:"/",maxAge:0});
}
export class StudentSessionExpired extends Error {}
export async function studentTokenRequest(body:URLSearchParams):Promise<TokenPair>{
  const config=studentAuthConfig();
  body.set("client_id",config.clientId);
  const response=await fetch(config.domain+"/oauth2/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body,cache:"no-store",signal:AbortSignal.timeout(12000)});
  if(!response.ok){const failure=await response.json().catch(()=>({}));if(failure.error==="invalid_grant")throw new StudentSessionExpired("Please sign in again.");throw new Error("Student sign-in is temporarily unavailable.");}
  const tokens=await response.json();
  if(typeof tokens.access_token!=="string"||typeof tokens.id_token!=="string")throw new Error("Invalid student session.");
  await verifyStudentTokens(tokens.access_token,tokens.id_token);
  return tokens;
}
const refreshes=new Map<string,Promise<TokenPair>>();
export function refreshStudentTokens(refresh:string){
  const key=crypto.createHash("sha256").update(refresh).digest("hex");
  if(!refreshes.has(key))refreshes.set(key,studentTokenRequest(new URLSearchParams({grant_type:"refresh_token",refresh_token:refresh})).finally(()=>refreshes.delete(key)));
  return refreshes.get(key)!;
}
export async function readSmallJson(request:Request,maximum=280000){
  const reader=request.body?.getReader();if(!reader)throw new Error("Request body is required.");
  const chunks:Uint8Array[]=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maximum){await reader.cancel();throw new Error("This request is too large.");}chunks.push(value);}}
  finally{reader.releaseLock();}
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export const studentResponseHeaders={"Cache-Control":"private, no-store","Vary":"Cookie"};

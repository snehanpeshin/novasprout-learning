import crypto from "node:crypto";
import { NextResponse } from "next/server.js";
import { studentAuthConfig, safeStudentReturn, sealOAuth, studentCookies } from "../../../lib/studentAuth.ts";
export const runtime="nodejs";
export async function GET(request:Request){
  try{
    const config=studentAuthConfig(),state=crypto.randomBytes(32).toString("base64url"),verifier=crypto.randomBytes(48).toString("base64url");
    const returnTo=safeStudentReturn(new URL(request.url).searchParams.get("returnTo"));
    const target=new URL(config.domain+"/oauth2/authorize");
    target.search=new URLSearchParams({response_type:"code",client_id:config.clientId,redirect_uri:config.callback,scope:"openid email",state,code_challenge_method:"S256",code_challenge:crypto.createHash("sha256").update(verifier).digest("base64url")}).toString();
    const response=NextResponse.redirect(target);response.headers.set("Cache-Control","no-store");response.headers.set("Referrer-Policy","no-referrer");
    response.cookies.set(studentCookies.oauth,sealOAuth({state,verifier,returnTo,expiresAt:Date.now()+600000}),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:600});
    return response;
  }catch{return NextResponse.redirect(new URL("/library?auth=unavailable",request.url));}
}

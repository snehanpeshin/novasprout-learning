import { NextResponse } from "next/server.js";
import { cookie } from "../../../lib/webAiAccess.ts";
import { studentAuthConfig, studentCookies, readOAuth, validOAuthState, studentTokenRequest, setStudentTokens } from "../../../lib/studentAuth.ts";
export const runtime="nodejs";
export async function GET(request:Request){
  const config=studentAuthConfig(),url=new URL(request.url),proof=readOAuth(cookie(request,studentCookies.oauth));
  let response:NextResponse;
  try{
    if(!proof||!validOAuthState(url.searchParams.get("state")||"",proof.state)||url.searchParams.has("error"))throw new Error("Invalid sign-in.");
    const code=url.searchParams.get("code");if(!code||code.length>3000)throw new Error("Invalid sign-in.");
    const tokens=await studentTokenRequest(new URLSearchParams({grant_type:"authorization_code",code,code_verifier:proof.verifier,redirect_uri:config.callback}));
    response=NextResponse.redirect(new URL(proof.returnTo,config.site));setStudentTokens(response,tokens);
  }catch{response=NextResponse.redirect(new URL("/library?auth=failed",config.site));}
  response.cookies.set(studentCookies.oauth,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0});
  response.headers.set("Cache-Control","no-store");response.headers.set("Referrer-Policy","no-referrer");return response;
}

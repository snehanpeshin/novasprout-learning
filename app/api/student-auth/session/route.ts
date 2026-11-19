import { NextResponse } from "next/server.js";
import { cookie } from "../../../lib/webAiAccess.ts";
import { StudentSessionExpired, studentAuthConfig, studentCookies, studentSession, refreshStudentTokens, verifyStudentTokens, setStudentTokens, clearStudentCookies, studentResponseHeaders } from "../../../lib/studentAuth.ts";
export const runtime="nodejs";
export async function GET(request:Request){
  try{studentAuthConfig();}catch{return NextResponse.json({configured:false,active:false},{headers:studentResponseHeaders});}
  const site=request.headers.get("sec-fetch-site");
  if(site==="cross-site")return NextResponse.json({error:"Use student sign-in from NovaSprout."},{status:403,headers:studentResponseHeaders});
  const existing=await studentSession(request);
  if(existing)return NextResponse.json({configured:true,active:true,accountId:existing.studentId,email:existing.email},{headers:studentResponseHeaders});
  const refresh=cookie(request,studentCookies.refresh);
  if(!refresh)return NextResponse.json({configured:true,active:false},{headers:studentResponseHeaders});
  try{
    const tokens=await refreshStudentTokens(refresh),session=await verifyStudentTokens(tokens.access_token,tokens.id_token);
    const response=NextResponse.json({configured:true,active:true,accountId:session.studentId,email:session.email},{headers:studentResponseHeaders});setStudentTokens(response,tokens);return response;
  }catch(error){
    if(!(error instanceof StudentSessionExpired))return NextResponse.json({configured:true,active:false,error:"Student sign-in could not be checked. Try again shortly."},{status:503,headers:studentResponseHeaders});
    const response=NextResponse.json({configured:true,active:false,message:"Please sign in again to continue saving."},{headers:studentResponseHeaders});clearStudentCookies(response);return response;
  }
}

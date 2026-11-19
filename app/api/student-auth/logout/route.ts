import { NextResponse } from "next/server.js";
import { cookie } from "../../../lib/webAiAccess.ts";
import { studentAuthConfig, studentCookies, studentMutationAllowed, clearStudentCookies, studentResponseHeaders } from "../../../lib/studentAuth.ts";
export const runtime="nodejs";
export async function POST(request:Request){
  if(!studentMutationAllowed(request))return NextResponse.json({error:"Use sign out from your library."},{status:403,headers:studentResponseHeaders});
  const config=studentAuthConfig(),refresh=cookie(request,studentCookies.refresh);
  if(refresh){try{await fetch(config.domain+"/oauth2/revoke",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:config.clientId,token:refresh}),signal:AbortSignal.timeout(8000)});}catch{}}
  const target=new URL(config.domain+"/logout");target.search=new URLSearchParams({client_id:config.clientId,logout_uri:config.site+"/library"}).toString();
  const response=NextResponse.json({url:target.toString()},{headers:studentResponseHeaders});clearStudentCookies(response);return response;
}

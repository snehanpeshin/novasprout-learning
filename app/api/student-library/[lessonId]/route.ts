import { NextResponse } from "next/server.js";
import { studentSession,studentMutationAllowed,readSmallJson,studentResponseHeaders } from "../../../lib/studentAuth.ts";
import { getStudentLesson,updateStudentProgress,deleteStudentLesson,LibraryConflict } from "../../../lib/studentLibraryStore.ts";
export const runtime="nodejs";
async function identity(request:Request,context:{params:Promise<{lessonId:string}>}){
  const session=await studentSession(request),{lessonId}=await context.params;
  return {session,lessonId,valid:/^[a-f0-9]{32}$/.test(lessonId)};
}
type Context={params:Promise<{lessonId:string}>};
export async function GET(request:Request,context:Context){
  const {session,lessonId,valid}=await identity(request,context);
  if(!session)return NextResponse.json({error:"Sign in to continue learning."},{status:401,headers:studentResponseHeaders});
  if(request.headers.get("x-student-account")!==session.studentId)return NextResponse.json({error:"Your signed-in account changed. Reload your library."},{status:409,headers:studentResponseHeaders});
  if(!valid)return NextResponse.json({error:"Lesson not found."},{status:404,headers:studentResponseHeaders});
  try{const record=await getStudentLesson(session.studentId,lessonId);return NextResponse.json(record?{lesson:record}:{error:"Lesson not found."},{status:record?200:404,headers:studentResponseHeaders});}
  catch{return NextResponse.json({error:"This saved lesson could not be loaded."},{status:503,headers:studentResponseHeaders});}
}
export async function PATCH(request:Request,context:Context){
  if(!studentMutationAllowed(request))return NextResponse.json({error:"Save progress from NovaSprout."},{status:403,headers:studentResponseHeaders});
  const {session,lessonId,valid}=await identity(request,context);
  if(!session)return NextResponse.json({error:"Sign in to save your progress."},{status:401,headers:studentResponseHeaders});
  if(request.headers.get("x-student-account")!==session.studentId)return NextResponse.json({error:"Your signed-in account changed. Reload your library."},{status:409,headers:studentResponseHeaders});
  if(!valid)return NextResponse.json({error:"Lesson not found."},{status:404,headers:studentResponseHeaders});
  let body;
  try{body=await readSmallJson(request,120000);if(!Number.isSafeInteger(body.version)||body.version<1)throw new Error("Reload the latest lesson before saving.");}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid progress."},{status:400,headers:studentResponseHeaders});}
  try{const saved=await updateStudentProgress(session.studentId,lessonId,body.progress,body.version);return NextResponse.json(saved||{error:"Lesson not found."},{status:saved?200:404,headers:studentResponseHeaders});}
  catch(error){const conflict=error instanceof LibraryConflict;return NextResponse.json({error:conflict?error.message:"Progress could not be saved. Your work remains on this page."},{status:conflict?409:503,headers:studentResponseHeaders});}
}
export async function DELETE(request:Request,context:Context){
  if(!studentMutationAllowed(request))return NextResponse.json({error:"Remove lessons from NovaSprout."},{status:403,headers:studentResponseHeaders});
  const {session,lessonId,valid}=await identity(request,context);
  if(!session)return NextResponse.json({error:"Sign in to remove a saved lesson."},{status:401,headers:studentResponseHeaders});
  if(request.headers.get("x-student-account")!==session.studentId)return NextResponse.json({error:"Your signed-in account changed. Reload your library."},{status:409,headers:studentResponseHeaders});
  if(!valid)return NextResponse.json({error:"Lesson not found."},{status:404,headers:studentResponseHeaders});
  try{await deleteStudentLesson(session.studentId,lessonId);return NextResponse.json({deleted:true},{headers:studentResponseHeaders});}
  catch{return NextResponse.json({error:"The lesson could not be removed."},{status:503,headers:studentResponseHeaders});}
}

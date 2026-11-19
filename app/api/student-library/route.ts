import { NextResponse } from "next/server.js";
import { studentSession,studentMutationAllowed,readSmallJson,studentResponseHeaders } from "../../lib/studentAuth.ts";
import { prepareSavedLesson,validateLessonContext } from "../../lib/lessonLibrary.ts";
import { listStudentLessons,saveStudentLesson } from "../../lib/studentLibraryStore.ts";
export const runtime="nodejs";
export async function GET(request:Request){
  const session=await studentSession(request);if(!session)return NextResponse.json({error:"Sign in to open your saved lessons."},{status:401,headers:studentResponseHeaders});
  if(request.headers.get("x-student-account")!==session.studentId)return NextResponse.json({error:"Your signed-in account changed. Reload your library."},{status:409,headers:studentResponseHeaders});
  try{return NextResponse.json(await listStudentLessons(session.studentId,new URL(request.url).searchParams.get("cursor")||undefined),{headers:studentResponseHeaders});}
  catch(error){const invalid=error instanceof Error&&error.message==="Invalid library page.";return NextResponse.json({error:invalid?error.message:"Your library could not be loaded. Please try again."},{status:invalid?400:503,headers:studentResponseHeaders});}
}
export async function POST(request:Request){
  if(!studentMutationAllowed(request))return NextResponse.json({error:"Save lessons from NovaSprout."},{status:403,headers:studentResponseHeaders});
  const session=await studentSession(request);if(!session)return NextResponse.json({error:"Sign in before saving this lesson."},{status:401,headers:studentResponseHeaders});
  let lesson,context,progress;
  if(request.headers.get("x-student-account")!==session.studentId)return NextResponse.json({error:"Your signed-in account changed. Reload your library."},{status:409,headers:studentResponseHeaders});
  try{const body=await readSmallJson(request);lesson=prepareSavedLesson(body.lesson);context=validateLessonContext(body.context);progress=body.progress;}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"This lesson could not be saved."},{status:400,headers:studentResponseHeaders});}
  if(request.headers.get("x-student-account")!==session.studentId)return NextResponse.json({error:"Your signed-in account changed. Reload your library."},{status:409,headers:studentResponseHeaders});
  try{const record=await saveStudentLesson(session.studentId,lesson,context,progress);return NextResponse.json({lessonId:record.lessonId,version:record.version,updatedAt:record.updatedAt,alreadySaved:record.alreadySaved},{headers:studentResponseHeaders});}
  catch{return NextResponse.json({error:"This lesson could not be saved just now. Keep this page open and try again."},{status:503,headers:studentResponseHeaders});}
}

import crypto from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { emptyProgress, normalizeLessonProgress, progressSummary, type SavedLessonContent, type LessonContext, type SavedLesson, type LessonProgress } from "./lessonLibrary.ts";
const database=DynamoDBDocumentClient.from(new DynamoDBClient({region:process.env.STUDENT_AUTH_REGION||"us-east-1",maxAttempts:2}),{marshallOptions:{removeUndefinedValues:true}});
function table(){const name=process.env.STUDENT_LIBRARY_TABLE?.trim();if(!name)throw new Error("The student library is not configured.");return name;}
const options=()=>({abortSignal:AbortSignal.timeout(8000)});
export function lessonKey(lesson: SavedLessonContent){return crypto.createHash("sha256").update(JSON.stringify(lesson)).digest("hex").slice(0,32);}
function publicRecord(item:any):SavedLesson {const {studentId,...record}=item;return record as SavedLesson;}
export async function getStudentLesson(studentId:string,lessonId:string):Promise<SavedLesson|null>{
  const result=await database.send(new GetCommand({TableName:table(),Key:{studentId,lessonId},ConsistentRead:true}),options());
  return result.Item?publicRecord(result.Item):null;
}
export async function saveStudentLesson(studentId:string,lesson:SavedLessonContent,context:LessonContext,progress?:unknown){
  const lessonId=lessonKey(lesson),now=new Date().toISOString(),clean=normalizeLessonProgress(progress??emptyProgress(),lesson);
  const record={studentId,lessonId,lesson,...context,title:lesson.title,progress:clean,createdAt:now,updatedAt:now,version:1,...progressSummary(lesson,clean)};
  if(Buffer.byteLength(JSON.stringify(record),"utf8")>340000)throw new Error("The lesson and its progress are too large to save.");
  try {await database.send(new PutCommand({TableName:table(),Item:record,ConditionExpression:"attribute_not_exists(studentId) AND attribute_not_exists(lessonId)"}),options());return {...publicRecord(record),alreadySaved:false};}
  catch(error){if(error instanceof Error&&error.name==="ConditionalCheckFailedException"){const existing=await getStudentLesson(studentId,lessonId);if(existing)return {...existing,alreadySaved:true};}throw error;}
}
export async function listStudentLessons(studentId:string,cursor?:string){
  let key:Record<string,unknown>|undefined;
  if(cursor){
    if(cursor.length>2000)throw new Error("Invalid library page.");
    try{key=JSON.parse(Buffer.from(cursor,"base64url").toString("utf8"));}catch{throw new Error("Invalid library page.");}
    if(!key||key.studentId!==studentId||typeof key.lessonId!=="string"||typeof key.updatedAt!=="string")throw new Error("Invalid library page.");
  }
  const result=await database.send(new QueryCommand({TableName:table(),IndexName:"student-updated",KeyConditionExpression:"studentId = :student",ExpressionAttributeValues:{":student":studentId},ScanIndexForward:false,Limit:20,ExclusiveStartKey:key}),options());
  return {lessons:(result.Items??[]).map(publicRecord),cursor:result.LastEvaluatedKey?Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64url"):null};
}
export class LibraryConflict extends Error {}
export async function updateStudentProgress(studentId:string,lessonId:string,progress:unknown,version:number){
  const existing=await getStudentLesson(studentId,lessonId);if(!existing)return null;
  const clean=normalizeLessonProgress(progress,existing.lesson,existing.progress);
  const summary=progressSummary(existing.lesson,clean),updatedAt=new Date().toISOString();
  try{
    await database.send(new UpdateCommand({TableName:table(),Key:{studentId,lessonId},ConditionExpression:"attribute_exists(lessonId) AND #version = :expected",
      UpdateExpression:"SET progress = :progress, #version = :version, updatedAt = :updated, #percent = :percent, completedParts = :completed, totalParts = :total, firstTry = :first, corrected = :corrected, totalChecks = :checks",
      ExpressionAttributeNames:{"#version":"version","#percent":"percent"},
      ExpressionAttributeValues:{":expected":version,":version":version+1,":progress":clean,":updated":updatedAt,":percent":summary.percent,":completed":summary.completedParts,":total":summary.totalParts,":first":summary.firstTry,":corrected":summary.corrected,":checks":summary.totalChecks}}),options());
    return {version:version+1,updatedAt,progress:clean,...summary};
  }catch(error){if(error instanceof Error&&error.name==="ConditionalCheckFailedException")throw new LibraryConflict("This lesson changed in another tab or device. Reload its latest progress.");throw error;}
}
export async function deleteStudentLesson(studentId:string,lessonId:string){
  await database.send(new DeleteCommand({TableName:table(),Key:{studentId,lessonId}}),options());
}

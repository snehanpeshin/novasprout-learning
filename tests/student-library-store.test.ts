import test from "node:test";
import assert from "node:assert/strict";
import {DynamoDBDocumentClient,GetCommand,PutCommand,UpdateCommand,QueryCommand,DeleteCommand} from "@aws-sdk/lib-dynamodb";
import sample from "../app/data/novasprout-ratios-sample.json" with {type:"json"};
import {prepareSavedLesson,emptyProgress} from "../app/lib/lessonLibrary.ts";
import {saveStudentLesson,getStudentLesson,listStudentLessons,updateStudentProgress,deleteStudentLesson,LibraryConflict} from "../app/lib/studentLibraryStore.ts";
process.env.STUDENT_LIBRARY_TABLE="test-student-library";
async function mocked(action:(state:{items:Map<string,any>;calls:any[]})=>Promise<void>){
 const original=DynamoDBDocumentClient.prototype.send,items=new Map<string,any>(),calls:any[]=[];
 DynamoDBDocumentClient.prototype.send=(async(command:any)=>{
  const input:any=command.input;calls.push(input);
  const key=input.Key?input.Key.studentId+":"+input.Key.lessonId:"";
  if(command instanceof GetCommand)return {Item:items.has(key)?structuredClone(items.get(key)):undefined};
  if(command instanceof PutCommand){const k=input.Item.studentId+":"+input.Item.lessonId;if(items.has(k))throw Object.assign(new Error("exists"),{name:"ConditionalCheckFailedException"});items.set(k,structuredClone(input.Item));return {};}
  if(command instanceof UpdateCommand){const item=items.get(key),v=input.ExpressionAttributeValues;if(!item||item.version!==v[":expected"])throw Object.assign(new Error("stale"),{name:"ConditionalCheckFailedException"});Object.assign(item,{version:v[":version"],progress:v[":progress"],updatedAt:v[":updated"]});return {};}
  if(command instanceof DeleteCommand){items.delete(key);return {};}
  if(command instanceof QueryCommand)return {Items:[...items.values()].filter(item=>item.studentId===input.ExpressionAttributeValues[":student"]).map(({lesson,progress,...item})=>item)};
  throw new Error("Unexpected command");
 }) as any;
 try{await action({items,calls});}finally{DynamoDBDocumentClient.prototype.send=original;}
}
const lesson=prepareSavedLesson(sample),context={grade:"Grades 6-8",subject:"Mathematics",topic:"Ratios"};
test("a different signed-in account cannot read or delete another account's saved lesson",async()=>mocked(async()=>{
 const saved=await saveStudentLesson("student-a",lesson,context);
 assert.equal(await getStudentLesson("student-b",saved.lessonId),null);
 await deleteStudentLesson("student-b",saved.lessonId);
 assert((await getStudentLesson("student-a",saved.lessonId))?.lesson);
 const list=await listStudentLessons("student-a");assert.equal(list.lessons.length,1);assert.equal((list.lessons[0] as any).studentId,undefined);
 assert.equal((await listStudentLessons("student-b")).lessons.length,0);
}));
test("saving the same lesson twice does not overwrite existing progress",async()=>mocked(async()=>{
 const first=await saveStudentLesson("student-a",lesson,context);
 const progress={...emptyProgress(),attempts:{notice:"My own saved attempt"}};
 await updateStudentProgress("student-a",first.lessonId,progress,1);
 const duplicate=await saveStudentLesson("student-a",lesson,context);
 assert.equal(duplicate.alreadySaved,true);assert.equal(duplicate.version,2);assert.equal(duplicate.progress.attempts.notice,"My own saved attempt");
}));
test("concurrent devices cannot silently overwrite one another's progress",async()=>mocked(async()=>{
 const saved=await saveStudentLesson("student-a",lesson,context);
 const results=await Promise.allSettled([updateStudentProgress("student-a",saved.lessonId,{...emptyProgress(),attempts:{notice:"First device"}},1),updateStudentProgress("student-a",saved.lessonId,{...emptyProgress(),attempts:{notice:"Second device"}},1)]);
 assert.equal(results.filter(result=>result.status==="fulfilled").length,1);
 const rejected=results.find(result=>result.status==="rejected") as PromiseRejectedResult;assert(rejected.reason instanceof LibraryConflict);
}));
test("a forged pagination cursor cannot choose another student's partition",async()=>mocked(async state=>{
 const cursor=Buffer.from(JSON.stringify({studentId:"student-a",lessonId:"id",updatedAt:"now"})).toString("base64url");
 await assert.rejects(listStudentLessons("student-b",cursor),/Invalid library page/);assert.equal(state.calls.length,0);
}));
test("deleted lessons cannot be recreated by a late autosave",async()=>mocked(async()=>{
 const saved=await saveStudentLesson("student-a",lesson,context);await deleteStudentLesson("student-a",saved.lessonId);
 assert.equal(await updateStudentProgress("student-a",saved.lessonId,emptyProgress(),1),null);
}));

import { buildLearningMoments, type InteractiveLesson } from "./interactiveLesson.ts";
import { summarizeChecks, checkComplete, type CheckRecord } from "./masteryLearning.ts";
export type SavedLessonContent = InteractiveLesson & { title: string; [key: string]: unknown };
export type LessonContext = { grade: string; subject: string; topic: string };
export type LessonProgress = { index: number; beat: number; attempts: Record<string,string>; revealed: Record<string,boolean>; choices: Record<string,number>; hints: Record<string,boolean>; checks: Record<string,CheckRecord>; completed: string[] };
export type LessonSummary = LessonContext & { lessonId: string; title: string; createdAt: string; updatedAt: string; version: number; percent: number; completedParts: number; totalParts: number; firstTry: number; corrected: number; totalChecks: number };
export type SavedLesson = LessonSummary & { lesson: SavedLessonContent; progress: LessonProgress };
export const emptyProgress = (): LessonProgress => ({ index:0, beat:0, attempts:{}, revealed:{}, choices:{}, hints:{}, checks:{}, completed:[] });
function object(value: unknown): Record<string,any> { return value && typeof value==="object" && !Array.isArray(value) ? value as Record<string,any> : {}; }
function text(value: unknown, limit: number, required=false) {
  if (typeof value!=="string" || value.length>limit || (required&&!value.trim())) throw new Error("The saved lesson has invalid text.");
  return value;
}
function strings(value: unknown, limit=150) {
  if (!Array.isArray(value)||value.length>limit) throw new Error("The saved lesson has invalid sections.");
  return value.map(item=>text(item,8000));
}
function integer(value: unknown, min: number, max: number, fallback=0) {
  return typeof value==="number"&&Number.isSafeInteger(value)&&value>=min&&value<=max ? value : fallback;
}
export function validateLessonContext(value: unknown): LessonContext {
  const v=object(value);
  return {grade:text(v.grade,80,true),subject:text(v.subject,100,true),topic:text(v.topic,180,true)};
}
export function prepareSavedLesson(value: unknown): SavedLessonContent {
  const v=object(value), result: Record<string,any>={title:text(v.title,250,true)};
  for(const key of ["warmUp","conceptExplanation","guidedExample","studentFit","duration","mode","recommendedNextSession","parentTutorNotes"]) if(v[key]!==undefined) result[key]=text(v[key],16000);
  for(const key of ["learningObjectives","prerequisiteCheck","practiceQuestions","quickAssessment"]) if(v[key]!==undefined) result[key]=strings(v[key]);
  if(v.fullLessonSegments!==undefined){
    if(!Array.isArray(v.fullLessonSegments)||v.fullLessonSegments.length>50)throw new Error("Invalid lesson sections.");
    result.fullLessonSegments=v.fullLessonSegments.map((raw:unknown)=>{const s=object(raw);return {title:text(s.title,200,true),activity:text(s.activity,16000,true),time:text(s.time??"",100)};});
  }
  if(v.conceptModel!==undefined){
    const m=object(v.conceptModel);
    if(!Array.isArray(m.nodes)||m.nodes.length>80||!Array.isArray(m.misconceptions)||m.misconceptions.length>40||!Array.isArray(m.relationships)||m.relationships.length>100)throw new Error("Invalid concept model.");
    result.conceptModel={
      nodes:m.nodes.map((raw:unknown)=>{const n=object(raw);return {id:text(n.id,100,true),label:text(n.label,250,true),definition:text(n.definition,8000,true)};}),
      misconceptions:m.misconceptions.map((raw:unknown)=>{const n=object(raw);return {statement:text(n.statement,8000,true),correction:text(n.correction,8000,true)};}),
      relationships:m.relationships.map((raw:unknown)=>{const n=object(raw);return {from:text(n.from,100,true),to:text(n.to,100,true),relationship:text(n.relationship,500,true),explanation:text(n.explanation,8000,true)};})
    };
  }
  if(v.timedExam!==undefined){
    const exam=object(v.timedExam);
    if(!Array.isArray(exam.questions)||exam.questions.length>20)throw new Error("Invalid lesson checks.");
    result.timedExam={durationMinutes:integer(exam.durationMinutes,1,180,10),passingScore:integer(exam.passingScore,0,100,70),questions:exam.questions.map((raw:unknown)=>{
      const q=object(raw), options=strings(q.options,6);
      if(options.length<2||!Number.isInteger(q.answerIndex)||q.answerIndex<0||q.answerIndex>=options.length)throw new Error("Invalid check answer.");
      return {question:text(q.question,5000,true),options,answerIndex:q.answerIndex,explanation:text(q.explanation??"",8000)};
    })};
  }
  const lesson=result as SavedLessonContent, moments=buildLearningMoments(lesson);
  if(!moments.length||moments.length>150||new TextEncoder().encode(JSON.stringify(lesson)).length>220000)throw new Error("This lesson is too large or incomplete to save.");
  return lesson;
}
export function normalizeLessonProgress(value: unknown, lesson: InteractiveLesson, previous?: LessonProgress): LessonProgress {
  const raw=object(value), moments=buildLearningMoments(lesson), clean=emptyProgress();
  clean.index=integer(raw.index,0,Math.max(0,moments.length-1));
  clean.beat=integer(raw.beat,0,Math.max(0,(moments[clean.index]?.beats.length??1)-1));
  const allowed=new Set(moments.map(moment=>moment.id));
  for(const moment of moments){
    const id=moment.id, attempt=object(raw.attempts)[id], choice=object(raw.choices)[id], check=object(object(raw.checks)[id]);
    if(typeof attempt==="string")clean.attempts[id]=attempt.slice(0,1200);
    for(const key of ["revealed","hints"] as const) if(typeof object(raw[key])[id]==="boolean")clean[key][id]=object(raw[key])[id];
    if(moment.options&&Number.isInteger(choice)&&choice>=0&&choice<moment.options.length)clean.choices[id]=choice;
    if(moment.options&&Number.isInteger(check.latestChoice)&&check.latestChoice>=0&&check.latestChoice<moment.options.length&&Number.isInteger(check.firstChoice)&&check.firstChoice>=0&&check.firstChoice<moment.options.length){
      const before=previous?.checks[id];
      clean.checks[id]={firstChoice:before?.firstChoice??check.firstChoice,latestChoice:check.latestChoice,submissions:Math.max(before?.submissions??0,integer(check.submissions,1,10000,1))};
    } else if(previous?.checks[id])clean.checks[id]=previous.checks[id];
  }
  clean.completed=Array.from(new Set((Array.isArray(raw.completed)?raw.completed:[]).filter((id:unknown):id is string=>typeof id==="string"&&allowed.has(id))));
  clean.completed=clean.completed.filter(id=>{const moment=moments.find(item=>item.id===id)!;return !moment.options||checkComplete(clean.checks[id],moment.answerIndex);});
  if(new TextEncoder().encode(JSON.stringify(clean)).length>80000)throw new Error("Progress is too large to save. Shorten some written attempts.");
  return clean;
}
export function progressSummary(lesson: InteractiveLesson, progress: LessonProgress) {
  const moments=buildLearningMoments(lesson), summary=summarizeChecks(moments.filter(moment=>moment.options),progress.checks);
  return {percent:moments.length?Math.floor(progress.completed.length/moments.length*100):0,completedParts:progress.completed.length,totalParts:moments.length,firstTry:summary.firstTry,corrected:summary.corrected,totalChecks:summary.total};
}

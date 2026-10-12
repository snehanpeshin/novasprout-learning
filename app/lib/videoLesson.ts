export type VideoVisual = { kind:"fraction"|"sequence"|"comparison"|"bar_chart"|"number_line"|"equation"|"labeled_parts"; representation:"bar"|"circle"|"none"; labels:string[]; values:number[]; total:number; selected:number; min:number; max:number };
export type VideoScene = {title:string;narration:string;caption:string;visual:VideoVisual};
export type VideoCheck = {question:string;options:string[];answerIndex:number;explanation:string};
export type VideoLesson = {title:string;scenes:VideoScene[];check:VideoCheck};
const text={type:"string"};
const visual={type:"object",additionalProperties:false,properties:{kind:{type:"string",enum:["fraction","sequence","comparison","bar_chart","number_line","equation","labeled_parts"]},representation:{type:"string",enum:["bar","circle","none"]},labels:{type:"array",items:text},values:{type:"array",items:{type:"number"}},total:{type:"integer"},selected:{type:"integer"},min:{type:"number"},max:{type:"number"}},required:["kind","representation","labels","values","total","selected","min","max"]};
export const videoLessonSchema={type:"object",additionalProperties:false,properties:{title:text,scenes:{type:"array",minItems:3,maxItems:4,items:{type:"object",additionalProperties:false,properties:{title:text,narration:text,caption:text,visual},required:["title","narration","caption","visual"]}}},required:["title","scenes"]};
function boundedText(value:unknown,max:number,min=1):value is string {return typeof value==="string"&&value.trim().length>=min&&value.length<=max;}
export function validateVideoStoryboard(value:any):value is {title:string;scenes:VideoScene[]} {
 if(!value||!boundedText(value.title,100)||!Array.isArray(value.scenes)||value.scenes.length<3||value.scenes.length>4)return false;
 return value.scenes.every((s:any)=>{
  if(!s||!boundedText(s.title,68)||!boundedText(s.narration,600,20)||s.narration.trim().split(/\s+/).length>55||!boundedText(s.caption,110))return false;
  const v=s.visual;if(!v||!["bar","circle","none"].includes(v.representation)||!["fraction","sequence","comparison","bar_chart","number_line","equation","labeled_parts"].includes(v.kind)||!Array.isArray(v.labels)||!Array.isArray(v.values)||v.labels.length>5||v.values.length>5||!v.labels.every((x:any)=>boundedText(x,48))||!v.values.every((x:any)=>typeof x==="number"&&Number.isFinite(x)&&Math.abs(x)<=1000000)||![v.min,v.max,v.total,v.selected].every(Number.isFinite))return false;
  if(v.kind==="fraction")return v.representation!=="none"&&Number.isInteger(v.total)&&v.total>=2&&v.total<=12&&Number.isInteger(v.selected)&&v.selected>=0&&v.selected<=v.total&&v.labels.length<=2&&v.values.length===0;
  if(v.kind==="bar_chart")return v.labels.length>=2&&v.labels.every((x:string)=>x.length<=20)&&v.values.length===v.labels.length&&v.values.every((x:number)=>x>=0)&&Math.max(...v.values)>0;
  if(v.kind==="number_line")return v.min<v.max&&Math.abs(v.min)<=1000000&&Math.abs(v.max)<=1000000&&v.labels.every((x:string)=>x.length<=20)&&v.labels.length===v.values.length&&v.values.length>=1&&v.values.length<=3&&v.values.every((x:number)=>x>=v.min&&x<=v.max);
  if(v.kind==="comparison"&&v.representation==="bar")return v.labels.length===2&&v.labels.every((x:string)=>{const matches=x.match(/\b\d{1,2}\/\d{1,2}\b/g),m=x.match(/\b(\d{1,2})\/(\d{1,2})\b/);return matches?.length===1&&m&&Number(m[2])>=2&&Number(m[2])<=12&&Number(m[1])<=Number(m[2]);})&&v.values.length===0;
  return v.representation==="none"&&v.labels.length>=2&&v.values.length===0;
 });
}
export function validVideoCheck(q:any):q is VideoCheck {return q&&boundedText(q.question,1000)&&Array.isArray(q.options)&&q.options.length===4&&q.options.every((o:any)=>boundedText(o,300))&&new Set(q.options).size===4&&Number.isInteger(q.answerIndex)&&q.answerIndex>=0&&q.answerIndex<4&&boundedText(q.explanation,1400);}
export function validVideoLesson(v:any):v is VideoLesson{return validateVideoStoryboard(v)&&validVideoCheck((v as any).check);}

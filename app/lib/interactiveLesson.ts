export type InteractiveLesson = {
  title?: string; warmUp?: string; conceptExplanation?: string; guidedExample?: string;
  learningObjectives?: string[]; practiceQuestions?: string[]; quickAssessment?: string[];
  fullLessonSegments?: {title:string;activity:string;time:string}[];
  conceptModel?: {nodes: {id:string;label:string;definition:string}[]; misconceptions:{statement:string;correction:string}[]; relationships:{from:string;to:string;relationship:string;explanation:string}[]};
  timedExam?: {questions:{question:string;options:string[];answerIndex:number;explanation:string}[]};
};
export type LearningMoment = {id:string;kind:"discover"|"explain"|"model"|"practice"|"check"|"reflect";title:string;beats:string[];prompt?:string;hint?:string;answer?:string;options?:string[];answerIndex?:number;explanation?:string};
// Split at complete sentences or explicit worked steps; never clip a mathematical statement.
export function teachingBeats(text = "") {
  return text.split(/(?:\r?\n)+|(?=\bStep \d+[:.)])/).flatMap(line => line.trim().split(/(?<=[.!?])\s+(?=[A-Z])/)).map(s=>s.trim()).filter(Boolean);
}
export function practiceParts(text:string) {
  const marker = text.search(/\b(?:Hint|Answer|Why|Explanation):/i);
  const prompt = (marker < 0 ? text : text.slice(0,marker)).replace(/^Try:\s*/i, "").trim();
  const hint = text.match(/\bHint:\s*([\s\S]*?)(?=\b(?:Answer|Why|Explanation):|$)/i)?.[1]?.trim();
  const answer = text.match(/\bAnswer:\s*([\s\S]*?)(?=\b(?:Why|Explanation):|$)/i)?.[1]?.trim();
  const why = text.match(/\b(?:Why|Explanation):\s*([\s\S]*)/i)?.[1]?.trim();
  return {prompt,hint,answer:[answer,why].filter(Boolean).join(" ") || undefined};
}
export function buildLearningMoments(lesson:InteractiveLesson):LearningMoment[] {
  const moments:LearningMoment[]=[];
  if(lesson.warmUp) { const p=practiceParts(lesson.warmUp); moments.push({id:"notice",kind:"discover",title:"Notice and wonder",beats:[],...p}); }
  if(lesson.conceptExplanation) moments.push({id:"idea",kind:"explain",title:"Build the idea",beats:teachingBeats(lesson.conceptExplanation)});
  if(lesson.guidedExample) moments.push({id:"model",kind:"model",title:"Watch the reasoning",beats:teachingBeats(lesson.guidedExample)});
  // Interleave application after small teaching sections instead of stacking all reading first.
  const segments=lesson.fullLessonSegments || [], practice=lesson.practiceQuestions || [];
  const count=Math.max(segments.length,practice.length);
  for(let i=0;i<count;i++) {
    if(segments[i]) moments.push({id:`concept-${i}`,kind:"explain",title:segments[i].title,beats:teachingBeats(segments[i].activity)});
    if(practice[i]) moments.push({id:`try-${i}`,kind:"practice",title:`Your turn ${i+1}`,beats:[],...practiceParts(practice[i])});
  }
  for(const [i,item] of (lesson.conceptModel?.misconceptions || []).entries()) moments.push({id:`repair-${i}`,kind:"reflect",title:"Spot the mix-up",beats:[],prompt:`What would you change about this claim? ${item.statement}`,answer:item.correction});
  for(const [i,q] of (lesson.timedExam?.questions || []).entries()) moments.push({id:`check-${i}`,kind:"check",title:`Check your understanding ${i+1}`,beats:[],prompt:q.question,options:q.options,answerIndex:q.answerIndex,explanation:q.explanation});
  return moments;
}
export function narrationFor(moment:LearningMoment, beatIndex?:number) {
  // Question narration excludes hints, solutions, answer indices and quiz explanations.
  return [moment.title,...(beatIndex === undefined ? moment.beats : moment.beats.slice(beatIndex,beatIndex+1)),moment.prompt].filter(Boolean).join(". ").slice(0,4096);
}

import test from "node:test";
import assert from "node:assert/strict";
import sample from "../app/data/novasprout-ratios-sample.json" with {type:"json"};
import {buildLearningMoments} from "../app/lib/interactiveLesson.ts";
import {prepareSavedLesson,normalizeLessonProgress,emptyProgress,progressSummary,validateLessonContext} from "../app/lib/lessonLibrary.ts";
test("saved lessons preserve every interactive learning moment in the existing sample",()=>{
 const clean=prepareSavedLesson(sample);
 assert.deepEqual(buildLearningMoments(clean),buildLearningMoments(sample));
 assert.equal(clean.title,sample.title);
});
test("saving strips unknown access codes, tokens, owners, and executable-shaped extra fields",()=>{
 const clean=prepareSavedLesson({...sample,accessToken:"private",lessonTicket:"ticket",studentId:"other",OPENAI_API_KEY:"never-store",unknown:{script:"bad"}});
 for(const field of ["accessToken","lessonTicket","studentId","OPENAI_API_KEY","unknown"])assert.equal(clean[field],undefined);
});
test("malformed saved content is rejected before it can break the learning player",()=>{
 assert.throws(()=>prepareSavedLesson({title:"No learning content"}));
 assert.throws(()=>prepareSavedLesson({...sample,timedExam:{questions:[{question:"test",options:["A","B"],answerIndex:7}]}}));
 assert.throws(()=>prepareSavedLesson({...sample,conceptExplanation:{html:"bad"}}));
 assert.throws(()=>validateLessonContext({grade:"Grade 4",subject:"Math",topic:"x".repeat(181)}));
});
test("resume snapshots clamp invalid positions and reject invented learning-part identifiers",()=>{
 const lesson=prepareSavedLesson(sample);
 const progress=normalizeLessonProgress({index:9999,beat:-20,completed:["not-a-real-part","notice","notice"],attempts:{"not-a-real-part":"private"}},lesson);
 assert.equal(progress.index,0);assert.equal(progress.beat,0);assert.deepEqual(progress.completed,["notice"]);assert.equal(progress.attempts["not-a-real-part"],undefined);
});
test("first-choice history survives later corrections and cannot be rewritten by a new snapshot",()=>{
 const lesson=prepareSavedLesson(sample),moment=buildLearningMoments(lesson).find(item=>item.options)!;
 const wrong=(moment.answerIndex!+1)%moment.options!.length;
 const previous={...emptyProgress(),checks:{[moment.id]:{firstChoice:wrong,latestChoice:wrong,submissions:1}}};
 const progress=normalizeLessonProgress({checks:{[moment.id]:{firstChoice:moment.answerIndex,latestChoice:moment.answerIndex,submissions:2}},completed:[moment.id]},lesson,previous);
 assert.equal(progress.checks[moment.id].firstChoice,wrong);
 const summary=progressSummary(lesson,progress);
 assert.equal(summary.firstTry,0);assert.equal(summary.corrected,1);assert.equal(summary.completedParts,1);
});
test("uncorrected quiz checks never count as completed learning parts",()=>{
 const lesson=prepareSavedLesson(sample),moment=buildLearningMoments(lesson).find(item=>item.options)!;
 const progress=normalizeLessonProgress({completed:[moment.id],checks:{[moment.id]:{firstChoice:(moment.answerIndex!+1)%4,latestChoice:(moment.answerIndex!+1)%4,submissions:1}}},lesson);
 assert.equal(progress.completed.length,0);
});
test("UTF-8 storage limits apply to actual bytes rather than only character counts",()=>{
 assert.throws(()=>prepareSavedLesson({...sample,practiceQuestions:Array.from({length:20},()=>"漢".repeat(7000))}));
});

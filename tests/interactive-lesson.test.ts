import test from "node:test";
import assert from "node:assert/strict";
import {buildLearningMoments,teachingBeats,practiceParts,narrationFor} from "../app/lib/interactiveLesson.ts";
test("teaching beats preserve decimals, equations and numbered reasoning",()=>{
 const text="Step 1: Add 0.5 + 0.25 = 0.75. Step 2: Check 0.75 - 0.25 = 0.5.";
 assert.deepEqual(teachingBeats(text),["Step 1: Add 0.5 + 0.25 = 0.75.","Step 2: Check 0.75 - 0.25 = 0.5."]);
});
test("practice hides solutions even when no Hint marker exists",()=>{
 assert.deepEqual(practiceParts("Try: Add 2 + 3. Answer: 5. Why: Count on three."),{prompt:"Add 2 + 3.",hint:undefined,answer:"5. Count on three."});
});
test("lessons interleave teaching and application and include misconception repair",()=>{
 const moments=buildLearningMoments({conceptExplanation:"A fraction is part of a whole.",guidedExample:"Step 1: Split it equally. Step 2: Count pieces.",fullLessonSegments:[{title:"Equal parts",activity:"The parts must be equal.",time:"3 minutes"},{title:"Count parts",activity:"Count selected parts.",time:"3 minutes"}],practiceQuestions:["Try: Draw halves. Answer: Two equal pieces.","Try: Show a quarter. Hint: Four equal parts. Answer: One of four."],conceptModel:{nodes:[],relationships:[],misconceptions:[{statement:"Unequal pieces are halves.",correction:"Halves must be equal."}]}});
 assert.deepEqual(moments.map(m=>m.id),["idea","model","concept-0","try-0","concept-1","try-1","repair-0"]);
 assert(!narrationFor(moments[3]).includes("Two equal pieces"));
 assert(!narrationFor(moments[6]).includes("Halves must be equal"));
 assert.equal(narrationFor(moments[1],1),"Watch the reasoning. Step 2: Count pieces.");
});
test("quiz narration never speaks its answer key or feedback",()=>{
 const [moment]=buildLearningMoments({timedExam:{questions:[{question:"Which is a half?",options:["1/2","1/3","1/4","1/5"],answerIndex:0,explanation:"Two equal parts."}]}});
 assert.equal(narrationFor(moment,0),"Check your understanding 1. Which is a half?");
});

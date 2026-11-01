import test from "node:test";
import assert from "node:assert/strict";
import {recordCheck,checkComplete,summarizeChecks} from "../app/lib/masteryLearning.ts";
test("a wrong submitted answer cannot complete a check",()=>{assert.equal(checkComplete(recordCheck(undefined,1),0),false);assert.equal(checkComplete(undefined,0),false);});
test("correction unlocks progress while preserving first-attempt evidence",()=>{const first=recordCheck(undefined,1), corrected=recordCheck(first,0);assert.equal(checkComplete(corrected,0),true);assert.equal(corrected.firstChoice,1);assert.equal(corrected.submissions,2);assert.deepEqual(summarizeChecks([{id:"a",answerIndex:0},{id:"b",answerIndex:2},{id:"c",answerIndex:3}],{a:corrected,b:recordCheck(undefined,2)}),{total:3,attempted:2,firstTry:1,corrected:1});});
test("missing answer keys never establish completion",()=>assert.equal(checkComplete(recordCheck(undefined,0),undefined),false));

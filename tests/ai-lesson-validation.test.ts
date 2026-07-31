import assert from "node:assert/strict";
import test from "node:test";
import { validateGeneratedLesson } from "../app/lib/aiLessonValidation.ts";

function question(index: number) {
  return {
    answerIndex: index % 4,
    explanation: `Choice ${index % 4 + 1} follows from the worked method.`,
    options: [`Option ${index}-A`, `Option ${index}-B`, `Option ${index}-C`, `Option ${index}-D`],
    question: `What is the correct result for example ${index + 1}?`
  };
}

function validLesson() {
  return {
    conceptExplanation: "This complete concept explanation defines the idea, connects its parts, and gives the learner useful context.",
    fullLessonSegments: [{ activity: "This student-facing section explains the concept with a concrete example and a clear relationship.", time: "0-5 min", title: "Core idea" }],
    guidedExample: "Step 1 identifies the known values. Step 2 applies the rule. The final check confirms the result.",
    learningObjectives: ["Explain the central relationship using accurate vocabulary.", "Apply the method and check a worked example."],
    timedExam: {
      durationMinutes: 10,
      passingScore: 70,
      questions: [question(0), question(1), question(2)]
    },
    title: "A complete sample lesson"
  };
}

test("accepts a structurally complete lesson and quiz", () => {
  assert.deepEqual(validateGeneratedLesson(validLesson()), { issues: [], valid: true });
});

test("rejects invalid answer indexes and duplicate choices", () => {
  const lesson = validLesson();
  lesson.timedExam.questions[0].answerIndex = 8;
  lesson.timedExam.questions[1].options[3] = lesson.timedExam.questions[1].options[0];
  const result = validateGeneratedLesson(lesson);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.includes("invalid answer index")));
  assert.ok(result.issues.some((issue) => issue.includes("duplicate answer choices")));
});

test("rejects duplicate quiz questions and incomplete teaching content", () => {
  const lesson = validLesson();
  lesson.timedExam.questions[1].question = lesson.timedExam.questions[0].question;
  lesson.conceptExplanation = "Too short";
  const result = validateGeneratedLesson(lesson);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.includes("duplicates an earlier question")));
  assert.ok(result.issues.some((issue) => issue.includes("Concept explanation")));
});

test("requires a warning for hazardous experiments", () => {
  const lesson = validLesson();
  lesson.fullLessonSegments[0].activity = "Run a laboratory experiment using heat and a sharp blade to prepare the sample for observation.";
  const result = validateGeneratedLesson(lesson);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.includes("safety warning")));

  lesson.fullLessonSegments[0].activity += " Wear safety goggles and work with adult supervision.";
  assert.equal(validateGeneratedLesson(lesson).valid, true);
});

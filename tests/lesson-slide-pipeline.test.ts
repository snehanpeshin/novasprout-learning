import assert from "node:assert/strict";
import test from "node:test";

import { detectSubjectKey, legacyLessonToSlidePlan } from "../app/lib/lessonSlidePlan.ts";
import { createAssessmentItem, hideAssessmentAnswer } from "../app/lib/lessonSlides/assessmentGenerator.ts";
import { fitTextToBox } from "../app/lib/lessonSlides/contentCompressor.ts";
import { formatMathExpression, validateFormattedMath } from "../app/lib/lessonSlides/mathRenderer.ts";
import { classifySlide } from "../app/lib/lessonSlides/slideClassifier.ts";
import { validateAndRepairSlide } from "../app/lib/lessonSlides/slideValidator.ts";
import {
  isElectricityContext,
  isValidConceptNode,
  selectVisualType
} from "../app/lib/lessonSlides/visualSelector.ts";

test("fits text deterministically and returns overflow for a second slide", () => {
  const result = fitTextToBox({
    boxHeight: 0.8,
    boxWidth: 3,
    maxLines: 3,
    minimumFontSize: 16,
    preferredFontSize: 20,
    text: "Voltage is potential difference. Current is the rate of charge flow. Resistance opposes current. Power is energy transferred each second."
  });
  assert.equal(result.fontSize >= 16, true);
  assert.ok(result.text.endsWith("."));
  assert.ok(result.remainingText);
});

test("rejects weak concept-map nodes and duplicate central ideas", () => {
  assert.equal(isValidConceptNode("And", "Electricity"), false);
  assert.equal(isValidConceptNode("Find", "Electricity"), false);
  assert.equal(isValidConceptNode("Electricity", "Electricity"), false);
  assert.equal(isValidConceptNode("electric current", "Electricity"), true);
  assert.equal(isValidConceptNode("electric current", "Electricity", ["Electric current"]), false);
});

test("preserves electricity symbols and validates units", () => {
  assert.equal(
    formatMathExpression("Rₑq = 2 Ω + 4 Ω = 6 Ω"),
    "R_{\\mathrm{eq}} = 2 \\Omega + 4 \\Omega = 6 \\Omega"
  );
  assert.equal(
    formatMathExpression("P = 9 V × 0.5 A = 4.5 W"),
    "P = 9\\,\\mathrm{V} \\times 0.5\\,\\mathrm{A} = 4.5\\,\\mathrm{W}"
  );
  assert.equal(validateFormattedMath("R = 6").valid, false);
});

test("classifies slides from explicit generation types", () => {
  assert.equal(classifySlide({ legacyType: "title" }), "lesson_cover");
  assert.equal(classifySlide({ legacyType: "worked_example" }), "worked_example");
  assert.equal(classifySlide({ legacyType: "concept", math: [{ expression: "V=IR" }] }), "formula_reference");
  assert.equal(classifySlide({ legacyType: "concept", slideType: "labeled_diagram" }), "labeled_diagram");
});

test("keeps assessment answers outside learner-facing content", () => {
  const draft = {
    id: "question-1",
    legacyType: "independent_practice",
    slideType: "independent_practice" as const,
    studentContent: {
      answer: "The bulb stays off.",
      explanation: "The bulb stays off. A gap breaks the path.",
      question: "Will the bulb light? Answer: The bulb stays off."
    },
    title: "Circuit check"
  };
  const assessment = createAssessmentItem({ index: 0, learningObjectiveId: "objective-1", slide: draft, topic: "electric circuits" });
  const hidden = hideAssessmentAnswer({ ...draft, assessment });
  assert.equal(hidden.question, "Will the bulb light?");
  assert.doesNotMatch(hidden.explanation ?? "", /bulb stays off/i);
  assert.equal(assessment?.correctAnswer, "The bulb stays off.");
});

test("selects visual types from purpose and domain", () => {
  assert.equal(selectVisualType({
    slide: { legacyType: "independent_practice", slideType: "independent_practice", studentContent: { question: "Find current in this closed circuit." } },
    subject: "Science",
    topic: "Electric circuits"
  }), "circuit_diagram");
  assert.equal(selectVisualType({
    slide: { legacyType: "comparison", slideType: "comparison", title: "Series versus parallel" },
    subject: "Science",
    topic: "Electricity"
  }), "comparison_table");
  assert.equal(selectVisualType({
    slide: { legacyType: "concept", slideType: "concept_explanation", title: "A concise nonvisual definition" },
    subject: "English",
    topic: "Theme"
  }), "no_visual");
});

test("routes overlapping subject names to the correct lesson templates", () => {
  assert.equal(detectSubjectKey("Computer Science", "Algorithms"), "coding");
  assert.equal(detectSubjectKey("Social Studies", "Checks and balances"), "social");
  assert.equal(detectSubjectKey("Test Preparation", "Reading question strategy"), "ela");
  assert.equal(detectSubjectKey("Test Preparation", "Math review and percent"), "math");
});

test("does not treat civic power or a current problem as electricity", () => {
  assert.equal(isElectricityContext("Science", "Electricity and circuits"), true);
  assert.equal(isElectricityContext("Social Studies", "Government power and checks"), false);
  assert.equal(isElectricityContext("Test Preparation", "Use the current problem"), false);
  assert.equal(selectVisualType({
    slide: {
      legacyType: "concept",
      slideType: "concept_explanation",
      studentContent: { explanation: "Each branch holds power and performs a different function." }
    },
    subject: "Social Studies",
    topic: "Government, civics, and checks and balances"
  }), "no_visual");
});

test("detects and repairs overflow, long titles, and visible answers", () => {
  const result = validateAndRepairSlide({
    assessment: {
      commonWrongAnswer: "It lights.",
      correctAnswer: "It stays off.",
      difficulty: "interpret",
      explanation: "The circuit is open.",
      id: "answer",
      kind: "short_answer",
      learningObjectiveId: "objective-1",
      misconceptionAddressed: "Current crosses a gap.",
      question: "What happens?"
    },
    id: "overflow",
    legacyType: "independent_practice",
    slideType: "independent_practice",
    studentContent: {
      answer: "It stays off.",
      bullets: Array.from({ length: 8 }, (_, index) => `A long repeated bullet ${index} that contains more detail than one slide label should carry because it keeps going.`),
      question: "What happens? Answer: It stays off."
    },
    title: "This title is much too long for a professional NovaSprout lesson slide and should be shortened automatically",
    visuals: []
  });
  const codes = new Set(result.findings.map((finding) => finding.code));
  assert.ok(codes.has("title_too_long"));
  assert.ok(codes.has("too_many_bullets"));
  assert.ok(codes.has("answer_leakage"));
  assert.equal(result.repaired.studentContent?.bullets?.length, 6);
});

test("all finalized slides carry explicit semantic types", () => {
  const plan = legacyLessonToSlidePlan({
    context: { grade: "Grade 7", subject: "Science", topic: "Electric circuits" },
    lesson: {
      conceptExplanation: "A closed conducting path allows charge to move and transfer energy.",
      learningObjectives: ["Explain why a circuit must be closed."],
      practiceQuestions: ["Will a lamp light if the switch is open? Answer: No. Why: The path is broken."],
      title: "Electric circuits"
    }
  });
  assert.equal(plan.schemaVersion, "3.0");
  assert.ok(plan.slides.every((slide) => slide.slideType));
  assert.ok(plan.answerKey?.length);
  assert.equal(plan.deckQuality?.exportReady, true);
});

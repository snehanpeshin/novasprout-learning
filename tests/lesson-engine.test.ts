import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  enhanceLessonPlan,
  evaluateLessonSlides,
  extractConceptGraph,
  fitTextAtSentenceBoundary,
  isGenericConceptMap,
  normalizeLessonRequest,
  recommendTopicVisual,
  validateStructuredFormula
} from "../app/lib/lessonEngine.ts";

const thirdLawText = `The third law of thermodynamics states that the entropy of a perfect crystal approaches zero as temperature approaches absolute zero. At low temperature, lattice heat capacity is approximately proportional to T cubed. Residual entropy can remain when several ground-state arrangements are possible.`;

test("normalizes lesson generation controls", () => {
  assert.deepEqual(normalizeLessonRequest({ duration: "45-minute lesson", topic: "Third law", visualEmphasis: "maximum" }), {
    audienceMode: "student",
    depth: "standard",
    durationMinutes: 45,
    grade: "Student",
    language: "English",
    outputType: "Comprehensive lesson",
    practiceIntensity: "standard",
    subject: "General",
    topic: "Third law",
    visualEmphasis: "maximum"
  });
});

test("builds a topic concept graph before slide planning", () => {
  const graph = extractConceptGraph({ lessonText: thirdLawText, subject: "Physics", topic: "Third law of thermodynamics" });
  assert.ok(graph.nodes.some((node) => node.id === "absolute-zero"));
  assert.ok(graph.relationships.some((edge) => edge.relationship === "limits"));
  assert.ok(graph.formulas.some((formula) => formula.expression.includes("T^3")));
  assert.ok(graph.formulas.every((formula) => validateStructuredFormula(formula).valid));
});

test("rejects unsafe or malformed formula strings", () => {
  assert.equal(validateStructuredFormula({ expression: "S={k_B", meaning: "bad" }).valid, false);
  assert.equal(validateStructuredFormula({ expression: "\\input{secret}", meaning: "bad" }).valid, false);
  assert.equal(validateStructuredFormula({ expression: "S=k_B\\ln \\Omega", meaning: "entropy" }).valid, true);
});

test("fits content at a sentence boundary without ellipsis truncation", () => {
  const fitted = fitTextAtSentenceBoundary("First complete sentence. Second complete sentence. A third sentence that will not fit.", 52);
  assert.equal(fitted, "First complete sentence. Second complete sentence.");
  assert.ok(!fitted.endsWith("..."));
});

test("rejects generic keyword maps", () => {
  assert.equal(isGenericConceptMap({ type: "concept_map", labels: ["Learn", "Notice", "Practice", "Check"] }, "thermodynamics"), true);
  assert.equal(isGenericConceptMap({ type: "concept_map", labels: ["Entropy", "Temperature"] }, "entropy and temperature"), false);
});

test("plans diverse Third Law visuals from semantic relationships", () => {
  const visualTypes = Array.from({ length: 5 }, (_, index) => recommendTopicVisual({
    index,
    slide: { id: `slide-${index}`, studentContent: { explanation: thirdLawText }, title: `Third Law ${index}` },
    subject: "Physics",
    topic: "Third law of thermodynamics"
  })?.type);
  assert.deepEqual(visualTypes, ["scientific_graph", "microstate_model", "scientific_graph", "cooling_sequence", "equation_steps"]);
});

test("enhances a legacy plan with v2 semantics and machine-readable findings", () => {
  const plan = enhanceLessonPlan({
    context: { subject: "Physics", topic: "Third law of thermodynamics" },
    slides: [
      { id: "concept", studentContent: { explanation: thirdLawText }, title: "Entropy near absolute zero", type: "concept", visuals: [{ id: "old", labels: ["Learn", "Practice"], type: "concept_map" }] }
    ],
    validationWarnings: []
  });
  assert.equal(plan.engineVersion, "2.1");
  assert.equal(plan.slides[0].visuals?.[0]?.type, "scientific_graph");
  assert.ok(plan.slides[0].math?.length);
  assert.ok(plan.conceptGraph.relationships.length >= 3);
});

test("quality checks detect duplicates, overflow, incomplete text, and answer leakage", () => {
  const long = `${"Detailed explanation with evidence. ".repeat(30)}because`;
  const findings = evaluateLessonSlides([
    { id: "one", studentContent: { answer: "42", explanation: `${long} The answer is 42` }, title: "Reasoning" },
    { id: "two", studentContent: { explanation: `${long} The answer is 42` }, title: "Reasoning" }
  ], "measurement", "student");
  const codes = new Set(findings.map((finding) => finding.code));
  assert.ok(codes.has("content_overflow_risk"));
  assert.ok(codes.has("near_duplicate"));
  assert.ok(codes.has("answer_leakage"));
});

test("representative subject visual snapshots stay structurally stable", () => {
  const snapshots = JSON.parse(readFileSync(new URL("./fixtures/lesson-subject-snapshots.json", import.meta.url), "utf8"));
  const cases = {
    coding: ["Algorithm steps through input, decision, loop, output", "Computer Science"],
    ela: ["A writing process sequence from claim to evidence to reasoning", "English"],
    math: ["Graph the rate of change of a linear function", "Mathematics"],
    science: [thirdLawText, "Physics"],
    "social-studies": ["A historical process sequence from cause to event to consequence", "Social Studies"],
    "visual-art": ["Compare color and composition", "Visual Art"]
  } as const;
  for (const [subjectKey, [text, subject]] of Object.entries(cases)) {
    const count = subjectKey === "science" ? 5 : 1;
    const actual = Array.from({ length: count }, (_, index) => recommendTopicVisual({
      index,
      slide: { studentContent: { explanation: text }, title: text },
      subject,
      topic: text
    })?.type).filter(Boolean);
    assert.deepEqual(actual, snapshots[subjectKey], subjectKey);
  }
});

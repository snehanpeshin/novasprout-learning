import assert from "node:assert/strict";
import test from "node:test";

import { legacyLessonToSlidePlan, type LessonPlanSlide } from "../app/lib/lessonSlidePlan.ts";
import {
  circuitDiagramLabelTexts,
  parseCircuitProblem,
  validateCircuitSemanticConsistency
} from "../app/lib/lessonSlides/circuitBinding.ts";
import { isCompleteSentence, rewriteToFit } from "../app/lib/lessonSlides/contentCompressor.ts";
import { isPlaceholderSlide, validateTitleVisualAlignment } from "../app/lib/lessonSlides/slideValidator.ts";
import {
  createCircuitDiagramLayout,
  detectVisualCollisions
} from "../app/lib/lessonSlides/visualLayoutValidator.ts";

function lessonPlan({
  guidedExample,
  practiceQuestions = [],
  quickAssessment = []
}: {
  guidedExample?: string;
  practiceQuestions?: string[];
  quickAssessment?: string[];
}) {
  return legacyLessonToSlidePlan({
    context: {
      grade: "Grade 7",
      subject: "Science",
      topic: "Electric circuits"
    },
    lesson: {
      conceptExplanation: "A closed circuit transfers energy while charge flows through its components.",
      duration: "30 minutes",
      guidedExample,
      learningObjectives: ["Use circuit data to calculate voltage, current, resistance, and power."],
      practiceQuestions,
      quickAssessment,
      title: "Electric Circuits"
    }
  });
}

function circuitProblem(slide: LessonPlanSlide) {
  const data = slide.visuals[0]?.diagramData;
  assert.equal(data?.kind, "circuit_problem");
  return data!.kind === "circuit_problem" ? data.circuit : undefined;
}

test("A: series values bind from the current problem without legacy values", () => {
  const plan = lessonPlan({
    guidedExample: "A 9 V battery with R1 = 3 Ω and R2 = 6 Ω in series. Find total resistance and current."
  });
  const slide = plan.slides.find((candidate) => candidate.id === "worked-example-1");
  assert.ok(slide);
  const problem = circuitProblem(slide!);
  assert.deepEqual(problem!.components.map((component) => component.resistanceOhms), [3, 6]);
  assert.equal(problem!.sourceVoltage, 9);
  assert.equal(problem!.solution?.equivalentResistanceOhms, 9);
  assert.equal(problem!.solution?.totalCurrentAmps, 1);
  const labels = circuitDiagramLabelTexts(problem!, true).map((label) => label.text).join(" | ");
  assert.match(labels, /9 V source/);
  assert.match(labels, /R1 = 3 Ω/);
  assert.match(labels, /R2 = 6 Ω/);
  assert.match(labels, /Rₑq = 9 Ω/);
  assert.match(labels, /I = 1 A/);
  assert.doesNotMatch(labels, /2 Ω|4 Ω|1\.5 A/);
});

test("B: series voltage question hides the solution and stores the calculated answer", () => {
  const plan = lessonPlan({
    practiceQuestions: ["Two resistors 4 Ω and 6 Ω in series across 12 V. Find voltage across the 6 Ω resistor."]
  });
  const slide = plan.slides.find((candidate) => candidate.id === "practice-1");
  assert.ok(slide);
  const problem = circuitProblem(slide!);
  assert.equal(problem!.showSolution, false);
  assert.equal(problem!.sourceVoltage, 12);
  assert.deepEqual(problem!.components.map((component) => component.resistanceOhms), [4, 6]);
  assert.equal(slide!.studentContent.answer, undefined);
  assert.equal(slide!.assessment?.correctAnswer, "I = 1.2 A; V_R2 = 7.2 V");
  const visibleLabels = circuitDiagramLabelTexts(problem!, false).map((label) => label.text).join(" | ");
  assert.doesNotMatch(visibleLabels, /1\.2 A|7\.2 V/);
});

test("C: parallel branch-current question uses only its own values", () => {
  const plan = lessonPlan({
    practiceQuestions: ["Two resistors 4 Ω and 6 Ω in parallel across 12 V. Find current through the 4 Ω resistor."]
  });
  const slide = plan.slides.find((candidate) => candidate.id === "practice-1");
  assert.ok(slide);
  const problem = circuitProblem(slide!);
  assert.equal(problem!.arrangement, "parallel");
  assert.equal(problem!.showSolution, false);
  assert.equal(slide!.assessment?.correctAnswer, "I_R1 = 3 A");
  const visibleLabels = circuitDiagramLabelTexts(problem!, false).map((label) => label.text).join(" | ");
  assert.match(visibleLabels, /12 V source/);
  assert.match(visibleLabels, /R1 = 4 Ω/);
  assert.match(visibleLabels, /R2 = 6 Ω/);
  assert.doesNotMatch(visibleLabels, /9 V|2 Ω|3 Ω|1\.5 A|4\.5 A/);
});

test("D: lamp resistance and power are calculated from the bound givens", () => {
  const plan = lessonPlan({
    practiceQuestions: ["A lamp uses 2 A at 6 V. Find resistance and power."]
  });
  const slide = plan.slides.find((candidate) => candidate.id === "practice-1");
  assert.ok(slide);
  const problem = circuitProblem(slide!);
  assert.equal(slide!.assessment?.correctAnswer, "R = 3 Ω; P = 12 W");
  assert.equal(problem!.showSolution, false);
  assert.equal(problem!.solution?.resistanceOhms, 3);
  assert.equal(problem!.solution?.powerWatts, 12);
  assert.doesNotMatch(JSON.stringify(problem), /9 V|0\.50 A|4\.5 W/);
});

test("single-resistor source questions bind the current slide values", () => {
  const problem = parseCircuitProblem(
    "A 9 V source is connected to 6 Ω. Find current.",
    { showSolution: false }
  );
  assert.ok(problem);
  assert.equal(problem!.sourceVoltage, 9);
  assert.deepEqual(problem!.components.map((component) => component.resistanceOhms), [6]);
  assert.equal(problem!.solution?.totalCurrentAmps, 1.5);
  assert.equal(problem!.solution?.finalAnswers[0], "I = 1.5 A");
});

test("device power questions bind voltage and current without showing the answer", () => {
  const plan = lessonPlan({
    practiceQuestions: ["A device uses 9 V and 0.5 A. Find power."]
  });
  const slide = plan.slides.find((candidate) => candidate.id === "practice-1");
  assert.ok(slide);
  const problem = circuitProblem(slide!);
  assert.equal(problem!.sourceVoltage, 9);
  assert.equal(problem!.sourceCurrentAmps, 0.5);
  assert.equal(problem!.components[0]?.type, "device");
  assert.equal(problem!.showSolution, false);
  assert.equal(slide!.assessment?.correctAnswer, "P = 4.5 W");
  assert.doesNotMatch(slide!.visuals[0]?.steps?.join(" ") ?? "", /4\.5 W/);
});

test("cross-modal validation rejects diagram values copied from another problem", () => {
  const plan = lessonPlan({
    guidedExample: "A 9 V battery with R1 = 3 Ω and R2 = 6 Ω in series. Find total resistance and current."
  });
  const slide = structuredClone(plan.slides.find((candidate) => candidate.id === "worked-example-1")!);
  const data = slide.visuals[0]?.diagramData;
  assert.equal(data?.kind, "circuit_problem");
  if (data?.kind === "circuit_problem") data.circuit.components[0].resistanceOhms = 2;
  const findings = validateCircuitSemanticConsistency(slide);
  assert.ok(findings.some((finding) =>
    finding.code === "semantic_value_mismatch" &&
    finding.offendingElement === "R1" &&
    finding.expectedValue === "3" &&
    finding.actualValue === "2"
  ));

  const copiedLabelSlide = structuredClone(
    plan.slides.find((candidate) => candidate.id === "worked-example-1")!
  );
  copiedLabelSlide.visuals[0].labels = copiedLabelSlide.visuals[0].labels?.map((label) =>
    label.includes("R1") ? "R1 = 2 Ω" : label
  );
  const labelFindings = validateCircuitSemanticConsistency(copiedLabelSlide);
  assert.ok(labelFindings.some((finding) =>
    finding.code === "semantic_value_mismatch" &&
    finding.actualValue === "2 Ω"
  ));
});

test("E: conceptual series knowledge check keeps the answer out of the diagram", () => {
  const plan = lessonPlan({
    quickAssessment: ["Which quantity is the same at every point in a single series circuit? Answer: current."]
  });
  const slide = plan.slides.find((candidate) => candidate.id === "check-1");
  assert.ok(slide);
  const problem = circuitProblem(slide!);
  assert.equal(problem!.arrangement, "series");
  assert.equal(problem!.showSolution, false);
  assert.equal(slide!.assessment?.correctAnswer, "current.");
  const visibleLabels = circuitDiagramLabelTexts(problem!, false).map((label) => label.text).join(" | ");
  assert.doesNotMatch(visibleLabels, /same current|current =|A\b/i);
});

test("circuit layout resolves collisions and stays inside safe bounds", () => {
  const problem = parseCircuitProblem(
    "Two resistors 4 Ω and 6 Ω in parallel across 12 V. Find current through the 4 Ω resistor.",
    { showSolution: false }
  );
  assert.ok(problem);
  const layout = createCircuitDiagramLayout(problem!);
  assert.deepEqual(layout.collisions, []);
  assert.deepEqual(layout.overflowElementIds, []);
  assert.deepEqual(detectVisualCollisions(layout.elements), []);
});

test("identical parallel resistor task binds two components and computes resistance", () => {
  const problem = parseCircuitProblem(
    "If you add another identical resistor in parallel to a 10 Ω resistor, what happens to total resistance?",
    { showSolution: false }
  );
  assert.ok(problem);
  assert.equal(problem!.arrangement, "parallel");
  assert.deepEqual(problem!.components.map((component) => component.resistanceOhms), [10, 10]);
  assert.equal(problem!.solution?.equivalentResistanceOhms, 5);
  assert.equal(problem!.solution?.finalAnswers[0], "Rₑq = 5 Ω");
});

test("charge divided by time uses an equation visual instead of an unrelated circuit", () => {
  const plan = lessonPlan({
    practiceQuestions: ["A charge of 12 C passes a point in 3 s. What is the current? Answer: 4 A."]
  });
  const slide = plan.slides.find((candidate) => candidate.id === "practice-1");
  assert.ok(slide);
  assert.equal(slide!.visuals[0]?.type, "equation_steps");
  assert.deepEqual(slide!.visuals[0]?.steps, [
    "Use I = Q / t.",
    "Keep charge in coulombs and time in seconds."
  ]);
});

test("placeholder and incomplete activity content is rejected", () => {
  assert.equal(isPlaceholderSlide({
    slideType: "guided_practice",
    studentContent: { explanation: "A visual model for the science idea." },
    title: "Practice + Quiz"
  }), true);
  assert.equal(isCompleteSentence("Calculate resistance for two."), false);
  assert.equal(isCompleteSentence(rewriteToFit("Calculate resistance for two.", 6)), true);
});

test("numbered AI prose cannot trap parenthesis repair", () => {
  const repaired = rewriteToFit(
    "Question: Can capillary action lift water 20 meters? 1) Use h = (2 gamma)/(rho g r). 2) Substitute the values. Final check: compare the result with 20 meters.",
    80
  );
  assert.equal(isCompleteSentence(repaired), true);
  assert.match(repaired, /h = \(2 gamma\)\/\(rho g r\)/);
});

test("title and visual alignment requires a real circuit comparison", () => {
  const findings = validateTitleVisualAlignment(
    "Circuit Types and Visual Comparison",
    {
      accessibilityLabel: "One generic circuit.",
      id: "generic",
      type: "circuit_diagram"
    },
    {
      slideType: "comparison",
      studentContent: { keyIdea: "Compare circuit types." },
      title: "Circuit Types and Visual Comparison"
    }
  );
  assert.equal(findings[0]?.code, "title_visual_mismatch");
});

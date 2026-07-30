import assert from "node:assert/strict";
import test from "node:test";

import { legacyLessonToSlidePlan } from "../app/lib/lessonSlidePlan.ts";
import { hasCompleteAssessmentSequence } from "../app/lib/lessonSlides/lessonPlanner.ts";

const request = {
  audienceMode: "student",
  context: {
    grade: "Grade 7",
    subject: "Science",
    topic: "Electricity, series and parallel circuits"
  },
  lesson: {
    conceptExplanation: "Electric charge is present in conductors. A battery maintains a voltage. Current moves around a closed path, resistance opposes current, and circuit components transfer electrical energy. Power measures energy transfer each second.",
    fullLessonSegments: [
      { title: "Battery symbols", activity: "The battery symbol has a long positive plate and a short negative plate. Conventional current moves from positive to negative around the outside of a closed circuit." },
      { title: "Voltage drop", activity: "A voltmeter measures potential difference across a component, so its leads connect in parallel across the component." }
    ],
    guidedExample: "A 9 V battery is connected to 2 Ω and 4 Ω resistors in series. Find the total resistance and current. Answer: Rₑq = 6 Ω and I = 1.5 A.",
    learningObjectives: [
      "Explain charge, current, voltage, resistance, and power.",
      "Compare series and parallel circuits using current and voltage.",
      "Calculate current and power with correct units."
    ],
    practiceQuestions: [
      "What does a battery provide? Answer: voltage. Why: it maintains a potential difference.",
      "Use the diagram: which direction does conventional current move? Answer: from positive to negative around the outer circuit.",
      "A 9 V source is connected to 6 Ω. Find current. Answer: 1.5 A. Why: I = V/R.",
      "Compare series and parallel paths. Answer: series has one path; parallel has branches.",
      "Why must a voltmeter connect across a resistor? Answer: it compares potential at the resistor's two ends.",
      "A device uses 9 V and 0.5 A. Find power. Answer: 4.5 W. Why: P = VI."
    ],
    quickAssessment: [
      "Label the battery's long plate. Answer: positive.",
      "True or false: current is used up by a lamp. Answer: false.",
      "Explain one difference between series and parallel circuits. Answer: series has one path while parallel has branches."
    ],
    recommendedNextSession: "Use missed questions to review branch current, voltage drops, and electrical power.",
    studentFit: "A visual Grade 7 lesson with short explanations, circuit models, and unit-aware calculations.",
    title: "Electricity and Circuits",
    warmUp: "What must be true about the path for a lamp to light?"
  }
};

test("electricity deck satisfies the semantic and visual acceptance path", () => {
  const plan = legacyLessonToSlidePlan({ context: request.context, lesson: request.lesson });
  const visualTypes = new Set(plan.slides.flatMap((slide) => slide.visuals.map((visual) => visual.type)));
  for (const required of [
    "cover_illustration",
    "circuit_diagram",
    "electric_relationships",
    "ohms_law",
    "series_circuit",
    "parallel_circuit",
    "series_parallel_comparison",
    "voltmeter_circuit",
    "electric_power"
  ]) {
    assert.ok(visualTypes.has(required), `missing ${required}`);
  }
  assert.ok((plan.answerKey?.length ?? 0) >= 6);
  assert.ok(hasCompleteAssessmentSequence(plan.answerKey!.slice(0, 6)));
  assert.ok(plan.slides.every((slide) => slide.speakerNotes));
  assert.ok(plan.slides.every((slide) => (slide.qualityScore?.score ?? 0) >= 75));
  assert.ok((plan.deckQuality?.average ?? 0) >= 85);
  assert.equal(plan.deckQuality?.exportReady, true);
  const workedProblem = plan.slides
    .find((slide) => slide.id === "worked-example-1")
    ?.visuals[0]?.diagramData;
  assert.equal(workedProblem?.kind, "circuit_problem");
  if (workedProblem?.kind === "circuit_problem") {
    assert.deepEqual(workedProblem.circuit.components.map((component) => component.resistanceOhms), [2, 4]);
    assert.equal(workedProblem.circuit.solution?.equivalentResistanceOhms, 6);
    assert.equal(workedProblem.circuit.solution?.totalCurrentAmps, 1.5);
  }
  assert.doesNotMatch(JSON.stringify(plan.slides.filter((slide) => !slide.studentContent.question)), /0\.50 A|4\.5 W/);
  assert.doesNotMatch(JSON.stringify(plan.slides.map((slide) => slide.visuals)), /"What connects\?"|"And"|"Given"|"Find"/);
  for (const slide of plan.slides.filter((item) => item.assessment)) {
    assert.doesNotMatch(slide.studentContent.question ?? "", /\bAnswer\s*:/i);
  }
});

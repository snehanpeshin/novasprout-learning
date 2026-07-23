import assert from "node:assert/strict";
import test from "node:test";

import { evaluateLessonSlides, isVisualCompatibleWithTopic, recommendTopicVisual } from "../app/lib/lessonEngine.ts";
import { legacyLessonToSlidePlan } from "../app/lib/lessonSlidePlan.ts";

const topic = "Sampling distributions, standard error, z-scores, and confidence intervals";

test("rejects cross-domain visuals for statistics", () => {
  assert.equal(isVisualCompatibleWithTopic({ type: "solid_geometry" }, topic), false);
  assert.equal(isVisualCompatibleWithTopic({ type: "sampling_distribution" }, topic), true);
});

test("statistics planner contains no biology contamination", () => {
  const plan = legacyLessonToSlidePlan({
    context: { grade: "Grade 11", subject: "Mathematics", topic },
    lesson: {
      title: "Sampling Distributions",
      conceptExplanation: "Repeated random samples produce a distribution of sample means.",
      learningObjectives: ["Interpret standard error.", "Compute a z-score."],
      practiceQuestions: ["Find the standard error when sigma is 10 and n is 25."]
    }
  });
  const text = JSON.stringify(plan);
  assert.doesNotMatch(text, /\b(ecosystem|habitat|community|producer|consumer|rectangular prism)\b/i);
  assert.ok(plan.slides.some((slide) => slide.visuals.some((visual) => visual.type === "sampling_distribution")));
  assert.ok(plan.slides.some((slide) => slide.visuals.some((visual) => visual.type === "confidence_interval")));
});

test("semantic visual choice follows the current objective", () => {
  const visual = recommendTopicVisual({
    index: 0,
    slide: { title: "Compare standard error as sample size grows", type: "concept" },
    subject: "Mathematics",
    topic
  });
  assert.equal(visual?.type, "standard_error_comparison");
});

test("production directions are build-blocking learner-content errors", () => {
  const findings = evaluateLessonSlides([{
    id: "bad-instruction",
    studentContent: { explanation: "Draw three panels and place a transparent box beside the curve." },
    title: "Sampling Distribution"
  }], topic);
  assert.ok(findings.some((finding) => finding.code === "printed_production_instruction" && finding.severity === "error"));
});

test("non-statistics visual compatibility remains domain aware", () => {
  assert.equal(isVisualCompatibleWithTopic({ type: "solid_geometry" }, "Volume of rectangular prisms"), true);
  assert.equal(isVisualCompatibleWithTopic({ type: "solid_geometry" }, "Solving linear equations"), false);
  assert.equal(isVisualCompatibleWithTopic({ type: "coordinate_graph" }, "Solving linear equations"), true);
});

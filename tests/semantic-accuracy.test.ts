import assert from "node:assert/strict";
import test from "node:test";

import {
  legacyLessonToSlidePlan,
  type LessonPlanSlide
} from "../app/lib/lessonSlidePlan.ts";
import { runSemanticAccuracyGate } from "../app/lib/lessonSlides/semanticAccuracy.ts";

function slide(overrides: Partial<LessonPlanSlide> = {}): LessonPlanSlide {
  return {
    accessibilityLabel: "Lesson slide",
    estimatedMinutes: 3,
    id: "lesson-slide",
    slideType: "concept_explanation",
    studentContent: { keyIdea: "Use source evidence to explain a historical change." },
    title: "Trace historical change",
    type: "concept",
    visualPriority: "medium",
    visuals: [],
    ...overrides
  };
}

const historyGraph = {
  nodes: [
    { definition: "Conditions surrounding an event.", label: "historical context" },
    { definition: "Information from a source that supports a claim.", label: "source evidence" },
    { definition: "A result that follows an event or decision.", label: "consequence" }
  ],
  relationships: [
    { explanation: "Historical context helps explain why causes produce consequences.", from: "historical context", relationship: "helps explain", to: "consequence" }
  ]
};

test("replaces a civics visual injected into a history lesson", () => {
  const result = runSemanticAccuracyGate({
    conceptGraph: historyGraph,
    slides: [slide({
      visuals: [{
        accessibilityLabel: "The legislative, executive, and judicial branches.",
        id: "wrong-government-model",
        labels: ["Legislative branch", "Executive branch", "Judicial branch"],
        title: "Three branches",
        type: "concept_map"
      }]
    })],
    subject: "Social Studies",
    subjectKey: "social",
    topic: "Causes of the Industrial Revolution"
  });

  assert.equal(result.summary.repairedMismatches, 1);
  assert.equal(result.summary.unresolvedErrors, 0);
  assert.doesNotMatch(JSON.stringify(result.slides[0].visuals), /legislative|executive|judicial/i);
  assert.match(JSON.stringify(result.slides[0].visuals), /historical context|source evidence|consequence/i);
});

test("blocks learner-facing cross-domain contamination instead of hiding it", () => {
  const result = runSemanticAccuracyGate({
    conceptGraph: historyGraph,
    slides: [slide({
      studentContent: {
        keyIdea: "The legislative branch makes laws, the executive branch carries them out, and the judicial branch interprets them."
      }
    })],
    subject: "Social Studies",
    subjectKey: "social",
    topic: "Ancient Egyptian agriculture"
  });

  assert.equal(result.summary.unresolvedErrors, 1);
  assert.ok(result.findingsBySlide.get("lesson-slide")?.some((finding) =>
    finding.code === "unsupported_claim" && finding.severity === "error" && !finding.repaired
  ));
});

test("keeps a three-branch visual when the topic is explicitly civics", () => {
  const result = runSemanticAccuracyGate({
    slides: [slide({
      studentContent: { keyIdea: "Checks and balances limit concentrated government power." },
      visuals: [{
        accessibilityLabel: "The legislative, executive, and judicial branches.",
        id: "government-model",
        labels: ["Legislative branch", "Executive branch", "Judicial branch"],
        title: "Three branches",
        type: "concept_map"
      }]
    })],
    subject: "Social Studies",
    subjectKey: "social",
    topic: "U.S. government branches and checks and balances"
  });

  assert.equal(result.summary.repairedMismatches, 0);
  assert.equal(result.summary.unresolvedErrors, 0);
  assert.match(JSON.stringify(result.slides[0].visuals), /Legislative branch/);
});

test("uses history and economics visuals only for their matching social-studies topics", () => {
  const history = legacyLessonToSlidePlan({
    context: { grade: "Grade 7", subject: "Social Studies", topic: "The Industrial Revolution" },
    lesson: {
      conceptExplanation: "Industrialization changed production, work, cities, and social life over time.",
      conceptModel: historyGraph,
      learningObjectives: ["Use source evidence to explain causes and consequences of industrialization."],
      title: "The Industrial Revolution"
    }
  });
  const economics = legacyLessonToSlidePlan({
    context: { grade: "Grade 7", subject: "Social Studies", topic: "Scarcity and opportunity cost" },
    lesson: {
      conceptExplanation: "Scarcity means resources are limited, so every choice has an opportunity cost.",
      learningObjectives: ["Compare the costs and benefits of two choices."],
      title: "Scarcity and opportunity cost"
    }
  });

  const historyText = JSON.stringify(history.slides);
  const economicsText = JSON.stringify(economics.slides);
  assert.match(historyText, /Historical|source/i);
  assert.doesNotMatch(historyText, /Legislative branch|Executive branch|Judicial branch/i);
  assert.match(economicsText, /Scarcity|opportunity cost|economic/i);
  assert.doesNotMatch(economicsText, /Legislative branch|Executive branch|Judicial branch/i);
});

test("interdisciplinary topics do not inherit ratio lesson content", () => {
  const plan = legacyLessonToSlidePlan({
    context: { grade: "Adult learner", subject: "Other / Interdisciplinary", topic: "Psychology of music" },
    lesson: {
      conceptExplanation: "Music can influence attention, expectation, memory, and emotion through interacting cognitive processes.",
      learningObjectives: ["Explain one evidence-based connection between music and cognition."],
      title: "Psychology of music"
    }
  });
  const text = JSON.stringify(plan.slides);
  assert.doesNotMatch(text, /2:3|proportion|equivalent ratios|cross-multip/i);
  assert.equal(plan.context.subjectKey, "general");
});

test("recomputes simple arithmetic and blocks an incorrect equality", () => {
  const result = runSemanticAccuracyGate({
    slides: [slide({
      studentContent: { keyIdea: "A 25 percent discount on 80 is found by calculating 0.25 x 80 = 25." },
      title: "Check the discount"
    })],
    subject: "Mathematics",
    subjectKey: "math",
    topic: "Percent discounts"
  });
  assert.equal(result.summary.unresolvedErrors, 1);
  assert.ok(result.findingsBySlide.get("lesson-slide")?.some((finding) => finding.code === "calculation_error"));
});

test("accepts a recomputed equality and rejects an invalid answer-key option", () => {
  const valid = runSemanticAccuracyGate({
    slides: [slide({ studentContent: { keyIdea: "A 25 percent discount on 80 is 0.25 x 80 = 20." } })],
    subject: "Mathematics",
    subjectKey: "math",
    topic: "Percent discounts"
  });
  const invalidAssessment = runSemanticAccuracyGate({
    slides: [slide({
      assessment: {
        commonWrongAnswer: "15",
        correctAnswer: "20",
        difficulty: "apply",
        explanation: "Multiply the original amount by the percent rate.",
        id: "discount-check",
        kind: "multiple_choice",
        learningObjectiveId: "objective-1",
        misconceptionAddressed: "Subtracting the percent as a whole number.",
        options: ["15", "25", "60", "80"],
        question: "What is 25 percent of 80?"
      }
    })],
    subject: "Mathematics",
    subjectKey: "math",
    topic: "Percent discounts"
  });
  assert.equal(valid.summary.unresolvedErrors, 0);
  assert.equal(invalidAssessment.summary.unresolvedErrors, 1);
  assert.ok(invalidAssessment.findingsBySlide.get("lesson-slide")?.some((finding) => finding.code === "semantic_value_mismatch"));
});

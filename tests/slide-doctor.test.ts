import assert from "node:assert/strict";
import test from "node:test";
import type { LessonPlanSlide } from "../app/lib/lessonSlidePlan.ts";
import { runSlideDoctor } from "../app/lib/lessonSlides/slideDoctor.ts";

function slide(overrides: Partial<LessonPlanSlide> = {}): LessonPlanSlide {
  return {
    accessibilityLabel: "Lesson slide",
    estimatedMinutes: 3,
    id: "slide-1",
    slideType: "concept_explanation",
    studentContent: { keyIdea: "A useful topic idea." },
    title: "Topic idea",
    type: "concept",
    visualPriority: "medium",
    visuals: [],
    ...overrides
  };
}

const conceptGraph = {
  nodes: [
    { definition: "A precise part of the system with a clear function.", label: "core component" },
    { definition: "The result produced when the component changes.", label: "observable result" }
  ],
  relationships: [
    { explanation: "The core component changes the observable result through a measurable process.", from: "core component", relationship: "changes", to: "observable result" }
  ]
};

test("refills a sparse slide from the lesson concept graph", () => {
  const result = runSlideDoctor({
    conceptGraph,
    slides: [slide({ studentContent: {}, title: "Core relationship" })],
    topic: "A new interdisciplinary topic"
  });
  assert.match(result.slides[0].studentContent.keyIdea ?? "", /core component/i);
  assert.equal(result.summary.inspectedSlides, 1);
  assert.equal(result.summary.passes, 2);
  assert.equal(result.summary.unresolvedErrors, 0);
});

test("rebuilds a missing learner task and keeps its answer outside visible content", () => {
  const result = runSlideDoctor({
    conceptGraph,
    slides: [slide({
      assessment: {
        commonWrongAnswer: "A guess",
        correctAnswer: "Use the measured relationship.",
        difficulty: "apply",
        explanation: "The relationship links the two quantities.",
        id: "assessment-1",
        kind: "short_answer",
        learningObjectiveId: "objective-1",
        misconceptionAddressed: "Guessing without evidence",
        question: "How does the relationship apply?"
      },
      id: "practice",
      slideType: "independent_practice",
      studentContent: {},
      title: "Apply the model",
      type: "independent_practice"
    })],
    topic: "A new interdisciplinary topic"
  });
  assert.match(result.slides[0].studentContent.question ?? "", /How would you use/i);
  assert.doesNotMatch(result.slides[0].studentContent.question ?? "", /Use the measured relationship/i);
  assert.equal(result.summary.unresolvedErrors, 0);
});

test("replaces a generic learner prompt with a specific concept task", () => {
  const result = runSlideDoctor({
    conceptGraph,
    slides: [slide({
      id: "generic-practice",
      slideType: "guided_practice",
      studentContent: { question: "Your turn" },
      title: "Practice the relationship",
      type: "guided_practice"
    })],
    topic: "A new interdisciplinary topic"
  });

  assert.match(result.slides[0].studentContent.question ?? "", /core component/i);
  assert.doesNotMatch(result.slides[0].studentContent.question ?? "", /^Your turn$/i);
  assert.equal(result.summary.unresolvedErrors, 0);
});

test("resets colliding visual metadata and removes competing visual layers", () => {
  const result = runSlideDoctor({
    conceptGraph,
    slides: [slide({
      id: "overlap",
      studentContent: { explanation: "A diagram explains how both parts interact in the model." },
      visuals: [
        {
          accessibilityLabel: "A colliding model.",
          diagramLayout: {
            collisions: [{ firstId: "one", overlapArea: 120, secondId: "two" }],
            elements: [],
            overflowElementIds: ["two"],
            safeBounds: { height: 500, width: 920, x: 20, y: 20 }
          },
          id: "bad-layout",
          labels: ["one", "two"],
          type: "labeled_system"
        },
        {
          accessibilityLabel: "A second competing model.",
          id: "extra-layout",
          labels: ["one", "two"],
          type: "labeled_cards"
        }
      ]
    })],
    topic: "A new interdisciplinary topic"
  });
  assert.equal(result.slides[0].visuals.length, 1);
  assert.equal(result.slides[0].visuals[0].diagramLayout, undefined);
  assert.equal(result.summary.repairedSlides, 1);
  assert.equal(result.summary.unresolvedErrors, 0);
});

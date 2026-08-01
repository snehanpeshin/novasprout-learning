import assert from "node:assert/strict";
import test from "node:test";
import {
  legacyLessonToSlidePlan,
  visualSelectionFromDirection
} from "../app/lib/lessonSlidePlan.ts";

test("accepts free-form AI visual language instead of a fixed template name", () => {
  assert.equal(visualSelectionFromDirection("labeled plant anatomy cutaway"), "labeled_scientific_diagram");
  assert.equal(visualSelectionFromDirection("fraction bar model with equal wholes"), "number_line");
  assert.equal(visualSelectionFromDirection("historical chronology ribbon"), "timeline");
  assert.equal(visualSelectionFromDirection("text only because the learner should read the quote"), "no_visual");
});

test("honors AI-selected visuals and layouts while keeping renderer validation", () => {
  const plan = legacyLessonToSlidePlan({
    context: { grade: "Grade 5", subject: "Science", topic: "Plant structures and transport" },
    lesson: {
      conceptExplanation: "Roots absorb water and minerals. The stem transports materials. Leaves use light, carbon dioxide, and water to make sugars.",
      duration: "30-minute lesson",
      fullLessonSegments: [
        {
          activity: "Root hairs increase contact with soil, while xylem carries water upward through the stem to the leaves.",
          title: "Root and stem transport"
        }
      ],
      guidedExample: "Trace one water molecule from damp soil into a root hair, through xylem in the stem, and into a leaf.",
      learningObjectives: ["Trace water from soil to leaves.", "Connect each plant structure to its function."],
      practiceQuestions: ["Try: Why do root hairs help absorption? Hint: Think about contact area. Answer: They increase surface area in contact with soil."],
      quickAssessment: ["Which tissue carries water upward? Answer: xylem."],
      recommendedNextSession: "Explore how sugars move from leaves to growing tissues.",
      studentFit: "A visual Grade 5 plant systems lesson.",
      title: "Plant Structures and Transport",
      visualPlan: [
        {
          anchor: "cover",
          description: "A clean plant cutaway connecting roots, stem, and leaves.",
          educationalPurpose: "Previews the complete transport system before the parts are studied.",
          layout: "full visual",
          priority: "high",
          targetTitle: "Plant Structures and Transport",
          visualType: "real-world plant illustration"
        },
        {
          anchor: "lesson_segment",
          description: "A labeled plant anatomy cutaway with arrows moving from root hairs into xylem and upward through the stem.",
          educationalPurpose: "Makes the direction of water transport and the structure-function relationship visible.",
          labels: ["root hair", "xylem", "stem", "leaf"],
          layout: "text and visual",
          priority: "high",
          targetTitle: "Root and stem transport",
          visualType: "labeled plant anatomy cutaway"
        }
      ],
      warmUp: "Where does a tall plant get the water found in its highest leaves?"
    }
  });

  const cover = plan.slides.find((slide) => slide.id === "title");
  const transport = plan.slides.find((slide) => slide.id === "content-1");
  assert.equal(cover?.aiVisualDirection, true);
  assert.equal(cover?.layoutType, "full-visual");
  assert.equal(transport?.aiVisualDirection, true);
  assert.equal(transport?.visualSelection, "labeled_scientific_diagram");
  assert.ok(["annotated_image", "labeled_system"].includes(transport?.visuals[0]?.type ?? ""));
  assert.match(transport?.visuals[0]?.accessibilityLabel ?? "", /root hairs.*xylem/i);
});

test("keeps all useful AI-generated content sections instead of enforcing old slide quotas", () => {
  const segments = Array.from({ length: 7 }, (_, index) => ({
    activity: `Section ${index + 1} explains a distinct cause, example, and consequence with enough detail for the learner.`,
    title: `Learning section ${index + 1}`
  }));
  const practiceQuestions = Array.from({ length: 8 }, (_, index) =>
    `Try: Apply idea ${index + 1} to a new example. Hint: Use the relationship. Answer: A checked response ${index + 1}.`
  );
  const plan = legacyLessonToSlidePlan({
    context: { grade: "Grade 8", subject: "Other / Interdisciplinary", topic: "Systems thinking" },
    lesson: {
      conceptExplanation: "A system contains connected parts. Changes in one part can cause direct, delayed, or indirect effects elsewhere in the system.",
      duration: "60-minute deep lesson",
      fullLessonSegments: segments,
      guidedExample: "Follow one change through inputs, connected parts, feedback, and a final observable outcome.",
      learningObjectives: ["Explain how connected parts create system behavior."],
      practiceQuestions,
      quickAssessment: ["Name one feedback effect and explain it."],
      title: "Systems Thinking"
    }
  });

  assert.ok(plan.slides.some((slide) => slide.id === "content-7"));
  assert.ok(plan.slides.some((slide) => slide.id === "practice-8"));
});

test("routes a free-form worked-example direction to a renderable visual", () => {
  const plan = legacyLessonToSlidePlan({
    context: { grade: "Grade 6", subject: "Mathematics", topic: "Equivalent ratios" },
    lesson: {
      conceptExplanation: "Equivalent ratios compare quantities with the same multiplicative relationship.",
      duration: "30-minute lesson",
      fullLessonSegments: [],
      guidedExample: "A recipe uses 2 cups of flour for 3 batches. Find the amount for 12 batches.",
      learningObjectives: ["Use a scale factor to find an equivalent ratio."],
      practiceQuestions: ["Find an equivalent ratio for 3:5."],
      quickAssessment: ["Explain how to check two ratios."],
      title: "Equivalent Ratios",
      visualPlan: [{
        anchor: "example",
        description: "Turn the recipe example into a worked visual.",
        educationalPurpose: "Connect every scale-factor step to the quantities it changes.",
        layout: "step-by-step",
        priority: "essential",
        steps: ["Write 2/3 = x/12.", "Scale 3 to 12 by 4.", "Scale 2 by 4 to get 8.", "Check 8/12 = 2/3."],
        targetTitle: "A recipe uses 2 cups of flour for 3 batches",
        visualType: "worked solution with progressive reasoning"
      }]
    }
  });

  const example = plan.slides.find((slide) => slide.id === "worked-example-1");
  assert.equal(example?.aiVisualDirection, true);
  assert.equal(example?.visuals[0]?.type, "worked_solution");
  assert.equal(example?.visuals[0]?.sections?.length, 6);
  assert.equal(example?.visualPriority, "high");
});

test("keeps the cover visual on the cover when a concept title shares topic words", () => {
  const plan = legacyLessonToSlidePlan({
    context: { grade: "Grade 5", subject: "Science", topic: "Water transport in plants" },
    lesson: {
      conceptExplanation: "Water enters roots and travels upward through xylem to the leaves.",
      guidedExample: "Trace one water molecule through the plant.",
      learningObjectives: ["Trace water through a plant."],
      practiceQuestions: ["Where does water enter a plant?"],
      quickAssessment: ["Name the water-carrying tissue."],
      title: "How water moves through plants",
      visualPlan: [
        {
          anchor: "cover",
          description: "A whole plant from roots to leaves.",
          educationalPurpose: "Orient the learner to the complete system.",
          targetTitle: "whole plant overview",
          visualType: "real-world plant illustration"
        },
        {
          anchor: "concept",
          description: "A close-up of a continuous water column in xylem.",
          educationalPurpose: "Explain upward transport.",
          targetTitle: "xylem water column",
          visualType: "labeled anatomy cutaway"
        }
      ]
    }
  });

  const cover = plan.slides.find((slide) => slide.id === "title");
  assert.match(cover?.visuals[0]?.accessibilityLabel ?? "", /whole plant/i);
  assert.doesNotMatch(cover?.visuals[0]?.accessibilityLabel ?? "", /xylem/i);
});

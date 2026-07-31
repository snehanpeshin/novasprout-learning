import assert from "node:assert/strict";
import test from "node:test";

import { detectSubjectKey, legacyLessonToSlidePlan } from "../app/lib/lessonSlidePlan.ts";
import { createAssessmentItem, hideAssessmentAnswer } from "../app/lib/lessonSlides/assessmentGenerator.ts";
import { fitTextToBox } from "../app/lib/lessonSlides/contentCompressor.ts";
import { assessSlideDesignPrinciples, scoreDeckQuality } from "../app/lib/lessonSlides/deckQualityScorer.ts";
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

test("scores all seven presentation design principles", () => {
  const result = assessSlideDesignPrinciples({
    accessibilityLabel: "A simple diagram showing a complete circuit.",
    id: "balanced-design",
    layoutType: "text-visual",
    slideType: "concept_explanation",
    studentContent: {
      keyIdea: "A complete path allows charge to move.",
      explanation: "The battery supplies energy while the closed path lets charge flow.",
      bullets: ["Trace the path.", "Find any gap."]
    },
    title: "Why circuits need a complete path",
    visuals: [{ type: "circuit_diagram" }]
  });
  assert.deepEqual(Object.keys(result.scores).sort(), [
    "consistency",
    "contrast",
    "hierarchy",
    "scale",
    "simplicity",
    "typography",
    "whitespace"
  ]);
  assert.ok(result.score >= 90);
});

test("design gate flags dense, weakly structured slides", () => {
  const denseSlide = {
    id: "dense",
    layoutType: "text-focus" as const,
    slideType: "concept_explanation" as const,
    studentContent: {
      bullets: Array.from({ length: 8 }, (_, index) =>
        `VERY LONG BULLET ${index} repeats several competing details and makes the learner process too much information without a clear visual pause or focal point`
      ),
      explanation: Array.from({ length: 90 }, () => "detail").join(" ")
    },
    title: "THIS HEADING IS FAR TOO LONG AND DOES NOT CREATE A CLEAR OR USEFUL VISUAL HIERARCHY"
  };
  const design = assessSlideDesignPrinciples(denseSlide);
  const deck = scoreDeckQuality([denseSlide], new Map());
  assert.ok(design.scores.whitespace < 75);
  assert.ok(design.scores.simplicity < 75);
  assert.ok(design.scores.typography < 75);
  assert.equal(deck.exportReady, false);
  assert.match(deck.reasons.join(" "), /design|Whitespace|Simplicity|Typography/i);
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
  assert.ok((plan.deckQuality?.designAverage ?? 0) >= 80);
  assert.ok(plan.deckQuality?.designPrinciples.contrast);
  assert.equal(plan.deckQuality?.exportReady, true);
});

test("turns a digestive-system lesson into complete, topic-specific teaching slides", () => {
  const plan = legacyLessonToSlidePlan({
    context: { grade: "Grade 7", subject: "Science", topic: "Digestive system" },
    lesson: {
      conceptExplanation: "The digestive system is a series of organs that break food into smaller pieces and chemicals the body can use. Digestion starts in the mouth where mechanical chewing and the enzyme salivary amylase begin breaking down carbohydrates, then continues through the esophagus to the stomach where acid and enzymes begin protein digestion. Most chemical digestion and nutrient absorption happen in the small intestine, aided by bile from the liver and gallbladder and enzymes and bicarbonate from the pancreas. Villi and microvilli increase surface area so nutrients can enter capillaries and lacteals. Visuals to show: a full-body tract and villus cross-section.",
      conceptModel: {
        assessmentTargets: ["Trace the digestive pathway."],
        formulas: [],
        misconceptions: [],
        nodes: [
          { definition: "A muscular tube that moves swallowed food to the stomach.", id: "esophagus", label: "esophagus" },
          { definition: "The main site of chemical digestion and nutrient absorption.", id: "small-intestine", label: "small intestine" }
        ],
        relationships: []
      },
      guidedExample: "Imagine swallowing a bite of a sandwich. Step 1: Mouth - teeth grind food and amylase starts starch digestion. Step 2: Esophagus - peristalsis pushes the bolus downward. Step 3: Stomach - acid and pepsin begin protein digestion. Step 4: Small intestine - bile emulsifies fat and pancreatic enzymes continue digestion. Step 5: Absorption - sugars and amino acids enter capillaries while fats enter lacteals. Final check: name where each nutrient is mainly digested and absorbed.",
      learningObjectives: [
        "Trace the path food follows from mouth to anus and state the main function of each organ.",
        "Explain how bile and pancreatic secretions aid fat digestion and neutralize acid."
      ],
      practiceQuestions: [
        "Which organ stores bile and releases it when fats are present? Hint: It sits under the liver. Answer: Gallbladder. Why: It stores concentrated bile.",
        "Estimate transit speed if food travels 6 meters in 14,400 seconds. Hint: Use v = d/t. Answer: 0.000417 m/s. Why: Divide distance by time."
      ],
      quickAssessment: [
        "Where does most nutrient absorption occur? Answer: Small intestine. Why: Villi provide a large surface area."
      ],
      title: "Digestive System"
    }
  });
  const allText = plan.slides
    .flatMap((slide) => [
      slide.title,
      slide.studentContent.keyIdea,
      slide.studentContent.explanation,
      ...(slide.studentContent.bullets ?? []),
      ...(slide.studentContent.steps ?? []),
      ...slide.visuals.flatMap((visual) => [
        ...(visual.labels ?? []),
        ...(visual.columns ?? []).flatMap((column) => [column.title, ...column.items])
      ])
    ])
    .filter(Boolean)
    .join(" ");
  const objectiveSlide = plan.slides.find((slide) => slide.id === "title");
  const workedSlides = plan.slides.filter((slide) => slide.slideType === "worked_example");
  const practiceSlides = plan.slides.filter((slide) => slide.slideType === "independent_practice");

  assert.match(objectiveSlide?.studentContent.bullets?.[0] ?? "", /mouth to anus/i);
  assert.doesNotMatch(allText, /Visuals to show|A key term used to reason|Find the requested quantity/i);
  assert.ok(workedSlides.length >= 3);
  assert.ok(workedSlides.some((slide) => slide.studentContent.steps?.some((step) => /peristalsis/i.test(step))));
  assert.ok(practiceSlides.every((slide) => slide.visuals[0]?.type !== "concept_map"));
  assert.ok(plan.slides.some((slide) => slide.title === "How Bile And Lipase Digest Fat"));
  assert.ok(plan.slides.some((slide) => slide.title === "Blood Or Lymph?"));
  assert.match(allText, /lacteal/i);
});

test("applies the shared content and design safeguards across subjects", () => {
  const cases = [
    { subject: "Mathematics", topic: "Equivalent fractions", example: "Step 1: Draw equal wholes. Step 2: Split each part by the same factor. Step 3: Check that the shaded amount is unchanged." },
    { subject: "Science", topic: "Plant photosynthesis", example: "Step 1: Light reaches a leaf. Step 2: Chloroplasts use carbon dioxide and water. Step 3: Glucose and oxygen are produced." },
    { subject: "English", topic: "Text evidence", example: "Step 1: State a precise claim. Step 2: Select a relevant detail. Step 3: Explain how the detail supports the claim." },
    { subject: "Computer Science", topic: "Conditional logic", example: "Step 1: Read the input. Step 2: Test the condition. Step 3: Follow the matching branch and check the output." },
    { subject: "Social Studies", topic: "Checks and balances", example: "Step 1: Identify the branch taking action. Step 2: Name the constitutional check. Step 3: Explain how the check limits concentrated power." }
  ];

  for (const item of cases) {
    const plan = legacyLessonToSlidePlan({
      context: { grade: "Grade 7", subject: item.subject, topic: item.topic },
      lesson: {
        conceptExplanation: `${item.topic} has connected parts that form one explainable system. Each relationship should be traced with accurate evidence and a clear visual model.`,
        conceptModel: {
          assessmentTargets: [`Explain ${item.topic}.`],
          formulas: [],
          misconceptions: [],
          nodes: [
            { definition: `A precise idea used to explain ${item.topic}.`, id: "core-idea", label: "core idea" }
          ],
          relationships: []
        },
        guidedExample: item.example,
        learningObjectives: [
          `Explain the central relationship in ${item.topic} and apply it to a complete new example.`
        ],
        practiceQuestions: [
          `How would you apply ${item.topic} to a new case? Hint: Trace one relationship. Answer: Use the model and justify each step.`
        ],
        title: item.topic
      }
    });
    const learnerText = plan.slides
      .flatMap((slide) => [
        slide.studentContent.keyIdea,
        slide.studentContent.explanation,
        slide.studentContent.question,
        ...(slide.studentContent.bullets ?? []),
        ...(slide.studentContent.steps ?? [])
      ])
      .filter(Boolean)
      .join(" ");

    assert.equal(plan.deckQuality?.exportReady, true, `${item.subject} should pass the shared quality gate`);
    assert.ok((plan.deckQuality?.designAverage ?? 0) >= 80);
    assert.ok(plan.slides.every((slide) => (slide.qualityScore?.designScore ?? 0) >= 75));
    assert.ok(plan.slides.some((slide) => slide.slideType === "worked_example"));
    assert.doesNotMatch(learnerText, /\b(?:and|or|because|from|using|with)\.$/i);
  }
});

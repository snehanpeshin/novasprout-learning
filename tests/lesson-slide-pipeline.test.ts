import assert from "node:assert/strict";
import test from "node:test";

import { detectSubjectKey, legacyLessonToSlidePlan } from "../app/lib/lessonSlidePlan.ts";
import { createAssessmentItem, hideAssessmentAnswer } from "../app/lib/lessonSlides/assessmentGenerator.ts";
import { fitTextToBox } from "../app/lib/lessonSlides/contentCompressor.ts";
import { assessSlideDesignPrinciples, scoreDeckQuality } from "../app/lib/lessonSlides/deckQualityScorer.ts";
import { formatMathExpression, validateFormattedMath } from "../app/lib/lessonSlides/mathRenderer.ts";
import { classifySlide } from "../app/lib/lessonSlides/slideClassifier.ts";
import { finalizeInstructionalPlan } from "../app/lib/lessonSlides/lessonPlanner.ts";
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

test("builds cell-division lessons from cell-cycle content instead of generic cell anatomy", () => {
  const plan = legacyLessonToSlidePlan({
    context: {
      grade: "Grade 7",
      subject: "Science",
      topic: "Cell division, cell cycle, mitosis, cytokinesis, and simple calculations"
    },
    lesson: {
      conceptExplanation: "The cell cycle includes interphase, mitosis, and cytokinesis. DNA is copied during S phase before sister chromatids separate.",
      conceptModel: {
        nodes: [
          { definition: "The repeating sequence of growth and division.", id: "cycle", label: "cell cycle" },
          { definition: "Growth and DNA replication before nuclear division.", id: "interphase", label: "interphase" },
          { definition: "Division of the nucleus.", id: "mitosis", label: "mitosis" },
          { definition: "Division of the cytoplasm.", id: "cytokinesis", label: "cytokinesis" },
          { definition: "A DNA-containing structure.", id: "chromosome", label: "chromosome" }
        ],
        relationships: []
      },
      fullLessonSegments: [
        { activity: "Explain prophase, metaphase, anaphase, and telophase. Show a diagram.", title: "Authoring note" },
        { activity: "DNA is copied during S phase before mitosis begins.", title: "DNA before division" }
      ],
      guidedExample: "Example 1: One cell divides four times. Step 1: Start with one cell. Step 2: Use N = N0 x 2^n. Step 3: Calculate 2^4 = 16. Final check: Double four times.",
      learningObjectives: ["Sequence the stages and calculate cell counts."],
      practiceQuestions: ["How many cells result after three complete rounds of division?"],
      title: "Cell Division"
    }
  });
  const titles = plan.slides.map((slide) => slide.title);
  const vocabulary = plan.slides.find((slide) => slide.id === "vocabulary")?.studentContent.bullets?.join(" ") ?? "";
  const contentText = plan.slides
    .flatMap((slide) => Object.values(slide.studentContent))
    .flat()
    .filter((value): value is string => typeof value === "string")
    .join(" ");
  const workedExample = plan.slides.find((slide) => slide.id === "worked-example-1");

  assert.ok(titles.includes("Track Chromosomes Through Mitosis"));
  assert.ok(titles.includes("Cytokinesis: Animal And Plant Cells"));
  assert.ok(titles.includes("Calculate Cell Doubling"));
  assert.ok(titles.includes("Calculate Mitotic Index"));
  assert.equal(titles.includes("Inside A Cell"), false);
  assert.equal(titles.includes("From Cells To Organ Systems"), false);
  assert.match(vocabulary, /cell cycle|interphase|mitosis|cytokinesis/i);
  assert.doesNotMatch(contentText, /Explain prophase|Show a diagram/i);
  assert.ok((workedExample?.studentContent.steps?.length ?? 0) >= 4);
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
      explanation: "Apply the circuit rule to this case. Answer: It stays off.",
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
  assert.equal(result.repaired.studentContent?.explanation, "Apply the circuit rule to this case.");
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

test("quality scoring does not penalize the same repaired issue more than once", () => {
  const slide = {
    accessibilityLabel: "A clear visual model for equivalent ratios.",
    id: "repaired-slide",
    layoutType: "text-visual" as const,
    slideType: "concept_explanation" as const,
    studentContent: { keyIdea: "Equivalent ratios describe the same relationship." },
    title: "Equivalent Ratios",
    visuals: [{
      accessibilityLabel: "Two equivalent ratio models.",
      id: "ratio-model",
      labels: ["2:3", "4:6"],
      type: "ratio_table" as const
    }]
  };
  const repairedFinding = {
    code: "placeholder_slide" as const,
    message: "A placeholder was replaced with teaching content.",
    repaired: true,
    severity: "warning" as const
  };
  const oneFinding = scoreDeckQuality([slide], new Map([[slide.id, [repairedFinding]]]));
  const repeatedFinding = scoreDeckQuality(
    [slide],
    new Map([[slide.id, [repairedFinding, { ...repairedFinding }, { ...repairedFinding }]]])
  );
  assert.equal(repeatedFinding.minimum, oneFinding.minimum);
  assert.equal(repeatedFinding.exportReady, true);
});

test("quality scoring still blocks an unresolved accuracy error", () => {
  const slide = {
    accessibilityLabel: "A worked equation.",
    id: "accuracy-error",
    layoutType: "equation-focus" as const,
    slideType: "worked_example" as const,
    studentContent: { keyIdea: "Substitute each value before calculating." },
    title: "Check The Calculation"
  };
  const deck = scoreDeckQuality([slide], new Map([[slide.id, [{
    code: "calculation_error",
    message: "The displayed result does not match the calculation.",
    repaired: false,
    severity: "error"
  }]]]));
  assert.equal(deck.exportReady, false);
  assert.match(deck.reasons.join(" "), /unresolved validation error/i);
});

test("final quality uses the repaired task instead of a stale placeholder error", () => {
  const plan = legacyLessonToSlidePlan({
    context: { grade: "Grade 7", subject: "Mathematics", topic: "Area and volume" },
    lesson: {
      conceptExplanation: "Area measures a flat region in square units, while volume measures three-dimensional space in cubic units.",
      conceptModel: {
        assessmentTargets: ["Calculate area and volume with appropriate units."],
        formulas: [],
        misconceptions: [],
        nodes: [
          { definition: "The amount of two-dimensional space inside a boundary.", id: "area", label: "area" },
          { definition: "The amount of three-dimensional space inside a solid.", id: "volume", label: "volume" }
        ],
        relationships: [{ explanation: "Area uses square units while volume uses cubic units.", from: "area", relationship: "differs from", to: "volume" }]
      },
      learningObjectives: ["Distinguish area from volume and select the correct units."],
      practiceQuestions: ["Your turn"],
      title: "Area and Volume"
    }
  });
  const practice = plan.slides.find((slide) => slide.id === "practice-1");
  const unresolvedPlaceholder = (plan.qualityFindings ?? []).some((finding) =>
    finding.code === "placeholder_slide" && finding.severity === "error" &&
    finding.repair !== "Automatically repaired before rendering."
  );

  assert.ok(practice);
  assert.doesNotMatch(practice?.studentContent.question ?? "", /^Your turn$/i);
  assert.equal(unresolvedPlaceholder, false);
});

test("final semantic quality uses repaired photosynthesis content instead of a stale domain error", () => {
  const base = legacyLessonToSlidePlan({
    context: { grade: "Grades 6-8", subject: "Science", topic: "How plants make food: photosynthesis" },
    lesson: {
      conceptExplanation: "Chlorophyll in chloroplasts captures light energy. Plants use carbon dioxide and water to make glucose and release oxygen.",
      conceptModel: {
        assessmentTargets: ["Explain the inputs and outputs of photosynthesis."],
        formulas: [],
        misconceptions: [],
        nodes: [
          { definition: "An organelle where photosynthesis occurs.", id: "chloroplast", label: "chloroplast" },
          { definition: "A gas plants use to build glucose.", id: "carbon-dioxide", label: "carbon dioxide" }
        ],
        relationships: [
          { explanation: "Chloroplasts use light energy to help form glucose.", from: "chloroplast", relationship: "helps form", to: "glucose" }
        ]
      },
      learningObjectives: ["Trace how light, water, and carbon dioxide contribute to glucose production."],
      practiceQuestions: ["How do the inputs of photosynthesis reach a leaf?"],
      title: "Photosynthesis"
    }
  });
  const practiceId = base.slides.find((slide) =>
    ["guided_practice", "independent_practice", "knowledge_check"].includes(slide.slideType)
  )?.id;
  assert.ok(practiceId);

  const plan = finalizeInstructionalPlan({
    ...base,
    slides: base.slides.map((item) => item.id === practiceId
      ? {
          ...item,
          studentContent: {
            keyIdea: "The mouth, stomach, and small intestine break food down during digestion.",
            question: "Your turn"
          }
        }
      : item)
  });
  const repairedPractice = plan.slides.find((slide) => slide.id === practiceId);
  const unresolvedDigestiveError = (plan.qualityFindings ?? []).some((finding) =>
    finding.code === "unsupported_claim" && finding.severity === "error" && /digestive system/i.test(finding.explanation)
  );

  assert.equal(
    unresolvedDigestiveError,
    false,
    JSON.stringify({
      findings: plan.qualityFindings?.filter((finding) => /digestive system/i.test(finding.explanation)),
      repairedPractice: repairedPractice?.studentContent,
      vocabulary: plan.slides.find((slide) => slide.id === "vocabulary"),
      semanticAccuracy: plan.semanticAccuracy
    })
  );
  assert.equal(plan.semanticAccuracy?.unresolvedErrors, 0);
  assert.doesNotMatch(JSON.stringify(repairedPractice?.studentContent), /mouth|stomach|small intestine/i);
  assert.match(repairedPractice?.studentContent.question ?? "", /chloroplast|photosynthesis|carbon dioxide/i);
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
  assert.ok(workedSlides.length >= 1);
  assert.ok(workedSlides.flatMap((slide) => slide.studentContent.steps ?? []).length >= 6);
  assert.ok(workedSlides.some((slide) => slide.studentContent.steps?.some((step) => /peristalsis/i.test(step))));
  assert.ok(practiceSlides.every((slide) => slide.visuals[0]?.type !== "concept_map"));
  assert.ok(plan.slides.some((slide) => slide.title === "How Bile And Lipase Digest Fat"));
  assert.ok(plan.slides.some((slide) => slide.title === "Blood Or Lymph?"));
  assert.match(allText, /lacteal/i);
});

test("builds a chemistry lesson with verified periodic-table teaching visuals", () => {
  const plan = legacyLessonToSlidePlan({
    context: { grade: "Grade 7", subject: "Science", topic: "Periodic table and atomic structure" },
    lesson: {
      conceptExplanation: "The periodic table organizes elements by increasing atomic number. Atomic number equals proton count, while mass number equals protons plus neutrons. Neutral atoms have equal numbers of protons and electrons; ions form when electrons are gained or lost.",
      guidedExample: "For chlorine-35, atomic number 17 gives 17 protons. Neutrons equal 35 minus 17, or 18. Neutral chlorine has 17 electrons, while chloride has gained one electron and has 18.",
      learningObjectives: [
        "Read an element square and identify atomic number, symbol, name, and average atomic mass.",
        "Calculate proton, neutron, and electron counts for atoms and simple ions."
      ],
      practiceQuestions: [
        "How many neutrons are in sodium-23 if its atomic number is 11? Answer: 12. Why: 23 - 11 = 12."
      ],
      quickAssessment: [
        "Does forming a chloride ion change the proton count? Answer: No. Why: Ion formation changes electrons."
      ],
      title: "Periodic table and atomic structure"
    }
  });
  const expectedSlides = ["read-element-square", "groups-and-periods", "count-atomic-particles", "periodic-trends"];
  assert.ok(expectedSlides.every((id) => plan.slides.some((slide) => slide.id === id)));
  assert.ok(plan.slides.some((slide) => slide.math?.some((formula) => /N\s*=\s*A\s*-\s*Z/.test(formula.expression))));
  assert.equal(plan.deckQuality?.exportReady, true);
  assert.equal(plan.semanticAccuracy?.unresolvedErrors, 0);
});

test("uses the active concept model for neighboring science-topic vocabulary", () => {
  const plan = legacyLessonToSlidePlan({
    context: { grade: "Grades 6-8", subject: "Science", topic: "Balancing chemical equations" },
    lesson: {
      conceptExplanation: "A balanced chemical equation has equal atom counts for every element on both sides because matter is conserved. Coefficients change molecule counts without changing a substance's formula.",
      conceptModel: {
        assessmentTargets: ["Balance an equation and verify each atom count."],
        formulas: [],
        misconceptions: [],
        nodes: [
          { definition: "A starting substance in a chemical reaction.", id: "reactant", label: "reactant" },
          { definition: "A substance formed by a chemical reaction.", id: "product", label: "product" },
          { definition: "A whole-number multiplier placed before a formula.", id: "coefficient", label: "coefficient" },
          { definition: "The principle that matter is not created or destroyed.", id: "conservation", label: "conservation of mass" },
          { definition: "A count used to verify both sides of an equation.", id: "atom-count", label: "atom count" }
        ],
        relationships: [
          { explanation: "Coefficients are adjusted until every atom count matches.", from: "coefficient", relationship: "balances", to: "atom count" }
        ]
      },
      guidedExample: "Step 1: Count hydrogen and oxygen in H2 + O2 to H2O. Step 2: Add a coefficient of 2 before H2O. Step 3: Add a coefficient of 2 before H2 and verify both sides.",
      learningObjectives: [
        "Explain conservation of mass in a chemical equation.",
        "Balance a simple equation and verify atom counts."
      ],
      practiceQuestions: ["Balance N2 + H2 to NH3 and check each element."],
      title: "Balancing chemical equations"
    }
  });

  const vocabulary = plan.slides.find((slide) => slide.id === "vocabulary");
  const terms = (vocabulary?.studentContent.bullets ?? []).join(" ");
  assert.match(terms, /reactant|product|coefficient|conservation of mass/i);
  assert.doesNotMatch(terms, /atomic number|mass number|proton|neutron|isotope|group|period/i);
  assert.equal(plan.semanticAccuracy?.unresolvedErrors, 0);
});

test("builds a student-facing World War I deck with topic-specific visuals", () => {
  const plan = legacyLessonToSlidePlan({
    context: {
      grade: "Grades 6-8",
      subject: "Social Studies",
      topic: "World War I causes, trench warfare, and consequences"
    },
    lesson: {
      conceptExplanation: "Long-term nationalism, imperial competition, militarism, and alliance commitments made Europe unstable. The assassination at Sarajevo triggered the July Crisis. Mobilizations and declarations widened the conflict. On the Western Front, connected trench systems and industrial firepower helped create a costly stalemate.",
      fullLessonSegments: [
        {
          activity: "Explain how the front-line trench connected to communication trenches, support trenches, and dugouts. Show how soldiers crossed no-man's-land.",
          title: "Trench layout: Explain how defensive depth worked"
        },
        {
          activity: "The armistice ended fighting on November 11, 1918. Later treaties changed borders and imposed different settlements on the defeated powers.",
          title: "After the fighting stopped"
        }
      ],
      guidedExample: "Step 1: Separate long-term tensions from the immediate trigger. Step 2: Trace the assassination, ultimatum, mobilization, and declarations. Step 3: Use dated evidence to explain why the conflict widened. Final check: Do not describe the alliance system as automatic.",
      learningObjectives: [
        "Distinguish long-term causes from the 1914 trigger.",
        "Relate trench systems and industrial weapons to battlefield stalemate."
      ],
      practiceQuestions: [
        "A force had 200,000 soldiers and suffered 30,000 casualties. Calculate the casualty percentage.",
        "Short answer: Label the front-line trench, communication trench, support trench, dugout, and no-man's-land.",
        "Compare the Central Powers and Allied Powers and note one country that joined later."
      ],
      title: "World War I: Causes, Trench Warfare, and Consequences"
    }
  });

  const allLearnerText = plan.slides.flatMap((slide) => [
    slide.title,
    slide.studentContent.keyIdea,
    slide.studentContent.explanation,
    slide.studentContent.question,
    ...(slide.studentContent.bullets ?? []),
    ...(slide.studentContent.steps ?? [])
  ]).filter(Boolean).join(" ");
  const casualtySlide = plan.slides.find((slide) => /casualty percentage/i.test(slide.studentContent.question ?? ""));
  const trenchSlides = plan.slides.filter((slide) => /trench/i.test(`${slide.title} ${slide.studentContent.question ?? ""}`));
  const shortAnswerSlide = plan.slides.find((slide) => /short-response question/i.test(slide.studentContent.question ?? ""));

  assert.equal(plan.slides[0].title, "World War I: Causes, Trench Warfare, and Consequences");
  assert.ok(plan.slides.some((slide) => slide.title === "Long-Term Causes And The 1914 Trigger"));
  assert.ok(plan.slides.some((slide) => slide.title === "The Wartime Coalitions Changed"));
  assert.ok(plan.slides.some((slide) => slide.title === "How A Trench System Worked"));
  assert.ok(trenchSlides.some((slide) => slide.visuals.some((visual) => visual.type === "trench_system")));
  assert.equal(casualtySlide?.visuals[0]?.type, "equation_steps");
  assert.match(casualtySlide?.visuals[0]?.equation ?? "", /15\\%/);
  assert.match(shortAnswerSlide?.studentContent.question ?? "", /front-line trench.*no-man's-land/i);
  assert.doesNotMatch(allLearnerText, /Explain how|Show how|Identify quantities or evidence|include appropriate units|key takeaway notes/i);
  assert.match(allLearnerText, /assassination as the only cause/i);
  assert.equal(plan.semanticAccuracy?.unresolvedErrors, 0);
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

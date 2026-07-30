import type {
  LessonPlanSlide,
  LessonSlidePlan,
  VisualSpec
} from "../lessonSlidePlan.ts";
import type { QualityFinding, StructuredFormula } from "../lessonEngine.ts";
import { assessmentAnswerKey, createAssessmentItem, hideAssessmentAnswer } from "./assessmentGenerator.ts";
import {
  bindCircuitProblem,
  circuitAnswerText,
  circuitDiagramLabelTexts
} from "./circuitBinding.ts";
import { rewriteToFit } from "./contentCompressor.ts";
import { scoreDeckQuality } from "./deckQualityScorer.ts";
import { legacyLayoutType, selectPurposeLayout } from "./layoutEngine.ts";
import { electricityFormulaSet, formatMathExpression } from "./mathRenderer.ts";
import { classifySlide, slidePurpose } from "./slideClassifier.ts";
import { isPlaceholderSlide, validateAndRepairSlide } from "./slideValidator.ts";
import { createSpeakerNotes } from "./speakerNotesGenerator.ts";
import { createCircuitDiagramLayout } from "./visualLayoutValidator.ts";
import {
  electricityVisualKind,
  isElectricityContext,
  isValidConceptNode,
  selectVisualType
} from "./visualSelector.ts";
import type {
  AssessmentDifficulty,
  AssessmentItem,
  CircuitProblem,
  SlideValidationFinding,
  VisualSelectionType
} from "./types.ts";

const electricityVocabulary: Record<string, { definition: string; symbol?: string; unit?: string }> = {
  battery: { definition: "An energy source that maintains a potential difference.", symbol: "+ / -" },
  circuit: { definition: "A complete conducting path through which charge can move." },
  conductor: { definition: "A material in which electric charge moves easily." },
  "electric charge": { definition: "A property of matter carried by particles.", symbol: "Q", unit: "coulomb (C)" },
  "energy transfer": { definition: "Movement of energy from the source to circuit components.", unit: "joule (J)" },
  insulator: { definition: "A material that strongly resists charge movement." },
  current: { definition: "The rate at which electric charge passes a point.", symbol: "I", unit: "ampere (A)" },
  power: { definition: "The rate at which electrical energy is transferred.", symbol: "P", unit: "watt (W)" },
  resistance: { definition: "Opposition to electric current in a component.", symbol: "R", unit: "ohm (Ω)" },
  switch: { definition: "A device that opens or closes a circuit path." },
  voltage: { definition: "Potential difference that transfers energy per unit charge.", symbol: "V", unit: "volt (V)" }
};

function clean(value?: string, max = 600) {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length <= max
    ? normalized
    : rewriteToFit(normalized, Math.max(4, Math.floor(max / 7)));
}

function slideText(slide: LessonPlanSlide) {
  const content = slide.studentContent;
  return [
    slide.title,
    content.keyIdea,
    content.explanation,
    content.question,
    ...(content.bullets ?? []),
    ...(content.steps ?? [])
  ].filter(Boolean).join(" ");
}

function visualIsSpecific(visual: VisualSpec, topic: string) {
  if (visual.type !== "concept_map") return true;
  if (!clean(visual.mathematicalRelationship || visual.expectedInsight, 240)) return false;
  const valid: string[] = [];
  for (const label of visual.labels ?? []) {
    if (isValidConceptNode(label, visual.title || topic, valid)) valid.push(label);
  }
  return valid.length >= 2;
}

function electricityFormulaFor(slide: LessonPlanSlide): StructuredFormula[] {
  const text = slideText(slide).toLowerCase();
  const selected = /\bpower\b|p\s*=\s*v\s*i/.test(text)
    ? electricityFormulaSet.filter((formula) => formula.expression.startsWith("P"))
    : /\bohm|voltage|current|resistance|formula/.test(text)
      ? electricityFormulaSet.slice(0, 3)
      : [];
  return selected.map((formula) => ({
    expression: formatMathExpression(formula.expression),
    meaning: formula.meaning,
    units: formula.units
  }));
}

function vocabularyVisual(slide: LessonPlanSlide, topic: string): VisualSpec {
  const terms = (slide.studentContent.bullets ?? []).slice(0, 6);
  const columns = terms.map((term) => {
    const normalized = clean(term, 60).toLowerCase();
    const entry = electricityVocabulary[normalized];
    return {
      items: entry
        ? [entry.definition, [entry.symbol ? `Symbol: ${entry.symbol}` : "", entry.unit ? `Unit: ${entry.unit}` : ""].filter(Boolean).join(" | ")]
        : [`A key term used to reason about ${topic}.`],
      title: clean(term, 32)
    };
  });
  return {
    accessibilityLabel: `Vocabulary definitions, symbols, and units for ${topic}.`,
    columns,
    id: `${slide.id}-vocabulary-grid`,
    labels: terms,
    title: "Terms, symbols, and units",
    type: "vocabulary_grid"
  };
}

function neutralCircuitProblem(arrangement: CircuitProblem["arrangement"]): CircuitProblem {
  return {
    arrangement,
    components: [
      { id: "R1", type: "resistor" },
      { id: "R2", type: "resistor" }
    ],
    question: arrangement === "parallel"
      ? "Compare the two branches in this parallel circuit."
      : "Trace the single path through this series circuit.",
    requestedQuantities: [],
    showSolution: false
  };
}

function withCircuitData(base: Omit<VisualSpec, "type">, type: VisualSpec["type"], problem: CircuitProblem) {
  const diagramLayout = createCircuitDiagramLayout(problem);
  return {
    ...base,
    diagramData: { circuit: problem, kind: "circuit_problem" as const },
    diagramLayout,
    labels: circuitDiagramLabelTexts(problem, false).map((label) => label.text),
    type
  };
}

function electricityVisual(slide: LessonPlanSlide, boundProblem?: CircuitProblem): VisualSpec {
  const kind = electricityVisualKind({ ...slide, legacyType: slide.type });
  const text = slideText(slide).toLowerCase();
  const question = clean(slide.studentContent.question, 600).toLowerCase();
  const base = {
    accessibilityLabel: `A topic-specific electricity model for ${clean(slide.title, 90)}.`,
    id: `${slide.id}-${kind}`,
    title: slide.title
  };
  if (
    /\bcharge\b/.test(question) &&
    /\bcurrent\b/.test(question) &&
    (/\b\d+(?:\.\d+)?\s*(?:coulombs?|c)\b/.test(question) || /\bq\s*=/.test(question)) &&
    (/\b\d+(?:\.\d+)?\s*(?:seconds?|secs?|s)\b/.test(question) || /\bt\s*=/.test(question))
  ) {
    return {
      ...base,
      accessibilityLabel: "Equation relationship between charge, time, and current.",
      equation: "I = Q / t",
      labels: ["I: current in amperes", "Q: charge in coulombs", "t: time in seconds"],
      steps: ["Use I = Q / t.", "Keep charge in coulombs and time in seconds."],
      type: "equation_steps"
    };
  }
  if (kind === "electric_relationships") {
    return {
      ...base,
      columns: [
        { items: ["electric push", "volt (V)"], title: "Voltage V" },
        { items: ["charge flow rate", "ampere (A)"], title: "Current I" },
        { items: ["opposes current", "ohm (Ω)"], title: "Resistance R" },
        { items: ["energy each second", "watt (W)"], title: "Power P" }
      ],
      equation: "V = I R; P = V I",
      expectedInsight: "Voltage, current, resistance, and power describe different measurable parts of one circuit.",
      type: "electric_relationships"
    };
  }
  if (kind === "ohms_law") {
    return {
      ...base,
      equation: "V = I R",
      labels: ["V = I R", "I = V/R", "R = V/I", "Ω = V/A"],
      steps: ["Choose the unknown.", "Select the rearrangement.", "Substitute values with units.", "Check the unit and size."],
      type: "ohms_law"
    };
  }
  if (kind === "electric_power") {
    const powerBase = {
      ...base,
      equation: "P = V I",
      labels: ["P = power (W)", "V = voltage (V)", "I = current (A)"],
      steps: boundProblem?.showSolution
        ? boundProblem.solution?.steps
        : ["Identify voltage and current.", "Choose the requested formula.", "Keep units with each given value."]
    };
    return boundProblem
      ? withCircuitData(powerBase, "electric_power", boundProblem)
      : { ...powerBase, type: "electric_power" };
  }
  if (kind === "series_parallel_comparison") {
    return {
      ...base,
      columns: [
        { items: ["one path", "same current", "voltage is shared", "Rₑq = R₁ + R₂"], title: "Series" },
        { items: ["multiple branches", "current splits", "same branch voltage", "1/Rₑq = 1/R₁ + 1/R₂"], title: "Parallel" }
      ],
      type: "series_parallel_comparison"
    };
  }
  if (kind === "voltmeter_circuit") {
    return { ...base, labels: ["battery", "resistor", "voltmeter across resistor", "current direction"], type: "voltmeter_circuit" };
  }
  if (kind === "battery_symbol") {
    return { ...base, labels: ["long plate: +", "short plate: -", "conventional current leaves +"], type: "battery_symbol" };
  }
  if (kind === "series_circuit") {
    return withCircuitData(base, "series_circuit", boundProblem ?? neutralCircuitProblem("series"));
  }
  if (kind === "parallel_circuit") {
    return withCircuitData(base, "parallel_circuit", boundProblem ?? neutralCircuitProblem("parallel"));
  }
  if (boundProblem) {
    const type = boundProblem.arrangement === "parallel" ? "parallel_circuit" : "series_circuit";
    return withCircuitData(base, type, boundProblem);
  }
  return {
    ...base,
    labels: ["battery (+/-)", "closed switch", "lamp or resistor", "conventional current (+ to -)"],
    type: "circuit_diagram"
  };
}

function workedSolutionVisual(slide: LessonPlanSlide): VisualSpec {
  const content = slide.studentContent;
  const steps = (content.steps ?? []).slice(0, 4);
  const formulas = (slide.math ?? []).map((formula) => formatMathExpression(formula.expression));
  const text = clean(content.explanation || content.question || content.keyIdea, 700);
  const firstSentence = text.split(/(?<=[.!?])\s+/)[0] || "Use the information from the problem.";
  const finalStep = steps.at(-1) || content.answer || "Check the result against the circuit model.";
  return {
    accessibilityLabel: `Worked solution organized from given information through a checked result for ${slide.title}.`,
    id: `${slide.id}-worked-solution`,
    sections: [
      { label: "GIVEN", text: firstSentence },
      { label: "FIND", text: clean(content.question, 180) || "Find the requested quantity." },
      { label: "FORMULA", text: formulas[0] || "Choose the relationship that connects the known and unknown quantities." },
      { label: "SUBSTITUTE", text: steps[1] || "Substitute each value with its unit." },
      { label: "SOLVE", text: steps[2] || finalStep },
      { label: "CHECK", text: finalStep }
    ],
    steps: [...formulas, ...steps].slice(0, 6),
    title: "Reason through the solution",
    type: "worked_solution"
  };
}

function selectedVisual({
  selection,
  slide,
  subject,
  topic,
  circuitProblem
}: {
  circuitProblem?: CircuitProblem;
  selection: VisualSelectionType;
  slide: LessonPlanSlide;
  subject: string;
  topic: string;
}): VisualSpec[] {
  const existing = slide.visuals.filter((visual) => visualIsSpecific(visual, topic));
  const electricity = isElectricityContext(subject, topic);
  if (selection === "no_visual") {
    return slide.slideType === "learning_objectives" || slide.slideType === "next_steps"
      ? []
      : existing.slice(0, 1);
  }
  if (selection === "image_or_illustration") {
    return [{
      accessibilityLabel: `A strong topic illustration introducing ${topic}.`,
      id: `${slide.id}-cover-illustration`,
      labels: [topic, subject],
      title: topic,
      type: "cover_illustration"
    }];
  }
  if (selection === "icon_grid" && slide.slideType === "vocabulary") return [vocabularyVisual(slide, topic)];
  if (
    electricity &&
    existing.length &&
    (/\bconductors?\b.*\binsulators?\b|\binsulators?\b.*\bconductors?\b/i.test(slide.title) ||
      selection === "comparison_table" && existing[0].type === "comparison_table")
  ) return existing.slice(0, 1);
  if (electricity) return [electricityVisual(slide, circuitProblem)];
  if (selection === "worked_solution") return [workedSolutionVisual(slide)];
  if (existing.length) return existing.slice(0, 1);
  if (selection === "equation_flow") {
    const steps = (slide.math ?? []).map((formula) => formatMathExpression(formula.expression));
    return steps.length
      ? [{ accessibilityLabel: `Equation reasoning for ${topic}.`, id: `${slide.id}-equation-flow`, steps, title: "Formula and meaning", type: "equation_steps" }]
      : existing;
  }
  if (selection === "comparison_table") return existing.filter((visual) => visual.type === "comparison_table" || visual.type === "structure_function").slice(0, 1);
  if (selection === "process_flow" || selection === "timeline") return existing.filter((visual) => /process|flow|cooling/.test(visual.type)).slice(0, 1);
  if (selection === "labeled_scientific_diagram") return existing.filter((visual) => /labeled|annotated|structure/.test(visual.type)).slice(0, 1);
  if (selection === "coordinate_graph") return existing.filter((visual) => /graph/.test(visual.type)).slice(0, 1);
  if (selection === "number_line") return existing.filter((visual) => /number_line/.test(visual.type)).slice(0, 1);
  if (selection === "concept_map") return existing.filter((visual) => visual.type === "concept_map").slice(0, 1);
  return existing.slice(0, 1);
}

function findingsAsQuality(slideId: string, slideNumber: number, findings: SlideValidationFinding[]): QualityFinding[] {
  return findings.map((finding) => ({
    actualValue: finding.actualValue,
    automaticCorrection: finding.automaticCorrection,
    code: finding.code,
    expectedValue: finding.expectedValue,
    explanation: finding.message,
    offendingElement: finding.offendingElement,
    problemType: finding.problemType,
    repair: finding.repaired ? "Automatically repaired before rendering." : "Regenerate or revise this slide.",
    severity: finding.severity,
    slideNumber,
    slideId
  }));
}

export function finalizeInstructionalPlan(plan: LessonSlidePlan): LessonSlidePlan {
  let assessmentIndex = 0;
  const electricityLesson = isElectricityContext(plan.context.subject, plan.context.topic);
  const sourceSlides = plan.slides.filter((slide) => {
    const slideType = classifySlide({ ...slide, legacyType: slide.type });
    return !isPlaceholderSlide({ ...slide, legacyType: slide.type, slideType });
  });
  const draftSlides = sourceSlides.map((slide) => {
    const slideType = classifySlide({ ...slide, legacyType: slide.type });
    const formulas = electricityLesson
      ? [...(slide.math ?? []), ...electricityFormulaFor(slide)]
        .filter((formula, index, all) => all.findIndex((item) => item.expression === formula.expression) === index)
        .slice(0, slideType === "formula_reference" ? 4 : 2)
      : slide.math;
    const circuitProblem = electricityLesson
      ? bindCircuitProblem({ ...slide, legacyType: slide.type, slideType })
      : undefined;
    let assessment = slideType === "independent_practice" || slideType === "knowledge_check" || slideType === "guided_practice"
      ? createAssessmentItem({
          index: assessmentIndex,
          learningObjectiveId: plan.conceptGraph?.assessmentTargets?.[0] ? "objective-1" : "lesson-objective",
          slide: { ...slide, legacyType: slide.type, slideType },
          topic: plan.context.topic
        })
      : undefined;
    const circuitAnswer = circuitAnswerText(circuitProblem);
    if (assessment && circuitAnswer) {
      assessment = {
        ...assessment,
        correctAnswer: circuitAnswer,
        explanation: circuitProblem?.solution?.steps.join(" ") || assessment.explanation
      };
    }
    if (assessment) assessmentIndex += 1;
    const safeContent = assessment ? hideAssessmentAnswer({ ...slide, assessment, legacyType: slide.type, slideType }) : slide.studentContent;
    const selection = selectVisualType({
      slide: { ...slide, assessment, legacyType: slide.type, math: formulas, slideType, studentContent: safeContent },
      subject: plan.context.subject,
      topic: plan.context.topic
    });
    const draft: LessonPlanSlide = {
      ...slide,
      assessment,
      math: formulas,
      purpose: slidePurpose(slideType),
      slideType,
      studentContent: safeContent,
      visualSelection: selection,
      visuals: slide.visuals
    };
    draft.visuals = selectedVisual({
      circuitProblem,
      selection,
      slide: draft,
      subject: plan.context.subject,
      topic: plan.context.topic
    });
    draft.layoutType = legacyLayoutType(selectPurposeLayout({ ...draft, legacyType: draft.type }));
    return draft;
  });

  const findingsBySlide = new Map<string, SlideValidationFinding[]>();
  const repairedSlides = draftSlides.map((slide, index) => {
    const withNotes = {
      ...slide,
      speakerNotes: createSpeakerNotes({
        nextSlideTitle: draftSlides[index + 1]?.title,
        slide: { ...slide, legacyType: slide.type },
        slideType: slide.slideType,
        topic: plan.context.topic
      })
    };
    const validation = validateAndRepairSlide(withNotes);
    findingsBySlide.set(slide.id, validation.findings);
    const repaired = validation.repaired as LessonPlanSlide;
    repaired.studentContent.bullets = repaired.studentContent.bullets?.map((bullet) =>
      rewriteToFit(bullet.replace(/[,;:]+\s*([.!?])$/, "$1"), Math.max(4, bullet.split(/\s+/).length))
    );
    return repaired;
  });

  const answerKey = assessmentAnswerKey(repairedSlides.map((slide) => slide.assessment));
  const deckQuality = scoreDeckQuality(repairedSlides, findingsBySlide);
  const qualityFindings = repairedSlides.flatMap((slide, index) =>
    findingsAsQuality(slide.id, index + 1, findingsBySlide.get(slide.id) ?? [])
  );
  const slides = repairedSlides.map((slide) => ({
    ...slide,
    qualityScore: deckQuality.slides.find((score) => score.slideId === slide.id)
  }));

  return {
    ...plan,
    answerKey,
    deckQuality,
    qualityFindings,
    slides,
    validationWarnings: [
      ...plan.validationWarnings,
      ...qualityFindings.filter((finding) => finding.severity !== "info").map((finding) => `${finding.slideId}: ${finding.explanation}`)
    ]
  };
}

export function hasCompleteAssessmentSequence(items: AssessmentItem[]) {
  const order: AssessmentDifficulty[] = ["recall", "interpret", "substitute", "compare", "explain", "apply"];
  const firstIndex = new Map(items.map((item, index) => [item.difficulty, index]));
  return order.every((difficulty) => firstIndex.has(difficulty))
    && order.every((difficulty, index) => index === 0 || firstIndex.get(order[index - 1])! < firstIndex.get(difficulty)!);
}

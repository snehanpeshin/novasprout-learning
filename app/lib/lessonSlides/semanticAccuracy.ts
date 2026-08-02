import type {
  LessonPlanSlide,
  SubjectKey,
  VisualSpec
} from "../lessonSlidePlan.ts";
import type { SlideValidationFinding } from "./types.ts";

type ConceptGraphSource = {
  nodes?: Array<{ definition?: string; label?: string }>;
  relationships?: Array<{ explanation?: string; from?: string; relationship?: string; to?: string }>;
};

export type SemanticAccuracySummary = {
  inspectedSlides: number;
  repairedMismatches: number;
  subjectAlignmentPercent: number;
  traceabilityPercent: number;
  unresolvedErrors: number;
};

export type SemanticAccuracyResult = {
  findingsBySlide: Map<string, SlideValidationFinding[]>;
  slides: LessonPlanSlide[];
  summary: SemanticAccuracySummary;
};

type DomainRule = {
  context: RegExp;
  name: string;
  signature: RegExp;
  visualTypes: Set<VisualSpec["type"]>;
};

const domainRules: DomainRule[] = [
  {
    context: /\b(periodic table|atom|atomic number|mass number|isotope|ion|proton|neutron|electron)\b/i,
    name: "atomic structure",
    signature: /\b(atomic number|mass number|proton|neutron|electron|isotope|ion charge|periodic table)\b/gi,
    visualTypes: new Set()
  },
  {
    context: /\b(electric(?:ity|al)?|circuit|current|voltage|charge|resistance|ohm|battery|series|parallel)\b/i,
    name: "electricity",
    signature: /\b(battery|circuit|voltage|current|resistor|ohm|series circuit|parallel circuit)\b/gi,
    visualTypes: new Set(["battery_symbol", "circuit_diagram", "electric_power", "electric_relationships", "ohms_law", "parallel_circuit", "series_circuit", "series_parallel_comparison", "voltmeter_circuit"])
  },
  {
    context: /\b(digest(?:ion|ive|ing)?|stomach|intestin\w*|villi|villus|esophagus|pancrea\w*|bile|absorption)\b/i,
    name: "digestive system",
    signature: /\b(mouth|esophagus|stomach|small intestine|large intestine|villi|villus|lacteal|pancreas|bile)\b/gi,
    visualTypes: new Set()
  },
  {
    context: /\b(civic|government|constitution|legislative|executive|judicial|checks? and balances|separation of powers|federalism)\b/i,
    name: "civics",
    signature: /\b(legislative(?: branch)?|executive(?: branch)?|judicial(?: branch)?|checks? and balances|separation of powers)\b/gi,
    visualTypes: new Set()
  },
  {
    context: /\b(economic|economy|supply|demand|market|scarcity|opportunity cost|inflation|tradeoff)\b/i,
    name: "economics",
    signature: /\b(supply|demand|scarcity|opportunity cost|inflation|tradeoff|market equilibrium)\b/gi,
    visualTypes: new Set()
  },
  {
    context: /\b(statistic|sampling|sample mean|standard error|confidence interval|z-score|normal distribution)\b/i,
    name: "statistics",
    signature: /\b(sampling distribution|standard error|confidence interval|z-score|population mean|sample mean)\b/gi,
    visualTypes: new Set(["population_distribution", "repeated_samples", "sampling_distribution", "standard_error_comparison", "normal_tail", "confidence_interval"])
  },
  {
    context: /\b(geometry|solid|prism|pyramid|cube|cuboid|cylinder|cone|sphere|surface area|volume|coordinate space|three-dimensional|3d)\b/i,
    name: "solid geometry",
    signature: /\b(face|edge|vertex|vertices|prism|pyramid|cube|cuboid|cylinder|cone|sphere|solid net)\b/gi,
    visualTypes: new Set(["coordinate_space_3d", "shape_classification", "solid_geometry", "solid_net"])
  },
  {
    context: /\b(coding|computer|program|algorithm|loop|condition|debug|software)\b/i,
    name: "coding",
    signature: /\b(input|output|algorithm|loop|condition|true path|false path|debug)\b/gi,
    visualTypes: new Set(["flowchart"])
  }
];

const traceStopWords = new Set([
  "about", "after", "again", "also", "because", "before", "between", "check", "class", "concept", "each",
  "example", "explain", "from", "grade", "have", "idea", "into", "learn", "lesson", "more", "practice",
  "question", "review", "should", "slide", "student", "than", "that", "their", "these", "they", "this", "through",
  "understand", "using", "what", "when", "where", "which", "with", "would"
]);

function clean(value?: string) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function uniqueMatches(value: string, pattern: RegExp) {
  return new Set((value.match(pattern) ?? []).map((match) => match.toLowerCase())).size;
}

function tokens(value: string) {
  return new Set(
    (value.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? [])
      .filter((word) => !traceStopWords.has(word))
  );
}

function visibleText(slide: LessonPlanSlide) {
  const content = slide.studentContent;
  return clean([
    slide.title,
    content.keyIdea,
    content.explanation,
    content.question,
    ...(content.bullets ?? []),
    ...(content.examples ?? []),
    ...(content.steps ?? [])
  ].filter(Boolean).join(" "));
}

function visualText(visual: VisualSpec) {
  return clean([
    visual.title,
    visual.accessibilityLabel,
    visual.caption,
    visual.expectedInsight,
    visual.mathematicalRelationship,
    ...(visual.labels ?? []),
    ...(visual.steps ?? []),
    ...(visual.rows ?? []).flat(),
    ...(visual.columns ?? []).flatMap((column) => [column.title, ...column.items]),
    ...(visual.sections ?? []).flatMap((section) => [section.label, section.text])
  ].filter(Boolean).join(" "));
}

function graphText(graph?: ConceptGraphSource) {
  return clean([
    ...(graph?.nodes ?? []).flatMap((node) => [node.label, node.definition]),
    ...(graph?.relationships ?? []).flatMap((relationship) => [
      relationship.from,
      relationship.relationship,
      relationship.to,
      relationship.explanation
    ])
  ].filter(Boolean).join(" "));
}

function contextSupportsRule(context: string, rule: DomainRule) {
  return rule.context.test(context);
}

function visualUsesRule(visual: VisualSpec, rule: DomainRule) {
  if (rule.visualTypes.has(visual.type)) return true;
  return uniqueMatches(visualText(visual), rule.signature) >= 2;
}

function textUsesRule(value: string, rule: DomainRule) {
  return uniqueMatches(value, rule.signature) >= 3;
}

function relevantGraphLabels(graph: ConceptGraphSource | undefined, slide: LessonPlanSlide, topic: string) {
  const slideTokens = tokens(visibleText(slide));
  const ranked = (graph?.nodes ?? [])
    .map((node) => {
      const label = clean(node.label);
      const definition = clean(node.definition);
      const score = [...tokens(`${label} ${definition}`)].filter((word) => slideTokens.has(word)).length;
      return { label, score };
    })
    .filter((node) => node.label)
    .sort((first, second) => second.score - first.score)
    .map((node) => node.label);
  const topicLabels = clean(topic).split(/\s+/).filter((word) => word.length > 3);
  return [...new Set([...ranked, ...topicLabels])].slice(0, 5);
}

function neutralVisual(slide: LessonPlanSlide, graph: ConceptGraphSource | undefined, topic: string): VisualSpec {
  const labels = relevantGraphLabels(graph, slide, topic);
  const relationship = (graph?.relationships ?? []).find((item) =>
    labels.some((label) => clean(item.from).toLowerCase() === label.toLowerCase() || clean(item.to).toLowerCase() === label.toLowerCase())
  );
  if (relationship && clean(relationship.from) && clean(relationship.to)) {
    const steps = [clean(relationship.from), clean(relationship.relationship) || "connects to", clean(relationship.to)];
    return {
      accessibilityLabel: `A topic-grounded relationship showing how ${steps.join(" ")}.`,
      expectedInsight: clean(relationship.explanation) || steps.join(" "),
      id: `${slide.id}-accuracy-visual`,
      labels: steps,
      steps,
      title: slide.title,
      type: "process_sequence"
    };
  }
  return {
    accessibilityLabel: `A topic-grounded model using the verified lesson concepts for ${topic}.`,
    expectedInsight: `Every label comes from the lesson concept model for ${topic}.`,
    id: `${slide.id}-accuracy-visual`,
    labels: labels.length >= 2 ? labels : [topic, "Evidence"],
    title: slide.title,
    type: "labeled_cards"
  };
}

function isTraceable(slide: LessonPlanSlide, referenceTokens: Set<string>) {
  const slideTokens = tokens(`${visibleText(slide)} ${slide.visuals.map(visualText).join(" ")}`);
  return [...slideTokens].some((word) => referenceTokens.has(word));
}

function nearlyEqual(first: number, second: number) {
  const scale = Math.max(1, Math.abs(first), Math.abs(second));
  return Math.abs(first - second) <= scale * 0.0005;
}

type ArithmeticIssue = {
  correction?: string;
  expression: string;
  index: number;
  message: string;
};

function formattedNumber(value: number) {
  return String(Number(value.toFixed(6)));
}

function arithmeticIssues(value: string) {
  const issues: ArithmeticIssue[] = [];
  const calculation = /(-?\d+(?:\.\d+)?)\s*(\+|-|x|\*|\/|÷)\s*(-?\d+(?:\.\d+)?)\s*=\s*(-?\d+(?:\.\d+)?)(?:\s*(\/|÷)\s*(-?\d+(?:\.\d+)?))?/gi;
  for (const match of value.matchAll(calculation)) {
    const left = Number(match[1]);
    const right = Number(match[3]);
    const statedNumerator = Number(match[4]);
    const statedDenominator = match[6] === undefined ? null : Number(match[6]);
    const stated = statedDenominator === null
      ? statedNumerator
      : statedDenominator === 0
        ? Number.NaN
        : statedNumerator / statedDenominator;
    const operator = match[2].toLowerCase();
    const expected = operator === "+"
      ? left + right
      : operator === "-"
        ? left - right
        : operator === "/" || operator === "÷"
          ? right === 0 ? Number.NaN : left / right
          : left * right;
    if (!Number.isFinite(expected)) {
      issues.push({
        expression: match[0],
        index: match.index ?? 0,
        message: `${match[0]} is undefined because division by zero is not allowed.`
      });
    } else if (!nearlyEqual(expected, stated)) {
      const result = formattedNumber(expected);
      issues.push({
        correction: `${match[1]} ${match[2]} ${match[3]} = ${result}`,
        expression: match[0],
        index: match.index ?? 0,
        message: `${match[0]} should equal ${result}.`
      });
    }
  }

  const percentCalculation = /(\d+(?:\.\d+)?)\s*%\s+of\s+(-?\d+(?:\.\d+)?)\s*=\s*(-?\d+(?:\.\d+)?)/gi;
  for (const match of value.matchAll(percentCalculation)) {
    const expected = (Number(match[1]) / 100) * Number(match[2]);
    const stated = Number(match[3]);
    if (!nearlyEqual(expected, stated)) {
      const result = formattedNumber(expected);
      issues.push({
        correction: `${match[1]}% of ${match[2]} = ${result}`,
        expression: match[0],
        index: match.index ?? 0,
        message: `${match[0]} should equal ${result}.`
      });
    }
  }
  return [...new Map(issues.map((issue) => [`${issue.index}:${issue.message}`, issue])).values()];
}

const intentionalErrorContext = /\b(?:incorrect|wrong|false|mistake|misconception|error|not true|find|identify|spot|evaluate|decide whether|which equality|which equation)\b/i;

function isIntentionalErrorExample(value: string, issue: ArithmeticIssue) {
  const start = Math.max(0, issue.index - 90);
  const end = Math.min(value.length, issue.index + issue.expression.length + 90);
  return intentionalErrorContext.test(value.slice(start, end));
}

function repairArithmeticField(value: string | undefined, field: string) {
  if (!value) return { findings: [] as SlideValidationFinding[], repairCount: 0, value };
  let repaired = value;
  const findings: SlideValidationFinding[] = [];
  let repairCount = 0;

  for (let pass = 0; pass < 3; pass += 1) {
    const actionable = arithmeticIssues(repaired).filter((issue) => !isIntentionalErrorExample(repaired, issue));
    if (!actionable.length) break;
    let changed = false;
    for (const issue of actionable) {
      if (!issue.correction) continue;
      repaired = repaired.replace(issue.expression, issue.correction);
      repairCount += 1;
      changed = true;
      findings.push(finding(
        "calculation_error",
        `A numeric equality was recomputed in ${field}: ${issue.message}`,
        true,
        "warning",
        `Replaced "${issue.expression}" with "${issue.correction}" and checked the field again.`
      ));
    }
    if (!changed) break;
  }

  for (const issue of arithmeticIssues(repaired).filter((item) => !isIntentionalErrorExample(repaired, item))) {
    findings.push(finding(
      "calculation_error",
      `A numeric equality remains unresolved in ${field}: ${issue.message}`,
      false,
      "error"
    ));
  }
  return { findings, repairCount, value: repaired };
}

function reviewAndRepairArithmetic(slide: LessonPlanSlide) {
  const findings: SlideValidationFinding[] = [];
  let repairCount = 0;
  const repair = (value: string | undefined, field: string) => {
    const result = repairArithmeticField(value, field);
    findings.push(...result.findings);
    repairCount += result.repairCount;
    return result.value;
  };
  const content = slide.studentContent;
  content.answer = repair(content.answer, "answer");
  content.hint = repair(content.hint, "hint");
  content.keyIdea = repair(content.keyIdea, "key idea");
  content.explanation = repair(content.explanation, "explanation");
  content.bullets = content.bullets?.map((item, index) => repair(item, `bullet ${index + 1}`) ?? item);
  content.examples = content.examples?.map((item, index) => repair(item, `example ${index + 1}`) ?? item);
  content.steps = content.steps?.map((item, index) => repair(item, `step ${index + 1}`) ?? item);
  if (slide.assessment) {
    slide.assessment.explanation = repair(slide.assessment.explanation, "answer explanation") ?? "";
  }
  return { findings, repairCount };
}

function assessmentFindings(slide: LessonPlanSlide) {
  const assessment = slide.assessment;
  if (!assessment) return [];
  const findings: SlideValidationFinding[] = [];
  const correct = clean(assessment.correctAnswer).toLowerCase();
  const commonWrong = clean(assessment.commonWrongAnswer).toLowerCase();
  if (!correct) {
    findings.push(finding("missing_answer_key", "The assessment has no verified correct answer.", false, "error"));
  }
  if (correct && commonWrong && correct === commonWrong) {
    findings.push(finding("semantic_value_mismatch", "The correct answer duplicates the recorded common wrong answer.", false, "error"));
  }
  if (correct && assessment.options?.length && !assessment.options.some((option) => clean(option).toLowerCase() === correct)) {
    findings.push(finding("semantic_value_mismatch", "The multiple-choice correct answer is not one of the displayed options.", false, "error"));
  }
  return findings;
}

function finding(
  code: SlideValidationFinding["code"],
  message: string,
  repaired: boolean,
  severity: SlideValidationFinding["severity"],
  automaticCorrection?: string
): SlideValidationFinding {
  return { automaticCorrection, code, message, repaired, severity };
}

export function runSemanticAccuracyGate({
  conceptGraph,
  slides,
  subject,
  subjectKey,
  topic
}: {
  conceptGraph?: ConceptGraphSource;
  slides: LessonPlanSlide[];
  subject: string;
  subjectKey: SubjectKey;
  topic: string;
}): SemanticAccuracyResult {
  const context = `${subjectKey} ${subject} ${topic}`;
  const referenceTokens = tokens(`${context} ${graphText(conceptGraph)}`);
  const findingsBySlide = new Map<string, SlideValidationFinding[]>();
  let repairedMismatches = 0;
  let traceableSlides = 0;
  let alignedSlides = 0;

  const repairedSlides = slides.map((sourceSlide) => {
    const slide = structuredClone(sourceSlide);
    const findings: SlideValidationFinding[] = assessmentFindings(slide);
    let aligned = true;

    // Questions may intentionally contain a false equality. Asserted content
    // is recomputed, repaired, and checked again before the quality decision.
    const arithmeticReview = reviewAndRepairArithmetic(slide);
    findings.push(...arithmeticReview.findings);
    repairedMismatches += arithmeticReview.repairCount;

    for (const rule of domainRules) {
      if (contextSupportsRule(context, rule)) continue;

      if (textUsesRule(visibleText(slide), rule)) {
        aligned = false;
        findings.push(finding(
          "unsupported_claim",
          `Review suggested: the learner-facing content includes a ${rule.name} cluster that may be broader than the selected topic.`,
          false,
          "warning"
        ));
      }

      if (slide.visuals.some((visual) => visualUsesRule(visual, rule))) {
        slide.visuals = [neutralVisual(slide, conceptGraph, topic)];
        repairedMismatches += 1;
        findings.push(finding(
          "visual_content_mismatch",
          `A ${rule.name} visual did not match the selected subject and topic.`,
          true,
          "error",
          "Replaced it with a visual derived from the active lesson concept model."
        ));
      }
    }

    const traceable = isTraceable(slide, referenceTokens);
    if (traceable) {
      traceableSlides += 1;
    } else if (!["lesson_cover", "learning_objectives", "next_steps"].includes(slide.slideType)) {
      findings.push(finding(
        "unsupported_claim",
        "This slide could not be traced to the selected topic or the lesson concept model.",
        false,
        "warning"
      ));
    }

    if (aligned) alignedSlides += 1;
    findingsBySlide.set(slide.id, findings);
    return slide;
  });

  const unresolvedErrors = [...findingsBySlide.values()].flat().filter(
    (item) => item.severity === "error" && !item.repaired
  ).length;
  const denominator = Math.max(1, repairedSlides.length);
  return {
    findingsBySlide,
    slides: repairedSlides,
    summary: {
      inspectedSlides: repairedSlides.length,
      repairedMismatches,
      subjectAlignmentPercent: Math.round((alignedSlides / denominator) * 100),
      traceabilityPercent: Math.round((traceableSlides / denominator) * 100),
      unresolvedErrors
    }
  };
}

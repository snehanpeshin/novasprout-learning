import {
  canonicalizeMathExpression,
  findPrintedProductionInstructions,
  normalConfidenceInterval,
  oneSampleZScore,
  standardError,
  validateEquationSpec,
  validateIntervalStatement,
  validateProcedureChoice,
  type EquationSpec
} from "./mathValidation.ts";

export const lessonEngineVersion = "2.1" as const;

export type AudienceMode = "student" | "teacher";
export type LessonDepth = "quick" | "standard" | "deep";
export type VisualEmphasis = "balanced" | "high" | "maximum";
export type PracticeIntensity = "light" | "standard" | "intensive";
export type QualitySeverity = "error" | "warning" | "info";

export type NormalizedLessonRequest = {
  audienceMode: AudienceMode;
  depth: LessonDepth;
  durationMinutes: number;
  grade: string;
  language: string;
  outputType: string;
  practiceIntensity: PracticeIntensity;
  subject: string;
  topic: string;
  visualEmphasis: VisualEmphasis;
};

export type ConceptNode = {
  definition: string;
  id: string;
  label: string;
};

export type ConceptRelationship = {
  explanation: string;
  from: string;
  relationship: string;
  to: string;
};

export type StructuredFormula = {
  assumptions?: string[];
  exactResult?: number;
  expression: string;
  interpretation?: string;
  meaning: string;
  roundedResult?: number;
  units?: string;
  variables?: Array<{ definition: string; symbol: string; units?: string; value?: number }>;
};

export type ConceptGraph = {
  assessmentTargets: string[];
  formulas: StructuredFormula[];
  misconceptions: Array<{ correction: string; statement: string }>;
  nodes: ConceptNode[];
  notationDefinitions?: Array<{ definition: string; latex: string; symbol: string }>;
  prerequisites?: string[];
  relationships: ConceptRelationship[];
};

export type SemanticVisualSpec = {
  expectedInsight: string;
  labels: string[];
  learnerQuestion?: string;
  mathematicalRelationship: string;
  quantitiesEncoded: string[];
  visualType: string;
};

export type PracticeInteractionSpec = {
  answer: string;
  commonWrongAnswer: string;
  conceptualHint: string;
  diagnosis: string;
  expectedSolutionPath: string[];
  followUpProblem: string;
  prerequisiteSkill: string;
  proceduralHint: string;
  question: string;
  targetedFeedback: string;
};

export type StructuredSlideSpec = {
  answerVisibility: "hidden" | "review" | "teacher";
  equations: EquationSpec[];
  interactionType: "none" | "progressive-hints" | "retrieval" | "worked-example";
  learnerFacingContent: string[];
  pedagogicalRole: string;
  slideId: string;
  sourceOrDerivation: string;
  title: string;
  validationRequirements: string[];
  visualIntent?: SemanticVisualSpec;
};

export type StructuredLessonSpec = {
  assumedPrerequisites: string[];
  learnerLevel: string;
  learningObjectives: string[];
  lessonArc: string[];
  misconceptions: Array<{ correction: string; statement: string }>;
  notationDefinitions: Array<{ definition: string; latex: string; symbol: string }>;
  slides: StructuredSlideSpec[];
  subject: string;
  topic: string;
};

export type QualityFinding = {
  code: string;
  explanation: string;
  repair?: string;
  severity: QualitySeverity;
  slideId?: string;
};

type EngineVisual = {
  accessibilityLabel?: string;
  expectedInsight?: string;
  equation?: string;
  id?: string;
  labels?: string[];
  learnerQuestion?: string;
  mathematicalRelationship?: string;
  points?: Array<{ x: number; y: number; z?: number }>;
  quantitiesEncoded?: string[];
  steps?: string[];
  title?: string;
  type?: string;
};

type EngineSlide = {
  estimatedMinutes?: number;
  id?: string;
  layoutType?: string;
  math?: StructuredFormula[];
  purpose?: string;
  speakerNotes?: string;
  studentContent?: {
    answer?: string;
    bullets?: string[];
    examples?: string[];
    explanation?: string;
    hint?: string;
    keyIdea?: string;
    question?: string;
    steps?: string[];
  };
  title?: string;
  type?: string;
  visuals?: EngineVisual[];
};

const genericVisualLabels = new Set([
  "check",
  "example",
  "explain",
  "idea",
  "learn",
  "model",
  "notice",
  "practice",
  "review",
  "topic"
]);

export function normalizeLessonRequest(input: Partial<NormalizedLessonRequest> & { duration?: string }): NormalizedLessonRequest {
  const durationNumber = Number(String(input.durationMinutes ?? input.duration ?? "45").match(/\d+/)?.[0] ?? 45);
  return {
    audienceMode: input.audienceMode === "teacher" ? "teacher" : "student",
    depth: input.depth === "quick" || input.depth === "deep" ? input.depth : "standard",
    durationMinutes: Math.max(10, Math.min(120, Number.isFinite(durationNumber) ? durationNumber : 45)),
    grade: clean(input.grade, 50) || "Student",
    language: clean(input.language, 40) || "English",
    outputType: clean(input.outputType, 60) || "Comprehensive lesson",
    practiceIntensity: input.practiceIntensity === "light" || input.practiceIntensity === "intensive" ? input.practiceIntensity : "standard",
    subject: clean(input.subject, 60) || "General",
    topic: clean(input.topic, 120) || "Lesson topic",
    visualEmphasis: input.visualEmphasis === "high" || input.visualEmphasis === "maximum" ? input.visualEmphasis : "balanced"
  };
}

function clean(value: unknown, maxLength = 500) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function slug(value: string) {
  return clean(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "concept";
}

function sentenceList(value: string) {
  return clean(value, 6000).split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean);
}

function unique<T>(items: T[]) {
  return items.filter((item, index) => items.indexOf(item) === index);
}

export function extractConceptGraph({
  conceptModel,
  lessonText,
  subject,
  topic
}: {
  conceptModel?: Partial<ConceptGraph>;
  lessonText: string;
  subject: string;
  topic: string;
}): ConceptGraph {
  const suppliedNodes = (conceptModel?.nodes ?? [])
    .map((node) => ({ definition: clean(node.definition, 300), id: slug(node.id || node.label), label: clean(node.label, 80) }))
    .filter((node) => node.label && node.definition);
  const suppliedRelationships = (conceptModel?.relationships ?? [])
    .map((edge) => ({
      explanation: clean(edge.explanation, 320),
      from: slug(edge.from),
      relationship: clean(edge.relationship, 80),
      to: slug(edge.to)
    }))
    .filter((edge) => edge.from && edge.to && edge.relationship);
  const suppliedFormulas = (conceptModel?.formulas ?? []).map((formula) => ({
    assumptions: formula.assumptions?.map((item) => clean(item, 180)).filter(Boolean),
    exactResult: formula.exactResult,
    expression: canonicalizeMathExpression(clean(formula.expression, 220)),
    interpretation: clean(formula.interpretation, 280) || undefined,
    meaning: clean(formula.meaning, 280),
    roundedResult: formula.roundedResult,
    units: clean(formula.units, 80) || undefined,
    variables: formula.variables
  })).filter((formula) => formula.expression && formula.meaning && validateStructuredFormula(formula).valid);

  const lower = `${subject} ${topic} ${lessonText}`.toLowerCase();
  const topicNodes = inferTopicNodes(lower, topic);
  const nodes = suppliedNodes.length >= 3 ? suppliedNodes : topicNodes;
  const relationships = suppliedRelationships.length >= 2 ? suppliedRelationships : inferRelationships(lower, nodes);
  const formulas = suppliedFormulas.length ? suppliedFormulas : inferFormulas(lower);
  const misconceptions = (conceptModel?.misconceptions ?? [])
    .map((item) => ({ correction: clean(item.correction, 280), statement: clean(item.statement, 220) }))
    .filter((item) => item.statement && item.correction);

  return {
    assessmentTargets: unique((conceptModel?.assessmentTargets ?? []).map((item) => clean(item, 220)).filter(Boolean)).slice(0, 6),
    formulas,
    misconceptions,
    nodes,
    notationDefinitions: conceptModel?.notationDefinitions,
    prerequisites: conceptModel?.prerequisites,
    relationships
  };
}

function inferTopicNodes(lower: string, topic: string): ConceptNode[] {
  if (isSamplingStatistics(lower)) {
    return [
      { id: "population", label: "Population", definition: "The full group or process whose parameter is being studied." },
      { id: "sample", label: "Random sample", definition: "A subset selected by a random mechanism from the population." },
      { id: "sample-mean", label: "Sample mean", definition: "The statistic \\bar{x}, computed from one sample." },
      { id: "sampling-distribution", label: "Sampling distribution", definition: "The distribution of a statistic across all possible repeated samples of a fixed size." },
      { id: "standard-error", label: "Standard error", definition: "The standard deviation of a sampling distribution." },
      { id: "z-score", label: "z-score", definition: "The signed distance between a sample statistic and its null mean, measured in standard errors." },
      { id: "confidence-interval", label: "Confidence interval", definition: "An estimate plus and minus a critical value times its standard error." }
    ];
  }
  if (/third law|absolute zero|thermodynamic/.test(lower)) {
    return [
      { id: "absolute-zero", label: "Absolute zero", definition: "The limiting temperature 0 K, approached but not reached by a finite cooling process." },
      { id: "entropy", label: "Entropy", definition: "A measure related to the number of microscopic arrangements available to a system." },
      { id: "perfect-crystal", label: "Perfect crystal", definition: "An ideal crystal with one unique ground-state arrangement." },
      { id: "heat-capacity", label: "Heat capacity", definition: "The energy required for a small temperature change; it falls toward zero at very low temperature." },
      { id: "residual-entropy", label: "Residual entropy", definition: "Nonzero entropy remaining when more than one ground-state arrangement is available." }
    ];
  }
  const words = unique((topic.match(/[A-Za-z][A-Za-z-]{2,}/g) ?? []).map((word) => word.toLowerCase())).slice(0, 4);
  return (words.length ? words : ["system", "process", "evidence"]).map((word) => ({
    definition: `${word.replace(/\b\w/g, (letter) => letter.toUpperCase())} is a central idea used to explain ${topic}.`,
    id: slug(word),
    label: word.replace(/\b\w/g, (letter) => letter.toUpperCase())
  }));
}

function inferRelationships(lower: string, nodes: ConceptNode[]): ConceptRelationship[] {
  if (isSamplingStatistics(lower)) {
    return [
      { from: "population", to: "sample", relationship: "generates", explanation: "Repeated random samples come from the same population but contain different observations." },
      { from: "sample", to: "sample-mean", relationship: "produces", explanation: "Each random sample produces one value of \\bar{x}." },
      { from: "sample-mean", to: "sampling-distribution", relationship: "accumulates into", explanation: "Many values of \\bar{x} form the sampling distribution of the mean." },
      { from: "sample-size", to: "standard-error", relationship: "reduces by a square-root rule", explanation: "For fixed \\sigma, standard error is \\sigma/\\sqrt{n}; quadrupling n halves the width." },
      { from: "standard-error", to: "z-score", relationship: "sets the distance unit", explanation: "A z-score divides a signed difference by one standard error." },
      { from: "standard-error", to: "confidence-interval", relationship: "sets the margin scale", explanation: "The confidence-interval margin is a critical value times the standard error." }
    ];
  }
  if (/third law|absolute zero|thermodynamic/.test(lower)) {
    return [
      { from: "temperature", to: "entropy", relationship: "limits", explanation: "For a perfect crystal, entropy approaches zero as temperature approaches 0 K." },
      { from: "microstates", to: "entropy", relationship: "determines", explanation: "Fewer accessible microstates mean lower entropy." },
      { from: "temperature", to: "heat-capacity", relationship: "controls", explanation: "At low temperature, lattice heat capacity decreases approximately as the cube of temperature." },
      { from: "disorder", to: "residual-entropy", relationship: "can produce", explanation: "Ground-state degeneracy or frozen disorder can leave residual entropy." }
    ];
  }
  return nodes.slice(0, -1).map((node, index) => ({
    explanation: `${node.label} helps explain ${nodes[index + 1].label}.`,
    from: node.id,
    relationship: "connects to",
    to: nodes[index + 1].id
  }));
}

function inferFormulas(lower: string): StructuredFormula[] {
  if (isSamplingStatistics(lower)) {
    const exampleInterval = normalConfidenceInterval({
      populationStandardDeviation: 10,
      sampleMean: 82,
      sampleSize: 25
    });
    return [
      {
        assumptions: ["Independent random sample", "Population standard deviation is known"],
        expression: "\\operatorname{SE}(\\bar{x})=\\frac{\\sigma}{\\sqrt{n}}",
        interpretation: "The standard error is the typical sample-to-sample distance of \\bar{x} from \\mu.",
        meaning: "Standard error of the sample mean when population standard deviation is known.",
        units: "Same units as the measured variable",
        variables: [
          { definition: "sample mean", symbol: "\\bar{x}" },
          { definition: "population standard deviation", symbol: "\\sigma" },
          { definition: "sample size", symbol: "n" }
        ]
      },
      {
        assumptions: ["Population standard deviation is known"],
        exactResult: oneSampleZScore(82, 78, 10, 25),
        expression: "z=\\frac{\\bar{x}-\\mu}{\\sigma/\\sqrt{n}}",
        interpretation: "z is a signed distance measured in standard errors, not a probability.",
        meaning: "One-sample z statistic for a sample mean.",
        variables: [
          { definition: "sample mean", symbol: "\\bar{x}" },
          { definition: "population mean under the model", symbol: "\\mu" },
          { definition: "population standard deviation", symbol: "\\sigma" },
          { definition: "sample size", symbol: "n" }
        ]
      },
      {
        assumptions: ["Population standard deviation is unknown"],
        expression: "\\widehat{\\operatorname{SE}}(\\bar{x})=\\frac{s}{\\sqrt{n}}",
        interpretation: "When \\sigma is unknown, estimate standard error with s and normally use a t distribution with n-1 degrees of freedom.",
        meaning: "Estimated standard error of the sample mean.",
        variables: [
          { definition: "sample mean", symbol: "\\bar{x}" },
          { definition: "sample standard deviation", symbol: "s" },
          { definition: "sample size", symbol: "n" }
        ]
      },
      {
        assumptions: ["Population standard deviation is known", "95% normal critical value is 1.96"],
        exactResult: exampleInterval.margin,
        expression: "\\bar{x}\\pm1.96\\frac{\\sigma}{\\sqrt{n}}",
        interpretation: "For \\bar{x}=82, \\sigma=10, and n=25, the interval is (78.08,85.92); 78 is slightly outside.",
        meaning: "A 95% confidence interval for a mean with known population standard deviation.",
        units: "Same units as the measured variable",
        variables: [
          { definition: "sample mean", symbol: "\\bar{x}", value: 82 },
          { definition: "population standard deviation", symbol: "\\sigma", value: 10 },
          { definition: "sample size", symbol: "n", value: 25 }
        ]
      }
    ];
  }
  if (/third law|absolute zero|thermodynamic/.test(lower)) {
    return [
      { expression: "S(T) \\to 0 \\text{ as } T \\to 0\\,\\mathrm{K}", meaning: "The entropy of a perfect crystal approaches zero at absolute zero.", units: "S: J mol^-1 K^-1; T: K" },
      { expression: "C_V \\propto T^3", meaning: "At sufficiently low temperature, the lattice heat capacity of a crystal decreases approximately with the cube of temperature.", units: "C_V: J mol^-1 K^-1" },
      { expression: "S(T)-S(0)=\\int_0^T \\frac{C_V}{T'}\\,dT'", meaning: "Entropy change is found by integrating reversible heat capacity divided by temperature.", units: "J mol^-1 K^-1" },
      { expression: "S=k_B\\ln \\Omega", meaning: "Entropy increases with the number of accessible microscopic arrangements.", units: "k_B: J K^-1" }
    ];
  }
  return [];
}

function isSamplingStatistics(value: string) {
  return /\b(sampling distribution|standard error|z-score|z score|confidence interval|sample mean|central limit|statistic|probability)\b/i.test(value);
}

export function validateStructuredFormula(formula: StructuredFormula) {
  const expression = canonicalizeMathExpression(clean(formula.expression, 240));
  const forbidden = /\\(?:input|include|write|read|openout|openin|usepackage|documentclass|begin|end)\b/i;
  let depth = 0;
  for (const character of expression) {
    if (character === "{") depth += 1;
    if (character === "}") depth -= 1;
    if (depth < 0) return { error: "Formula has an unmatched closing brace.", valid: false };
  }
  if (!expression) return { error: "Formula is empty.", valid: false };
  if (forbidden.test(expression)) return { error: "Formula contains a forbidden LaTeX command.", valid: false };
  if (depth !== 0) return { error: "Formula has unmatched braces.", valid: false };
  if (formula.variables?.length) {
    const validation = validateEquationSpec({
      assumptions: formula.assumptions ?? [],
      canonicalLatex: expression,
      exactResult: formula.exactResult,
      interpretation: formula.interpretation || formula.meaning,
      roundedResult: formula.roundedResult,
      semanticExpression: formula.meaning,
      units: formula.units,
      variables: formula.variables
    });
    const error = validation.findings.find((finding) => finding.severity === "error");
    if (error) return { error: error.message, valid: false };
  }
  return { valid: true };
}

export function contentBudget(layoutType: string, hasVisual: boolean) {
  if (layoutType === "full-visual") return { maxBullets: 2, maxCharacters: 260 };
  if (layoutType === "equation-focus") return { maxBullets: 3, maxCharacters: 380 };
  if (hasVisual) return { maxBullets: 4, maxCharacters: 360 };
  return { maxBullets: 5, maxCharacters: 560 };
}

export function fitTextAtSentenceBoundary(value: string, maxCharacters: number) {
  const text = clean(value, 5000);
  if (text.length <= maxCharacters) return text;
  const sentences = sentenceList(text);
  let result = "";
  for (const sentence of sentences) {
    const candidate = result ? `${result} ${sentence}` : sentence;
    if (candidate.length > maxCharacters) break;
    result = candidate;
  }
  return result || `${text.slice(0, Math.max(0, maxCharacters - 1)).replace(/\s+\S*$/, "").trim()}.`;
}

function slideText(slide: EngineSlide) {
  const content = slide.studentContent ?? {};
  return [slide.title, content.keyIdea, content.explanation, content.question, ...(content.bullets ?? []), ...(content.steps ?? [])]
    .filter(Boolean).join(" ");
}

function semanticTokens(value: string) {
  const stop = new Set(["about", "after", "again", "also", "and", "are", "for", "from", "into", "that", "the", "this", "with"]);
  return new Set((clean(value, 3000).toLowerCase().match(/[a-z][a-z-]{2,}/g) ?? []).filter((word) => !stop.has(word)));
}

function similarity(left: string, right: string) {
  const a = semanticTokens(left);
  const b = semanticTokens(right);
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

export function isGenericConceptMap(visual: EngineVisual, topic: string) {
  if (visual.type !== "concept_map") return false;
  const labels = (visual.labels ?? []).map((label) => clean(label, 40).toLowerCase());
  const topicTokens = semanticTokens(topic);
  const meaningful = labels.filter((label) => !genericVisualLabels.has(label) && [...semanticTokens(label)].some((token) => topicTokens.has(token)));
  return labels.length < 2 || meaningful.length === 0;
}

export function recommendTopicVisual({ index, slide, subject, topic }: { index: number; slide: EngineSlide; subject: string; topic: string }): EngineVisual | null {
  const text = `${topic} ${slideText(slide)}`.toLowerCase();
  const id = `${slug(slide.id || slide.title || "slide")}-semantic-visual`;
  if (isSamplingStatistics(text)) {
    const title = clean(slide.title, 90).toLowerCase();
    const role = `${slide.type ?? ""} ${title}`;
    const statsSequence: EngineVisual[] = [
      {
        accessibilityLabel: "A population distribution labeled with population mean mu and population standard deviation sigma.",
        expectedInsight: "A population has fixed parameters; a random sample supplies statistics.",
        id,
        labels: ["Population", "\\mu", "\\sigma", "Random observation"],
        learnerQuestion: "Which labels describe the population rather than one sample?",
        mathematicalRelationship: "Population center and spread are parameters.",
        quantitiesEncoded: ["population mean", "population standard deviation"],
        title: "Population and parameters",
        type: "population_distribution"
      },
      {
        accessibilityLabel: "Three visibly different random samples drawn from one population, each with its own sample mean.",
        expectedInsight: "Random samples differ, so their sample means differ.",
        id,
        labels: ["Sample 1", "Sample 2", "Sample 3", "\\bar{x}_1", "\\bar{x}_2", "\\bar{x}_3"],
        learnerQuestion: "Why are the three sample means not identical?",
        mathematicalRelationship: "One population generates many possible samples and statistics.",
        quantitiesEncoded: ["sample observations", "sample means"],
        title: "Repeated random samples",
        type: "repeated_samples"
      },
      {
        accessibilityLabel: "A dot plot of many simulated sample means centered near the population mean.",
        expectedInsight: "The distribution of repeated sample means is a sampling distribution.",
        id,
        labels: ["Repeated \\bar{x}", "Center near \\mu", "Sampling variability"],
        learnerQuestion: "What is one dot in this distribution?",
        mathematicalRelationship: "Each dot is a statistic from one repeated sample.",
        quantitiesEncoded: ["sample means", "population mean"],
        title: "Sampling distribution of the mean",
        type: "sampling_distribution"
      },
      {
        accessibilityLabel: "Three sampling distributions for sample sizes 5, 30, and 100 on the same horizontal scale.",
        expectedInsight: "Larger samples create narrower sampling distributions according to the square-root rule.",
        id,
        labels: ["n=5", "n=30", "n=100", "\\sigma/\\sqrt{5}", "\\sigma/\\sqrt{30}", "\\sigma/\\sqrt{100}"],
        learnerQuestion: "What happens to width when sample size increases?",
        mathematicalRelationship: "\\operatorname{SE}(\\bar{x})=\\sigma/\\sqrt{n}",
        quantitiesEncoded: ["sample size", "standard error"],
        title: "Sample size changes precision",
        type: "standard_error_comparison"
      },
      {
        accessibilityLabel: "A normal curve centered at zero with z equals 2 marked and the upper tail shaded.",
        expectedInsight: "z=2 means two standard errors above the model mean; the tail area is a separate probability.",
        id,
        labels: ["z=0", "z=2", "Upper tail", "Two standard errors"],
        learnerQuestion: "Is z itself a probability?",
        mathematicalRelationship: "z=(\\bar{x}-\\mu)/(\\sigma/\\sqrt{n})",
        quantitiesEncoded: ["z location", "tail probability"],
        title: "Distance and tail area",
        type: "normal_tail"
      },
      {
        accessibilityLabel: "A confidence interval number line from 78.08 to 85.92 centered at 82, with 78 marked just outside.",
        expectedInsight: "Numerical inclusion must be checked against the endpoints; 78 is outside this interval.",
        id,
        labels: ["78", "78.08", "82", "85.92", "outside", "inside interval"],
        learnerQuestion: "Does 78 lie between the two endpoints?",
        mathematicalRelationship: "82\\pm1.96(2)=(78.08,85.92)",
        quantitiesEncoded: ["lower endpoint", "sample mean", "upper endpoint", "comparison value"],
        title: "Check interval membership",
        type: "confidence_interval"
      }
    ];
    if (/confidence|interval/.test(role)) return statsSequence[5];
    if (/\bz\b|tail|probability/.test(role)) return statsSequence[4];
    if (/standard error|sample size|width|square root/.test(role)) return statsSequence[3];
    if (/sampling distribution|repeated mean|dot plot|histogram/.test(role)) return statsSequence[2];
    if (/sample|statistic/.test(role) && !/population versus sample|population vs sample/.test(role)) return statsSequence[1];
    if (/population|parameter/.test(role)) return statsSequence[0];
    if (slide.type === "worked_example") return statsSequence[5];
    return statsSequence[index % statsSequence.length];
  }
  if (/third law|absolute zero|thermodynamic|entropy/.test(text)) {
    const sequence = [
      { type: "scientific_graph", title: "Entropy approaches its low-temperature limit", labels: ["Temperature T (K)", "Entropy S", "Perfect crystal", "S approaches 0"], points: [{ x: 0, y: 0 }, { x: 1, y: 0.25 }, { x: 2, y: 0.7 }, { x: 3, y: 1.35 }, { x: 4, y: 2.2 }] },
      { type: "microstate_model", title: "One ground state versus many", labels: ["Perfect crystal", "One arrangement", "Disordered solid", "Several arrangements"] },
      { type: "scientific_graph", title: "Low-temperature heat capacity", labels: ["Temperature T (K)", "Heat capacity C_V", "C_V proportional to T^3"], points: [{ x: 0, y: 0 }, { x: 1, y: 0.08 }, { x: 2, y: 0.45 }, { x: 3, y: 1.35 }, { x: 4, y: 3.2 }] },
      { type: "cooling_sequence", title: "Cooling toward absolute zero", labels: ["Remove energy", "Fewer excitations", "Fewer accessible states", "Approach 0 K"] },
      { type: "equation_steps", title: "Connect heat capacity and entropy", steps: ["C_V proportional to T^3", "C_V/T proportional to T^2", "Integrate from 0 to T", "Entropy change approaches 0"] }
    ];
    const chosen = sequence[index % sequence.length];
    return { accessibilityLabel: `${chosen.title}, a topic-specific model for ${topic}.`, id, ...chosen };
  }
  if (/\b(graph|rate|change|temperature|motion|population|function)\b/.test(text)) {
    return {
      accessibilityLabel: `A labeled graph showing the relationship described on ${slide.title || "this slide"}.`,
      id,
      labels: ["Independent variable", "Dependent variable", "Observed relationship"],
      points: [{ x: 0, y: 0 }, { x: 1, y: 0.7 }, { x: 2, y: 1.5 }, { x: 3, y: 2.6 }, { x: 4, y: 4 }],
      title: clean(slide.title, 80),
      type: "scientific_graph"
    };
  }
  if (/\b(sequence|cycle|process|pathway|stages|steps)\b/.test(text)) {
    const suppliedSteps = slide.studentContent?.steps ?? slide.studentContent?.bullets ?? [];
    const inferredSteps = /\b(input|decision|loop|output|algorithm)\b/.test(text)
      ? ["Input", "Decision", "Loop", "Output"]
      : /\b(claim|evidence|reasoning)\b/.test(text)
        ? ["Claim", "Evidence", "Reasoning", "Revision"]
        : /\b(cause|event|consequence|effect)\b/.test(text)
          ? ["Cause", "Event", "Consequence", "Long-term effect"]
          : [];
    const labels = unique((suppliedSteps.length ? suppliedSteps : inferredSteps).map((item) => fitTextAtSentenceBoundary(item, 55))).slice(0, 5);
    if (labels.length >= 3) return { accessibilityLabel: `A process model for ${topic}.`, id, labels, steps: labels, title: clean(slide.title, 80), type: "process_sequence" };
  }
  if (/\b(equation|formula|calculate|solve|derive|proportion)\b/.test(text) && slide.math?.length) {
    return { accessibilityLabel: `Structured equation steps for ${topic}.`, id, steps: slide.math.map((formula) => formula.expression).slice(0, 4), title: "Equation reasoning", type: "equation_steps" };
  }
  return null;
}

const visualCompatibility: Record<string, Set<string>> = {
  algebra: new Set(["coordinate_graph", "equation_steps", "comparison_table", "tape_diagram"]),
  geometry: new Set(["coordinate_space_3d", "shape_classification", "solid_geometry", "solid_net", "tape_diagram"]),
  sampling_statistics: new Set([
    "population_distribution",
    "repeated_samples",
    "sampling_distribution",
    "standard_error_comparison",
    "normal_tail",
    "confidence_interval",
    "equation_steps",
    "data_table"
  ])
};

function mathTopicFamily(topic: string) {
  if (isSamplingStatistics(topic)) return "sampling_statistics";
  if (/\b(geometry|shape|solid|prism|pyramid|circle|triangle|angle|volume|area)\b/i.test(topic)) return "geometry";
  if (/\b(algebra|equation|linear|quadratic|function|variable)\b/i.test(topic)) return "algebra";
  return "";
}

export function isVisualCompatibleWithTopic(visual: EngineVisual, topic: string) {
  const family = mathTopicFamily(topic);
  if (!family) return true;
  const allowed = visualCompatibility[family];
  return !visual.type || allowed.has(visual.type);
}

function stripIncompatibleContent(value: string, topic: string) {
  const sentences = sentenceList(value);
  if (mathTopicFamily(topic) !== "sampling_statistics") return value;
  const incompatible = /\b(ecosystem|habitat|community|producer|consumer|food chain|rectangular prism|face|edge|vertex)\b/i;
  return sentences.filter((sentence) => !incompatible.test(sentence)).join(" ");
}

export function evaluateLessonSlides(slides: EngineSlide[], topic: string, audienceMode: AudienceMode = "student") {
  const findings: QualityFinding[] = [];
  slides.forEach((slide, index) => {
    const id = clean(slide.id, 80) || `slide-${index + 1}`;
    const text = slideText(slide);
    const budget = contentBudget(slide.layoutType || "text-visual", Boolean(slide.visuals?.length));
    if (text.length > budget.maxCharacters) {
      findings.push({ code: "content_overflow_risk", explanation: `Slide has ${text.length} characters for a ${budget.maxCharacters}-character layout budget.`, repair: "Split the idea or shorten it at sentence boundaries.", severity: "warning", slideId: id });
    }
    if (text && /(?:\.{3}|[,;:]|\b(?:and|or|because|which|that))\s*$/.test(text)) {
      findings.push({ code: "incomplete_sentence", explanation: "Slide content appears to end mid-thought.", repair: "Restore the complete sentence from source content.", severity: "error", slideId: id });
    }
    if (slide.visuals?.some((visual) => isGenericConceptMap(visual, topic))) {
      findings.push({ code: "generic_visual", explanation: "Concept map labels do not encode a topic relationship.", repair: "Replace with a graph, process, comparison, equation, or labeled system tied to the slide purpose.", severity: "warning", slideId: id });
    }
    if (slide.visuals?.some((visual) => !isVisualCompatibleWithTopic(visual, topic))) {
      findings.push({ code: "incompatible_visual", explanation: "The visual type does not match the mathematical topic.", repair: "Replace it with a topic-compatible mathematical model.", severity: "error", slideId: id });
    }
    if (findPrintedProductionInstructions(text).length) {
      findings.push({ code: "printed_production_instruction", explanation: "A production instruction appears in learner-facing content.", repair: "Execute the instruction as a visual and remove it from visible text.", severity: "error", slideId: id });
    }
    if (isSamplingStatistics(topic) && /\b(ecosystem|habitat|community|producer|consumer|food chain|rectangular prism|face|edge|vertex)\b/i.test(text)) {
      findings.push({ code: "topic_contamination", explanation: "The statistics lesson contains unrelated biology or geometry vocabulary.", repair: "Regenerate the affected content from the active objective.", severity: "error", slideId: id });
    }
    if (/\bmicro\b/i.test(text) && isSamplingStatistics(topic)) {
      findings.push({ code: "corrupted_notation", explanation: "The symbol mu was converted to the word micro.", repair: "Preserve mu structurally as \\mu.", severity: "error", slideId: id });
    }
    if (audienceMode === "student" && slide.studentContent?.answer && text.includes(slide.studentContent.answer)) {
      findings.push({ code: "answer_leakage", explanation: "A student-facing slide contains its answer in visible content.", repair: "Keep the answer in hidden interaction metadata or the teacher export.", severity: "error", slideId: id });
    }
    for (const formula of slide.math ?? []) {
      const validation = validateStructuredFormula(formula);
      if (!validation.valid) findings.push({ code: "invalid_formula", explanation: validation.error || "Formula is invalid.", repair: "Regenerate only the formula block.", severity: "error", slideId: id });
    }
    if (/\b(?:learn|understand|review) (?:the )?(?:topic|concept|idea)\b/i.test(text) && text.length < 180) {
      findings.push({ code: "generic_filler", explanation: "Slide states a learning action without teaching substantive content.", repair: "Replace it with a definition, relationship, example, or misconception.", severity: "warning", slideId: id });
    }
    const previous = slides[index - 1];
    if (previous && similarity(text, slideText(previous)) > 0.72) {
      findings.push({ code: "near_duplicate", explanation: "This slide substantially repeats the previous slide.", repair: "Merge the slides or give this slide a distinct pedagogical purpose.", severity: "warning", slideId: id });
    }
  });
  return findings;
}

type EnginePlan = {
  conceptGraph?: Partial<ConceptGraph>;
  context: { subject: string; topic: string; [key: string]: unknown };
  slides: EngineSlide[];
  validationWarnings: string[];
  [key: string]: unknown;
};

export type EnhancedEnginePlan = EnginePlan & {
  audienceMode: AudienceMode;
  conceptGraph: ConceptGraph;
  engineVersion: typeof lessonEngineVersion;
  qualityFindings: QualityFinding[];
};

export function enhanceLessonPlan(plan: EnginePlan, audienceMode: AudienceMode = "student"): EnhancedEnginePlan {
  const lessonText = plan.slides.map(slideText).join(" ");
  const conceptGraph = extractConceptGraph({ conceptModel: plan.conceptGraph, lessonText, subject: plan.context.subject, topic: plan.context.topic });
  const slides = plan.slides.map((slide, index) => {
    const existingVisuals = slide.visuals ?? [];
    const replacement = recommendTopicVisual({ index, slide, subject: plan.context.subject, topic: plan.context.topic });
    const shouldReplace = existingVisuals.length === 0 || existingVisuals.some(
      (visual) => isGenericConceptMap(visual, plan.context.topic) || !isVisualCompatibleWithTopic(visual, plan.context.topic)
    );
    const formulas = conceptGraph.formulas.filter((formula) => {
      const text = slideText(slide).toLowerCase();
      if (isSamplingStatistics(`${plan.context.topic} ${text}`)) {
        if (/confidence|interval/.test(text)) return /pm1\.96/.test(formula.expression);
        if (/\bz\b|z-score|z score/.test(text)) return /^z=/.test(formula.expression);
        if (/unknown|t-procedure|sample s/.test(text)) return /widehat/.test(formula.expression);
        if (/standard error|sample size|precision|sampling distribution/.test(text)) return /operatorname\{SE\}/.test(formula.expression);
        return slide.type === "worked_example";
      }
      return text.includes("entropy") || text.includes("heat capacity") || text.includes("absolute zero") || text.includes("equation");
    }).slice(0, slide.type === "worked_example" ? 2 : 1);
    const hasVisual = Boolean((shouldReplace && replacement) || existingVisuals.length);
    const layoutType = formulas.length ? "equation-focus" : hasVisual ? "text-visual" : "text-focus";
    const budget = contentBudget(layoutType, hasVisual);
    const content = slide.studentContent ?? {};
    const sanitize = (value?: string) => {
      if (!value) return undefined;
      const withoutInstructions = sentenceList(value)
        .filter((sentence) => !findPrintedProductionInstructions(sentence).length)
        .join(" ");
      return stripIncompatibleContent(withoutInstructions, plan.context.topic);
    };
    return {
      ...slide,
      layoutType,
      math: formulas,
      purpose: slidePurpose(slide.type),
      speakerNotes: audienceMode === "teacher" ? `Check understanding of ${clean(slide.title, 90)} before advancing.` : undefined,
      studentContent: {
        ...content,
        bullets: content.bullets?.map(sanitize).filter(Boolean).map((item) => fitTextAtSentenceBoundary(item!, 150)).slice(0, budget.maxBullets) as string[] | undefined,
        explanation: sanitize(content.explanation) ? fitTextAtSentenceBoundary(sanitize(content.explanation)!, Math.min(340, budget.maxCharacters)) : undefined,
        keyIdea: sanitize(content.keyIdea) ? fitTextAtSentenceBoundary(sanitize(content.keyIdea)!, 210) : undefined,
        question: sanitize(content.question),
        steps: content.steps?.map(sanitize).filter(Boolean) as string[] | undefined
      },
      visuals: shouldReplace && replacement ? [replacement] : existingVisuals
    };
  });
  const qualityFindings = evaluateLessonSlides(slides, plan.context.topic, audienceMode);
  return {
    ...plan,
    audienceMode,
    conceptGraph,
    engineVersion: lessonEngineVersion,
    qualityFindings,
    slides,
    validationWarnings: [...plan.validationWarnings, ...qualityFindings.filter((finding) => finding.severity !== "info").map((finding) => `${finding.code}: ${finding.explanation}`)]
  } as EnhancedEnginePlan;
}

export function buildStructuredLessonSpec(plan: EnhancedEnginePlan): StructuredLessonSpec {
  return {
    assumedPrerequisites: plan.conceptGraph.prerequisites ?? [],
    learnerLevel: clean(plan.context.grade, 60) || "Student",
    learningObjectives: plan.conceptGraph.assessmentTargets,
    lessonArc: plan.slides.map((slide) => clean(slide.purpose, 180)).filter(Boolean),
    misconceptions: plan.conceptGraph.misconceptions,
    notationDefinitions: plan.conceptGraph.notationDefinitions ?? [],
    slides: plan.slides.map((slide, index) => ({
      answerVisibility: plan.audienceMode === "teacher" ? "teacher" : slide.type === "answer_explanation" ? "review" : "hidden",
      equations: (slide.math ?? []).map((formula) => ({
        assumptions: formula.assumptions ?? [],
        canonicalLatex: canonicalizeMathExpression(formula.expression),
        exactResult: formula.exactResult,
        interpretation: formula.interpretation || formula.meaning,
        roundedResult: formula.roundedResult,
        semanticExpression: formula.meaning,
        units: formula.units,
        variables: formula.variables ?? []
      })),
      interactionType: slide.type === "worked_example"
        ? "worked-example"
        : /practice/.test(slide.type ?? "")
          ? "progressive-hints"
          : slide.type === "summary"
            ? "retrieval"
            : "none",
      learnerFacingContent: [
        slide.studentContent?.keyIdea,
        slide.studentContent?.explanation,
        slide.studentContent?.question,
        ...(slide.studentContent?.bullets ?? []),
        ...(slide.studentContent?.steps ?? [])
      ].filter(Boolean) as string[],
      pedagogicalRole: clean(slide.purpose, 180),
      slideId: clean(slide.id, 80) || `slide-${index + 1}`,
      sourceOrDerivation: (slide.math ?? []).length ? "Validated concept graph and deterministic mathematics layer." : "Lesson objective and topic-grounded content model.",
      title: clean(slide.title, 90),
      validationRequirements: ["topic relevance", "complete learner-facing sentences", "layout budget", ...(slide.math?.length ? ["valid canonical LaTeX", "defined variables", "numeric consistency"] : [])],
      visualIntent: slide.visuals?.[0] ? {
        expectedInsight: slide.visuals[0].expectedInsight ?? "",
        labels: slide.visuals[0].labels ?? [],
        learnerQuestion: slide.visuals[0].learnerQuestion,
        mathematicalRelationship: slide.visuals[0].mathematicalRelationship ?? "",
        quantitiesEncoded: slide.visuals[0].quantitiesEncoded ?? [],
        visualType: slide.visuals[0].type ?? ""
      } : undefined
    })),
    subject: clean(plan.context.subject, 80),
    topic: clean(plan.context.topic, 140)
  };
}

function slidePurpose(type?: string) {
  const purposes: Record<string, string> = {
    answer_explanation: "Assess understanding without revealing the answer in student mode.",
    big_idea: "Establish the central explanatory relationship.",
    comparison: "Distinguish concepts using explicit criteria.",
    concept: "Explain one coherent concept and connect it to evidence or a model.",
    data_display: "Read a quantitative or observable relationship from a visual.",
    guided_practice: "Apply the concept with scaffolded reasoning.",
    independent_practice: "Check independent transfer to a new example.",
    misconception: "Contrast a tempting error with the accurate model.",
    process: "Trace a causal or sequential mechanism.",
    summary: "Synthesize relationships rather than repeat headings.",
    vocabulary: "Define only the terms needed to reason through the lesson.",
    worked_example: "Model each decision in a complete solution."
  };
  return purposes[type ?? ""] ?? "Advance one specific learning goal with substantive student-facing content.";
}

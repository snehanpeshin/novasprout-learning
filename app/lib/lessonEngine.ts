export const lessonEngineVersion = "2.0" as const;

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
  expression: string;
  meaning: string;
  units?: string;
};

export type ConceptGraph = {
  assessmentTargets: string[];
  formulas: StructuredFormula[];
  misconceptions: Array<{ correction: string; statement: string }>;
  nodes: ConceptNode[];
  relationships: ConceptRelationship[];
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
  equation?: string;
  id?: string;
  labels?: string[];
  points?: Array<{ x: number; y: number; z?: number }>;
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
    expression: clean(formula.expression, 180),
    meaning: clean(formula.meaning, 280),
    units: clean(formula.units, 80) || undefined
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
    relationships
  };
}

function inferTopicNodes(lower: string, topic: string): ConceptNode[] {
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

export function validateStructuredFormula(formula: StructuredFormula) {
  const expression = clean(formula.expression, 220);
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
  return { valid: true };
}

export function contentBudget(layoutType: string, hasVisual: boolean) {
  if (layoutType === "full-visual") return { maxBullets: 2, maxCharacters: 300 };
  if (layoutType === "equation-focus") return { maxBullets: 3, maxCharacters: 420 };
  if (hasVisual) return { maxBullets: 4, maxCharacters: 520 };
  return { maxBullets: 5, maxCharacters: 680 };
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

type EnhancedEnginePlan = EnginePlan & {
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
    const shouldReplace = existingVisuals.length === 0 || existingVisuals.some((visual) => isGenericConceptMap(visual, plan.context.topic));
    const formulas = conceptGraph.formulas.filter((formula) => {
      const text = slideText(slide).toLowerCase();
      return text.includes("entropy") || text.includes("heat capacity") || text.includes("absolute zero") || text.includes("equation");
    }).slice(0, slide.type === "worked_example" ? 2 : 1);
    const hasVisual = Boolean((shouldReplace && replacement) || existingVisuals.length);
    const layoutType = formulas.length ? "equation-focus" : hasVisual ? "text-visual" : "text-focus";
    const budget = contentBudget(layoutType, hasVisual);
    const content = slide.studentContent ?? {};
    return {
      ...slide,
      layoutType,
      math: formulas,
      purpose: slidePurpose(slide.type),
      speakerNotes: audienceMode === "teacher" ? `Check understanding of ${clean(slide.title, 90)} before advancing.` : undefined,
      studentContent: {
        ...content,
        bullets: content.bullets?.map((item) => fitTextAtSentenceBoundary(item, 150)).slice(0, budget.maxBullets),
        explanation: content.explanation ? fitTextAtSentenceBoundary(content.explanation, Math.min(360, budget.maxCharacters)) : undefined,
        keyIdea: content.keyIdea ? fitTextAtSentenceBoundary(content.keyIdea, 220) : undefined
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

import type { LessonPlanSlide, VisualSpec } from "../lessonSlidePlan.ts";
import { rewriteToFit } from "./contentCompressor.ts";
import { legacyLayoutType, selectPurposeLayout } from "./layoutEngine.ts";
import { isPlaceholderSlide, validateAndRepairSlide } from "./slideValidator.ts";
import type { SlideValidationFinding } from "./types.ts";

type ConceptGraphSource = {
  nodes?: Array<{ definition?: string; label?: string }>;
  relationships?: Array<{ explanation?: string; from?: string; relationship?: string; to?: string }>;
};

export type SlideDoctorSummary = {
  inspectedSlides: number;
  passes: number;
  repairedSlides: number;
  unresolvedErrors: number;
};

export type SlideDoctorResult = {
  findingsBySlide: Map<string, SlideValidationFinding[]>;
  slides: LessonPlanSlide[];
  summary: SlideDoctorSummary;
};

function clean(value?: string) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function fit(value: string | undefined, maxWords: number) {
  const normalized = clean(value);
  return normalized ? rewriteToFit(normalized, maxWords) : undefined;
}

function visibleText(slide: LessonPlanSlide) {
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

function words(value: string) {
  return clean(value).split(/\s+/).filter(Boolean);
}

function overlapScore(first: string, second: string) {
  const firstWords = new Set(words(first.toLowerCase()).filter((word) => word.length > 3));
  const secondWords = new Set(words(second.toLowerCase()).filter((word) => word.length > 3));
  if (!firstWords.size || !secondWords.size) return 0;
  const shared = [...firstWords].filter((word) => secondWords.has(word)).length;
  return shared / Math.min(firstWords.size, secondWords.size);
}

function conceptContent(graph: ConceptGraphSource | undefined, topic: string, index: number) {
  const nodes = (graph?.nodes ?? []).filter((node) => clean(node.label) && clean(node.definition));
  const relationships = (graph?.relationships ?? []).filter((relationship) =>
    clean(relationship.from) && clean(relationship.to)
  );
  const node = nodes[index % Math.max(1, nodes.length)];
  const relationship = relationships[index % Math.max(1, relationships.length)];
  const relationshipSentence = relationship
    ? clean(relationship.explanation) || `${relationship.from} ${relationship.relationship || "connects to"} ${relationship.to}.`
    : "";
  const keyIdea = node
    ? `${clean(node.label)}: ${clean(node.definition)}`
    : `${topic} can be understood by tracing one clear idea, example, and check.`;
  return {
    explanation: fit(relationshipSentence || keyIdea, 48),
    keyIdea: fit(keyIdea, 30),
    labels: nodes.slice(index, index + 4).map((item) => clean(item.label)).filter(Boolean)
  };
}

function fallbackVisual(slide: LessonPlanSlide, topic: string, labels: string[]): VisualSpec {
  const fallbackLabels = [...new Set([
    ...labels,
    ...words(`${topic} ${slide.title}`).filter((word) => word.length > 3)
  ])].slice(0, 5);
  return {
    accessibilityLabel: `A structured visual showing the important ideas on ${slide.title}.`,
    id: `${slide.id}-doctor-visual`,
    labels: fallbackLabels.length >= 2 ? fallbackLabels : [topic, "Example", "Check"],
    title: slide.title,
    type: "labeled_cards"
  };
}

function layoutHasCollision(visual: VisualSpec) {
  return Boolean(visual.diagramLayout?.collisions.length || visual.diagramLayout?.overflowElementIds.length);
}

function normalizeStructure(slide: LessonPlanSlide) {
  const content = slide.studentContent;
  const compact = {
    ...content,
    bullets: content.bullets?.slice(0, 4).map((item) => fit(item, 20)!).filter(Boolean),
    examples: content.examples?.slice(0, 1).map((item) => fit(item, 30)!).filter(Boolean),
    explanation: fit(content.explanation, 58),
    hint: fit(content.hint, 24),
    keyIdea: fit(content.keyIdea, 28),
    question: fit(content.question, 44),
    steps: content.steps?.slice(0, 4).map((item) => fit(item, 22)!).filter(Boolean)
  };

  if (["guided_practice", "independent_practice", "knowledge_check"].includes(slide.slideType)) {
    compact.bullets = undefined;
    compact.examples = undefined;
    compact.explanation = undefined;
    compact.keyIdea = undefined;
    compact.steps = undefined;
  } else if (slide.slideType === "worked_example") {
    compact.bullets = undefined;
    compact.examples = undefined;
    compact.explanation = fit(content.explanation, 34);
    compact.steps = content.steps?.slice(0, 4).map((item) => fit(item, 18)!).filter(Boolean);
  } else if (["labeled_diagram", "comparison", "process_or_sequence"].includes(slide.slideType)) {
    compact.bullets = content.bullets?.slice(0, 2).map((item) => fit(item, 16)!).filter(Boolean);
    compact.examples = undefined;
    compact.explanation = fit(content.explanation, 30);
    compact.steps = undefined;
  } else if (slide.slideType === "summary") {
    compact.bullets = content.bullets?.slice(0, 4).map((item) => fit(item, 18)!).filter(Boolean);
    compact.examples = undefined;
    compact.explanation = undefined;
    compact.steps = undefined;
  }

  return compact;
}

function repairOneSlide({
  graph,
  index,
  previous,
  slide,
  topic
}: {
  graph?: ConceptGraphSource;
  index: number;
  previous?: LessonPlanSlide;
  slide: LessonPlanSlide;
  topic: string;
}) {
  const findings: SlideValidationFinding[] = [];
  const repaired = structuredClone(slide);
  repaired.studentContent = normalizeStructure(repaired);

  if (repaired.visuals.length > 1) {
    repaired.visuals = repaired.visuals.slice(0, 1);
    findings.push({
      automaticCorrection: "Kept one dominant visual and removed competing visual layers.",
      code: "duplicate_content",
      message: "Multiple visual layers were reduced to one clear instructional visual.",
      offendingElement: "visuals",
      repaired: true,
      severity: "warning"
    });
  }

  if (repaired.visuals.some(layoutHasCollision)) {
    repaired.visuals = repaired.visuals.map((visual) => ({ ...visual, diagramLayout: undefined }));
    findings.push({
      automaticCorrection: "Reset the visual to the renderer's collision-safe layout.",
      code: "visual_collision",
      message: "An overlapping or out-of-bounds visual layout was reset before rendering.",
      offendingElement: "diagramLayout",
      repaired: true,
      severity: "error"
    });
  }

  const source = conceptContent(graph, topic, index);
  const contentWordCount = words(visibleText({ ...repaired, title: "" })).length;
  const needsQuestion = ["guided_practice", "independent_practice", "knowledge_check"].includes(repaired.slideType);
  const needsTaskRepair = !clean(repaired.studentContent.question) || isPlaceholderSlide(repaired);
  if (needsQuestion && needsTaskRepair) {
    repaired.studentContent.question = `How would you use ${source.labels[0] || topic} to explain or solve a new example?`;
    repaired.studentContent.hint = `Start with the main relationship from ${topic}, then justify one step.`;
    findings.push({
      automaticCorrection: "Created a topic-specific learner task from the concept model.",
      code: "placeholder_slide",
      message: "A missing practice task was rebuilt with a specific question and hint.",
      offendingElement: "studentContent.question",
      repaired: true,
      severity: "error"
    });
  } else if (repaired.slideType === "worked_example" && needsTaskRepair) {
    const existingSteps = repaired.studentContent.steps?.filter((step) => clean(step)) ?? [];
    repaired.studentContent.question ||= `How can ${source.labels[0] || topic} be used to solve this example?`;
    repaired.studentContent.steps = existingSteps.length >= 2
      ? existingSteps
      : [
          `Identify the quantities or evidence connected to ${source.labels[0] || topic}.`,
          ...existingSteps,
          "Apply the relationship and show each intermediate step.",
          "Check the result against the original information and include appropriate units."
        ].slice(0, 4);
    findings.push({
      automaticCorrection: "Rebuilt the worked example with a specific prompt, solution path, and final check.",
      code: "placeholder_slide",
      message: "A worked example without a complete learner task was rebuilt and checked again.",
      offendingElement: "studentContent",
      repaired: true,
      severity: "error"
    });
  } else if (contentWordCount < 10 && !["lesson_cover", "vocabulary"].includes(repaired.slideType)) {
    repaired.studentContent.keyIdea ||= source.keyIdea;
    repaired.studentContent.explanation ||= source.explanation;
    findings.push({
      automaticCorrection: "Refilled the slide from the lesson concept graph.",
      code: "placeholder_slide",
      message: "Sparse learner content was rebuilt with a topic definition or relationship.",
      offendingElement: "studentContent",
      repaired: true,
      severity: "error"
    });
  }

  if (
    previous &&
    !["summary", "next_steps", "guided_practice", "independent_practice", "knowledge_check"].includes(repaired.slideType) &&
    overlapScore(visibleText(previous), visibleText(repaired)) > 0.9
  ) {
    repaired.studentContent.keyIdea = source.keyIdea;
    repaired.studentContent.explanation = source.explanation;
    repaired.studentContent.bullets = undefined;
    repaired.studentContent.steps = undefined;
    findings.push({
      automaticCorrection: "Rebuilt the slide around a different concept-model relationship.",
      code: "repeated_concept",
      message: "A near-duplicate slide was given a distinct teaching purpose.",
      offendingElement: "studentContent",
      repaired: true,
      severity: "warning"
    });
  }

  const requestsVisual = /\b(?:diagram|graph|image|illustration|model)\b/i.test(visibleText(repaired));
  if (requestsVisual && !repaired.visuals.length) {
    repaired.visuals = [fallbackVisual(repaired, topic, source.labels)];
    findings.push({
      automaticCorrection: "Added a renderer-safe topic visual.",
      code: "missing_visual",
      message: "A requested visual was recreated from the lesson concept model.",
      offendingElement: "visuals",
      repaired: true,
      severity: "error"
    });
  }

  repaired.layoutType = legacyLayoutType(selectPurposeLayout({ ...repaired, legacyType: repaired.type }));
  return { findings, repaired };
}

export function runSlideDoctor({
  conceptGraph,
  slides,
  topic
}: {
  conceptGraph?: ConceptGraphSource;
  slides: LessonPlanSlide[];
  topic: string;
}): SlideDoctorResult {
  const repairFindings = new Map<string, SlideValidationFinding[]>();
  const repairedIds = new Set<string>();
  let current = slides.map((slide) => structuredClone(slide));
  let passes = 0;

  for (let pass = 0; pass < 2; pass += 1) {
    passes += 1;
    current = current.map((slide, index) => {
      const result = repairOneSlide({
        graph: conceptGraph,
        index: index + pass,
        previous: current[index - 1],
        slide,
        topic
      });
      if (result.findings.length) {
        repairedIds.add(slide.id);
        repairFindings.set(slide.id, [...(repairFindings.get(slide.id) ?? []), ...result.findings]);
      }
      return result.repaired;
    });
  }

  const findingsBySlide = new Map<string, SlideValidationFinding[]>();
  const finalSlides = current.map((slide) => {
    const validation = validateAndRepairSlide(slide);
    const findings = [...(repairFindings.get(slide.id) ?? []), ...validation.findings];
    if (validation.findings.some((finding) => finding.repaired)) repairedIds.add(slide.id);
    findingsBySlide.set(slide.id, findings);
    return validation.repaired as LessonPlanSlide;
  });
  const unresolvedErrors = [...findingsBySlide.values()].flat().filter(
    (finding) => finding.severity === "error" && !finding.repaired
  ).length;

  return {
    findingsBySlide,
    slides: finalSlides,
    summary: {
      inspectedSlides: finalSlides.length,
      passes,
      repairedSlides: repairedIds.size,
      unresolvedErrors
    }
  };
}

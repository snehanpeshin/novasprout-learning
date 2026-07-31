import type { LessonPlanSlide, VisualSpec } from "../lessonSlidePlan.ts";
import { validateCircuitSemanticConsistency } from "./circuitBinding.ts";
import {
  fitTextToBox,
  isCompleteSentence,
  rewriteToFit,
  shortenTitle
} from "./contentCompressor.ts";
import { supportsDiagramType } from "./diagramRendererRegistry.ts";
import { validateFormattedMath } from "./mathRenderer.ts";
import { isValidConceptNode } from "./visualSelector.ts";
import type {
  SemanticSlideInput,
  SlideValidationFinding,
  ValidationResult
} from "./types.ts";

function clean(value?: string, max = 1200) {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length <= max
    ? normalized
    : rewriteToFit(normalized, Math.max(4, Math.floor(max / 7)));
}

function wordCount(value?: string) {
  return clean(value).split(/\s+/).filter(Boolean).length;
}

function completeSentence(value?: string) {
  const text = clean(value);
  if (!text || isCompleteSentence(text)) return text;
  return rewriteToFit(text, Math.max(4, wordCount(text)));
}

function uniqueStrings(items?: string[]) {
  return (items ?? []).filter((item, index, all) => {
    const normalized = clean(item).toLowerCase();
    return normalized && all.findIndex((candidate) => clean(candidate).toLowerCase() === normalized) === index;
  });
}

const genericActivityText = [
  "a visual model for the science idea",
  "explain your reasoning",
  "practice and quiz",
  "step-by-step example",
  "your turn"
];

function learnerTask(slide: SemanticSlideInput) {
  return clean(slide.studentContent?.question || slide.assessment?.question, 600);
}

export function isPlaceholderSlide(slide: SemanticSlideInput) {
  const text = [
    slide.title,
    slide.studentContent?.keyIdea,
    slide.studentContent?.explanation,
    slide.studentContent?.question,
    ...(slide.studentContent?.bullets ?? []),
    ...(slide.studentContent?.steps ?? [])
  ].filter(Boolean).join(" ").toLowerCase();
  const task = learnerTask(slide);
  const activity = slide.slideType === "guided_practice" ||
    slide.slideType === "independent_practice" ||
    slide.slideType === "knowledge_check";
  if (activity && !task) return true;
  if (activity && genericActivityText.some((phrase) => task.toLowerCase() === phrase)) return true;
  if (genericActivityText.some((phrase) => text.trim() === phrase)) return true;
  if (slide.slideType === "worked_example") {
    const workedText = clean(
      [
        slide.studentContent?.explanation,
        slide.studentContent?.question,
        ...(slide.studentContent?.steps ?? [])
      ].filter(Boolean).join(" "),
      1200
    );
    const hasWorkedContent = Boolean(
      slide.studentContent?.question ||
      (slide.studentContent?.steps?.length ?? 0) >= 2 ||
      /\b(?:find|calculate|determine|given)\b/i.test(workedText) && /\d/.test(workedText) ||
      slide.visuals?.some((visual) => visual.diagramData?.kind === "circuit_problem" && visual.diagramData.circuit.showSolution)
    );
    if (!hasWorkedContent) return true;
  }
  return false;
}

function alignmentFinding(message: string, expectedValue: string, actualValue: string): SlideValidationFinding {
  return {
    actualValue,
    code: "title_visual_mismatch",
    expectedValue,
    message,
    offendingElement: "title/visual",
    repaired: false,
    severity: "error"
  };
}

export function validateTitleVisualAlignment(
  title: string,
  visual: VisualSpec | undefined,
  slide: SemanticSlideInput
) {
  const findings: SlideValidationFinding[] = [];
  const normalizedTitle = clean(title, 160).toLowerCase();
  const visualType = visual?.type ?? "none";
  if (
    /\bcircuit types?\b|\bvisual comparison\b/.test(normalizedTitle) ||
    slide.slideType === "comparison" && /\bseries\s+(?:vs|versus|and)\s+parallel\b/.test(normalizedTitle)
  ) {
    const hasTwoTypes = visualType === "series_parallel_comparison" ||
      (visualType === "comparison_table" && (visual?.columns?.length ?? 0) >= 2);
    if (!hasTwoTypes) findings.push(alignmentFinding("Circuit comparison title requires both series and parallel visuals.", "series_parallel_comparison", visualType));
  }
  if (/\bconductors?\b.*\binsulators?\b|\binsulators?\b.*\bconductors?\b/.test(normalizedTitle)) {
    const titles = (visual?.columns ?? []).map((column) => column.title.toLowerCase());
    if (visualType !== "comparison_table" || !titles.some((value) => value.includes("conductor")) || !titles.some((value) => value.includes("insulator"))) {
      findings.push(alignmentFinding("Conductor and insulator title requires a two-category material comparison.", "comparison_table with conductor and insulator columns", visualType));
    }
  }
  if (/\bstep-by-step example\b/.test(normalizedTitle)) {
    const stepCount = slide.studentContent?.steps?.length ?? visual?.sections?.length ?? 0;
    if (stepCount < 3) findings.push(alignmentFinding("Step-by-step title requires an actual problem and at least three solution stages.", "three or more solution stages", String(stepCount)));
  }
  if (/\bpractice\s*\+\s*quiz\b/.test(normalizedTitle) && !learnerTask(slide)) {
    findings.push(alignmentFinding("Practice and quiz title requires a specific learner question.", "specific question", "none"));
  }
  if (/\bconcepts?\s+and\s+labeled diagram\b/.test(normalizedTitle) && (visual?.labels?.length ?? 0) < 2) {
    findings.push(alignmentFinding("Labeled-diagram title requires meaningful component labels.", "at least two labels", String(visual?.labels?.length ?? 0)));
  }
  return findings;
}

export function validateAndRepairSlide<T extends SemanticSlideInput>(slide: T): ValidationResult<T> {
  const findings: SlideValidationFinding[] = [];
  const repaired = structuredClone(slide) as T;
  repaired.studentContent = { ...(slide.studentContent ?? {}) };
  const originalTitle = clean(slide.title, 160);
  repaired.title = shortenTitle(originalTitle, 58);
  if (repaired.title !== originalTitle) {
    findings.push({ code: "title_too_long", message: "Title was shortened to fit the header.", repaired: true, severity: "warning" });
  }

  const content = repaired.studentContent;
  if (repaired.slideType !== "worked_example") {
    for (const field of ["explanation", "keyIdea"] as const) {
      const visible = clean(content[field], 1200);
      const withoutAnswer = visible.replace(/\b(?:Answer|Solution|Correct answer)\s*:\s*[^]*$/i, "").trim();
      if (visible && withoutAnswer !== visible) {
        content[field] = withoutAnswer || undefined;
        findings.push({
          automaticCorrection: "Moved the answer out of learner-facing slide text.",
          code: "answer_leakage",
          message: `A visible answer was removed from ${field}.`,
          offendingElement: `studentContent.${field}`,
          repaired: true,
          severity: "error"
        });
      }
    }
    for (const field of ["bullets", "steps"] as const) {
      const original = content[field] ?? [];
      const withoutAnswers = original
        .map((item) => clean(item, 700).replace(/\b(?:Answer|Solution|Correct answer)\s*:\s*[^]*$/i, "").trim())
        .filter(Boolean);
      if (withoutAnswers.some((item, index) => item !== clean(original[index], 700)) || withoutAnswers.length !== original.length) {
        content[field] = withoutAnswers;
        findings.push({
          automaticCorrection: "Moved embedded answers out of learner-facing list items.",
          code: "answer_leakage",
          message: `A visible answer was removed from ${field}.`,
          offendingElement: `studentContent.${field}`,
          repaired: true,
          severity: "error"
        });
      }
    }
  }
  const originalBullets = content.bullets ?? [];
  const deduplicatedBullets = uniqueStrings(originalBullets);
  if (deduplicatedBullets.length !== originalBullets.length) {
    findings.push({ code: "duplicate_content", message: "Duplicate bullets were removed.", repaired: true, severity: "warning" });
  }
  content.bullets = deduplicatedBullets.slice(0, 6).map((bullet) => {
    const fitted = fitTextToBox({
      boxHeight: 0.9,
      boxWidth: 6,
      maxLines: 3,
      minimumFontSize: 15,
      preferredFontSize: 17,
      text: completeSentence(bullet)
    });
    if (fitted.didShorten || !fitted.fits) {
      findings.push({ code: "bullet_too_long", message: "A long bullet was fitted to a three-line budget.", repaired: true, severity: "warning" });
    }
    return fitted.text;
  });
  if (originalBullets.length > 6) {
    findings.push({ code: "too_many_bullets", message: "Bullets were limited to six.", repaired: true, severity: "warning" });
  }

  if (repaired.slideType === "concept_explanation" && wordCount(content.explanation) > 70) {
    const fitted = fitTextToBox({
      boxHeight: 2.2,
      boxWidth: 5.4,
      maxLines: 9,
      minimumFontSize: 16,
      preferredFontSize: 18,
      text: content.explanation ?? ""
    });
    content.explanation = fitted.text;
    findings.push({ code: "content_overflow", message: "Concept explanation was reduced to the 70-word slide budget.", repaired: true, severity: "warning" });
  }

  for (const field of ["explanation", "keyIdea"] as const) {
    const value = content[field];
    if (value && !isCompleteSentence(clean(value))) {
      content[field] = completeSentence(value);
      findings.push({
        automaticCorrection: "Rewrote the fragment as a complete concise sentence.",
        code: "incomplete_sentence",
        message: `${field} contained an incomplete sentence and was rewritten.`,
        offendingElement: field,
        repaired: true,
        severity: "warning"
      });
    }
  }

  if (content.question) {
    const safeQuestion = clean(content.question, 520).replace(/\b(?:Answer|Solution|Correct answer)\s*:\s*[^]*$/i, "").trim();
    if (safeQuestion !== clean(content.question, 520)) {
      findings.push({ code: "answer_leakage", message: "Answer text was removed from the student question.", repaired: true, severity: "error" });
    }
    content.question = safeQuestion;
  }

  const answer = clean(content.answer, 360);
  if (answer) {
    for (const field of ["explanation", "question"] as const) {
      const visible = clean(content[field], 900);
      if (visible && visible.toLowerCase().includes(answer.toLowerCase())) {
        content[field] = visible.split(/(?<=[.!?])\s+/).filter((sentence) => !sentence.toLowerCase().includes(answer.toLowerCase())).join(" ") || undefined;
        findings.push({ code: "answer_leakage", message: "A visible answer sentence was moved out of learner-facing content.", repaired: true, severity: "error" });
      }
    }
  }

  const assessmentAnswer = clean(repaired.assessment?.correctAnswer, 500);
  if (assessmentAnswer && (
    repaired.slideType === "guided_practice" ||
    repaired.slideType === "independent_practice" ||
    repaired.slideType === "knowledge_check"
  )) {
    for (const field of ["explanation", "hint", "question"] as const) {
      const visible = clean(content[field], 900);
      if (visible && visible.toLowerCase().includes(assessmentAnswer.toLowerCase())) {
        content[field] = visible
          .split(/(?<=[.!?])\s+/)
          .filter((sentence) => !sentence.toLowerCase().includes(assessmentAnswer.toLowerCase()))
          .join(" ") || undefined;
        findings.push({
          automaticCorrection: "Moved the answer to the structured answer key.",
          code: "answer_leakage",
          message: `The assessment answer was removed from visible ${field} text.`,
          offendingElement: field,
          repaired: true,
          severity: "error"
        });
      }
    }
  }

  repaired.math = (repaired.math ?? []).filter((formula) => {
    const validation = validateFormattedMath(formula.expression, formula.units);
    if (!validation.valid) {
      findings.push({ code: "malformed_equation", message: validation.findings[0]?.message ?? "Malformed equation removed.", repaired: true, severity: "error" });
      return false;
    }
    formula.expression = validation.canonicalLatex;
    if (validation.findings.some((finding) => finding.code.startsWith("missing_"))) {
      findings.push({ code: "missing_units", message: validation.findings.find((finding) => finding.code.startsWith("missing_"))?.message ?? "Equation units need review.", repaired: false, severity: "warning" });
    }
    return true;
  });

  repaired.visuals = (repaired.visuals ?? []).filter((visual) => {
    if (!supportsDiagramType(visual.type)) {
      findings.push({ code: "visual_content_mismatch", message: `No diagram renderer is registered for ${visual.type ?? "this visual"}.`, repaired: false, severity: "error" });
      return false;
    }
    if (visual.type === "concept_map") {
      const center = visual.title ?? repaired.title ?? "";
      const valid: string[] = [];
      for (const label of visual.labels ?? []) {
        if (isValidConceptNode(label, center, valid)) valid.push(label);
      }
      visual.labels = valid;
      if (valid.length < 2) {
        findings.push({ code: "generic_visual", message: "A low-value concept map was removed.", repaired: true, severity: "error" });
        return false;
      }
    }
    if ((visual.labels ?? []).some((label) => clean(label).length > 54)) {
      visual.labels = visual.labels?.map((label) => shortenTitle(label, 48));
      findings.push({ code: "visual_label_overflow", message: "Long visual labels were shortened.", repaired: true, severity: "warning" });
    }
    if (
      assessmentAnswer &&
      (repaired.slideType === "guided_practice" ||
        repaired.slideType === "independent_practice" ||
        repaired.slideType === "knowledge_check")
    ) {
      if (visual.caption?.toLowerCase().includes(assessmentAnswer.toLowerCase())) {
        visual.caption = undefined;
        findings.push({
          automaticCorrection: "Removed the answer-revealing visual caption.",
          code: "answer_leakage",
          message: "A visual caption revealed the assessment answer.",
          offendingElement: `${visual.id ?? "visual"}.caption`,
          repaired: true,
          severity: "error"
        });
      }
      visual.steps = visual.steps?.filter((step) => !step.toLowerCase().includes(assessmentAnswer.toLowerCase()));
    }
    return true;
  });

  if (isPlaceholderSlide(repaired)) {
    findings.push({
      code: "placeholder_slide",
      message: "The slide does not contain a specific instructional task.",
      offendingElement: "studentContent",
      repaired: false,
      severity: "error"
    });
  }

  findings.push(...validateTitleVisualAlignment(repaired.title ?? "", repaired.visuals?.[0] as VisualSpec | undefined, repaired));
  for (const visual of repaired.visuals ?? []) {
    const layout = (visual as VisualSpec).diagramLayout;
    if (layout?.collisions.length) {
      findings.push({
        actualValue: layout.collisions.map((collision) => `${collision.firstId}/${collision.secondId}`).join(", "),
        code: "visual_collision",
        expectedValue: "No overlapping diagram elements",
        message: "Diagram labels or elements overlap inside the safe region.",
        offendingElement: "diagramLayout",
        repaired: false,
        severity: "error"
      });
    }
    if (layout?.overflowElementIds.length) {
      findings.push({
        actualValue: layout.overflowElementIds.join(", "),
        code: "visual_bounds_overflow",
        expectedValue: "All elements inside safeBounds",
        message: "One or more rendered diagram elements cross the slide-safe bounds.",
        offendingElement: "diagramLayout",
        repaired: false,
        severity: "error"
      });
    }
  }
  findings.push(...validateCircuitSemanticConsistency(repaired as unknown as LessonPlanSlide));

  const visibleText = [
    repaired.title,
    content.keyIdea,
    content.explanation,
    content.question,
    ...(content.bullets ?? []),
    ...(content.steps ?? [])
  ].filter(Boolean).join(" ");
  if (/\b(?:show|draw|insert|render)\s+(?:an?|the)\s+(?:diagram|graph|image|illustration)\b/i.test(visibleText) && !repaired.visuals?.length) {
    findings.push({ code: "missing_visual", message: "The content requests a visual, but no visual is present.", repaired: false, severity: "error" });
  }
  if (/\b(?:guarantees?|always proves?|will definitely)\b/i.test(visibleText)) {
    findings.push({ code: "unsupported_claim", message: "An absolute claim needs evidence or qualification.", repaired: false, severity: "warning" });
  }
  if (/\b(electric|circuit|voltage|current|resistance)\b/i.test(visibleText) && repaired.visuals?.some((visual) => visual.type === "coordinate_graph")) {
    repaired.visuals = repaired.visuals.filter((visual) => visual.type !== "coordinate_graph");
    findings.push({ code: "visual_content_mismatch", message: "An unrelated coordinate graph was removed from an electricity slide.", repaired: true, severity: "error" });
  }
  if ((repaired.slideType === "independent_practice" || repaired.slideType === "knowledge_check") && !repaired.assessment) {
    findings.push({ code: "missing_answer_key", message: "Practice slide needs a structured answer-key entry.", repaired: false, severity: "error" });
  }

  return {
    findings,
    repaired,
    valid: !findings.some((finding) => finding.severity === "error" && !finding.repaired)
  };
}

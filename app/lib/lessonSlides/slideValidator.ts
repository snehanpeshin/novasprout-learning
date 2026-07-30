import { fitTextToBox, shortenTitle } from "./contentCompressor.ts";
import { supportsDiagramType } from "./diagramRendererRegistry.ts";
import { validateFormattedMath } from "./mathRenderer.ts";
import { isValidConceptNode } from "./visualSelector.ts";
import type {
  SemanticSlideInput,
  SlideValidationFinding,
  ValidationResult
} from "./types.ts";

function clean(value?: string, max = 1200) {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function wordCount(value?: string) {
  return clean(value).split(/\s+/).filter(Boolean).length;
}

function completeSentence(value?: string) {
  const text = clean(value);
  if (!text || /[.!?]$/.test(text)) return text;
  return `${text.replace(/[,;:]$/, "")}.`;
}

function uniqueStrings(items?: string[]) {
  return (items ?? []).filter((item, index, all) => {
    const normalized = clean(item).toLowerCase();
    return normalized && all.findIndex((candidate) => clean(candidate).toLowerCase() === normalized) === index;
  });
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
  const originalBullets = content.bullets ?? [];
  const deduplicatedBullets = uniqueStrings(originalBullets);
  if (deduplicatedBullets.length !== originalBullets.length) {
    findings.push({ code: "duplicate_content", message: "Duplicate bullets were removed.", repaired: true, severity: "warning" });
  }
  content.bullets = deduplicatedBullets.slice(0, 6).map((bullet) => {
    const fitted = fitTextToBox({
      boxHeight: 0.55,
      boxWidth: 5.6,
      maxLines: 2,
      minimumFontSize: 16,
      preferredFontSize: 18,
      text: completeSentence(bullet)
    });
    if (fitted.didShorten || !fitted.fits) {
      findings.push({ code: "bullet_too_long", message: "A long bullet was fitted to a two-line budget.", repaired: true, severity: "warning" });
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
    if (value && !/[.!?]$/.test(clean(value))) {
      content[field] = completeSentence(value);
      findings.push({ code: "incomplete_sentence", message: `${field} was completed with terminal punctuation.`, repaired: true, severity: "warning" });
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
    return true;
  });

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

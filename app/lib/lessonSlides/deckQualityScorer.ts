import type {
  DeckQualityScore,
  DesignPrincipleScores,
  SemanticSlideInput,
  SlideQualityBreakdown,
  SlideQualityScore,
  SlideValidationFinding
} from "./types.ts";

const deductions: Record<string, Partial<Record<keyof SlideQualityBreakdown, number>>> = {
  answer_leakage: { instructionalUsefulness: 7, contentAccuracy: 3 },
  bullet_too_long: { readability: 2, layoutBalance: 2 },
  calculation_error: { contentAccuracy: 18, instructionalUsefulness: 4 },
  content_overflow: { readability: 5, layoutBalance: 5 },
  duplicate_content: { instructionalUsefulness: 3, consistency: 2 },
  generic_visual: { visualRelevance: 8, instructionalUsefulness: 3 },
  incomplete_sentence: { readability: 3, consistency: 2 },
  invalid_concept_node: { visualRelevance: 5, consistency: 1 },
  malformed_equation: { contentAccuracy: 12, consistency: 2 },
  missing_answer_key: { instructionalUsefulness: 10, contentAccuracy: 3 },
  missing_units: { contentAccuracy: 5, readability: 1 },
  missing_visual: { visualRelevance: 10, instructionalUsefulness: 3 },
  placeholder_slide: { instructionalUsefulness: 12, visualRelevance: 5 },
  repeated_concept: { instructionalUsefulness: 3, consistency: 3 },
  semantic_value_mismatch: { contentAccuracy: 15, consistency: 4 },
  title_too_long: { readability: 2, layoutBalance: 2 },
  title_visual_mismatch: { visualRelevance: 12, instructionalUsefulness: 5 },
  too_many_bullets: { readability: 3, layoutBalance: 3 },
  unsupported_claim: { contentAccuracy: 8 },
  visual_bounds_overflow: { layoutBalance: 12, readability: 5 },
  visual_collision: { layoutBalance: 10, readability: 5 },
  visual_content_mismatch: { visualRelevance: 12, contentAccuracy: 3 },
  visual_label_overflow: { readability: 2, layoutBalance: 2 }
};

const designPrincipleKeys: Array<keyof DesignPrincipleScores> = [
  "contrast",
  "whitespace",
  "hierarchy",
  "simplicity",
  "consistency",
  "scale",
  "typography"
];

function words(value?: string) {
  return (value ?? "").trim().split(/\s+/).filter(Boolean).length;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Assesses the presentation principles that can be measured before rendering.
 * Contrast starts from the accessible NovaSprout theme contract; the remaining
 * scores inspect semantic density and structure so poor slides are caught before
 * they reach Beamer or the native lesson player.
 */
export function assessSlideDesignPrinciples(slide: SemanticSlideInput) {
  const content = slide.studentContent ?? {};
  const bullets = content.bullets ?? [];
  const steps = content.steps ?? [];
  const visuals = slide.visuals ?? [];
  const titleWords = words(slide.title);
  const bodyWords = [
    content.keyIdea,
    content.explanation,
    content.question,
    ...bullets,
    ...steps
  ].reduce((total, value) => total + words(value), 0);
  const contentBlocks = [
    content.keyIdea,
    content.explanation,
    content.question,
    bullets.length ? "bullets" : "",
    steps.length ? "steps" : ""
  ].filter(Boolean).length;
  const notes: string[] = [];

  // Renderers use NovaInk on NovaPaper and white on NovaNavy/subject accents.
  // A useful accessibility label is the semantic guard for non-text visuals.
  let contrast = 100;
  if (visuals.length && !slide.accessibilityLabel?.trim()) {
    contrast -= 12;
    notes.push("Add an accessibility label so visual meaning is not conveyed by color alone.");
  }

  let whitespace = 100;
  if (bodyWords > 95) whitespace -= Math.min(45, Math.ceil((bodyWords - 95) / 3));
  if (contentBlocks > 3) whitespace -= (contentBlocks - 3) * 8;
  if (bullets.length > 5) whitespace -= (bullets.length - 5) * 7;
  if (visuals.length > 1) whitespace -= (visuals.length - 1) * 10;
  if (whitespace < 80) notes.push("Reduce content density to preserve meaningful whitespace.");

  let hierarchy = 100;
  if (!slide.title?.trim()) hierarchy -= 45;
  if (titleWords > 9) hierarchy -= Math.min(25, (titleWords - 9) * 4);
  const needsFocus = !["lesson_cover", "learning_objectives", "vocabulary"].includes(slide.slideType ?? "");
  if (needsFocus && !content.keyIdea && !content.question && !content.explanation) hierarchy -= 25;
  if (content.keyIdea && words(content.keyIdea) > 24) hierarchy -= 12;
  if (hierarchy < 80) notes.push("Strengthen the title-to-key-idea hierarchy.");

  let simplicity = 100;
  if (bodyWords > 80) simplicity -= Math.min(40, Math.ceil((bodyWords - 80) / 3));
  if (bullets.length > 5) simplicity -= (bullets.length - 5) * 8;
  if (steps.length > 6) simplicity -= (steps.length - 6) * 6;
  if (visuals.length > 1) simplicity -= (visuals.length - 1) * 12;
  if (simplicity < 80) notes.push("Keep one main idea and one dominant visual per slide.");

  let consistency = 100;
  const bulletPunctuation = bullets.map((bullet) => /[.!?]$/.test(bullet.trim()));
  if (bulletPunctuation.some(Boolean) && bulletPunctuation.some((value) => !value)) consistency -= 14;
  if (slide.layoutType === "full-visual" && !visuals.length) consistency -= 25;
  if (slide.layoutType === "text-focus" && visuals.length > 1) consistency -= 18;
  if (consistency < 80) notes.push("Use consistent punctuation and match content to the selected layout.");

  let scale = 100;
  if (bodyWords > 110) scale -= Math.min(45, Math.ceil((bodyWords - 110) / 2));
  if (bullets.some((bullet) => words(bullet) > 22)) scale -= 12;
  if (titleWords > 10) scale -= 15;
  if (scale < 80) notes.push("Shorten text so the renderer can preserve readable type scale.");

  let typography = 100;
  if (titleWords > 9) typography -= Math.min(30, (titleWords - 9) * 5);
  if (slide.title && slide.title === slide.title.toUpperCase() && /[A-Z]{4}/.test(slide.title)) typography -= 18;
  if (bullets.some((bullet) => words(bullet) > 20)) typography -= 12;
  if ([content.keyIdea, content.explanation].some((value) => value && words(value) > 70)) typography -= 16;
  if (typography < 80) notes.push("Use concise sentence-case headings and shorter text measures.");

  const scores: DesignPrincipleScores = {
    consistency: clampScore(consistency),
    contrast: clampScore(contrast),
    hierarchy: clampScore(hierarchy),
    scale: clampScore(scale),
    simplicity: clampScore(simplicity),
    typography: clampScore(typography),
    whitespace: clampScore(whitespace)
  };
  const score = Math.round(
    designPrincipleKeys.reduce((total, key) => total + scores[key], 0) /
    designPrincipleKeys.length
  );
  return { notes: [...new Set(notes)], score, scores };
}

export function scoreSlideQuality(
  slide: SemanticSlideInput,
  findings: SlideValidationFinding[]
): SlideQualityScore {
  const breakdown: SlideQualityBreakdown = {
    consistency: 10,
    contentAccuracy: 25,
    instructionalUsefulness: 15,
    layoutBalance: 15,
    readability: 15,
    visualRelevance: 20
  };
  for (const finding of findings) {
    const rule = deductions[finding.code] ?? {};
    const repairMultiplier = finding.repaired ? 0.25 : 1;
    for (const [category, amount] of Object.entries(rule)) {
      const key = category as keyof SlideQualityBreakdown;
      breakdown[key] = Math.max(0, breakdown[key] - Math.ceil((amount ?? 0) * repairMultiplier));
    }
  }
  const instructionalScore = Object.values(breakdown).reduce((total, value) => total + value, 0);
  const design = assessSlideDesignPrinciples(slide);
  const score = Math.round(instructionalScore * 0.8 + design.score * 0.2);
  return {
    breakdown,
    designNotes: design.notes,
    designPrinciples: design.scores,
    designScore: design.score,
    score,
    slideId: slide.id ?? "slide"
  };
}

export function scoreDeckQuality(
  slides: SemanticSlideInput[],
  findingsBySlide: Map<string, SlideValidationFinding[]>
): DeckQualityScore {
  const scores = slides.map((slide) => scoreSlideQuality(slide, findingsBySlide.get(slide.id ?? "") ?? []));
  const average = scores.length
    ? Math.round((scores.reduce((total, score) => total + score.score, 0) / scores.length) * 10) / 10
    : 0;
  const minimum = scores.length ? Math.min(...scores.map((score) => score.score)) : 0;
  const designAverage = scores.length
    ? Math.round((scores.reduce((total, score) => total + score.designScore, 0) / scores.length) * 10) / 10
    : 0;
  const designPrinciples = Object.fromEntries(designPrincipleKeys.map((key) => [
    key,
    scores.length
      ? Math.round((scores.reduce((total, score) => total + score.designPrinciples[key], 0) / scores.length) * 10) / 10
      : 0
  ])) as DesignPrincipleScores;
  const reasons: string[] = [];
  if (minimum < 75) reasons.push(`At least one slide scored below 75 (minimum ${minimum}).`);
  if (average < 85) reasons.push(`Deck average is below 85 (average ${average}).`);
  if (designAverage < 80) reasons.push(`Deck design-principles average is below 80 (average ${designAverage}).`);
  for (const key of designPrincipleKeys) {
    if (designPrinciples[key] < 75) reasons.push(`${key[0].toUpperCase()}${key.slice(1)} is below the 75 design threshold (${designPrinciples[key]}).`);
  }
  const unresolvedErrors = [...findingsBySlide.values()].flat().filter((finding) => finding.severity === "error" && !finding.repaired);
  if (unresolvedErrors.length) reasons.push(`${unresolvedErrors.length} unresolved validation error${unresolvedErrors.length === 1 ? "" : "s"} remain.`);
  return {
    average,
    designAverage,
    designPrinciples,
    exportReady: minimum >= 75 && average >= 85 && designAverage >= 80 &&
      designPrincipleKeys.every((key) => designPrinciples[key] >= 75) &&
      unresolvedErrors.length === 0,
    minimum,
    reasons,
    slides: scores
  };
}

import type {
  DeckQualityScore,
  SemanticSlideInput,
  SlideQualityBreakdown,
  SlideQualityScore,
  SlideValidationFinding
} from "./types.ts";

const deductions: Record<string, Partial<Record<keyof SlideQualityBreakdown, number>>> = {
  answer_leakage: { instructionalUsefulness: 7, contentAccuracy: 3 },
  bullet_too_long: { readability: 2, layoutBalance: 2 },
  content_overflow: { readability: 5, layoutBalance: 5 },
  duplicate_content: { instructionalUsefulness: 3, consistency: 2 },
  generic_visual: { visualRelevance: 8, instructionalUsefulness: 3 },
  incomplete_sentence: { readability: 3, consistency: 2 },
  invalid_concept_node: { visualRelevance: 5, consistency: 1 },
  malformed_equation: { contentAccuracy: 12, consistency: 2 },
  missing_answer_key: { instructionalUsefulness: 10, contentAccuracy: 3 },
  missing_units: { contentAccuracy: 5, readability: 1 },
  missing_visual: { visualRelevance: 10, instructionalUsefulness: 3 },
  repeated_concept: { instructionalUsefulness: 3, consistency: 3 },
  title_too_long: { readability: 2, layoutBalance: 2 },
  too_many_bullets: { readability: 3, layoutBalance: 3 },
  unsupported_claim: { contentAccuracy: 8 },
  visual_content_mismatch: { visualRelevance: 12, contentAccuracy: 3 },
  visual_label_overflow: { readability: 2, layoutBalance: 2 }
};

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
  const score = Object.values(breakdown).reduce((total, value) => total + value, 0);
  return { breakdown, score, slideId: slide.id ?? "slide" };
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
  const reasons: string[] = [];
  if (minimum < 75) reasons.push(`At least one slide scored below 75 (minimum ${minimum}).`);
  if (average < 85) reasons.push(`Deck average is below 85 (average ${average}).`);
  const unresolvedErrors = [...findingsBySlide.values()].flat().filter((finding) => finding.severity === "error" && !finding.repaired);
  if (unresolvedErrors.length) reasons.push(`${unresolvedErrors.length} unresolved validation error${unresolvedErrors.length === 1 ? "" : "s"} remain.`);
  return {
    average,
    exportReady: minimum >= 75 && average >= 85 && unresolvedErrors.length === 0,
    minimum,
    reasons,
    slides: scores
  };
}

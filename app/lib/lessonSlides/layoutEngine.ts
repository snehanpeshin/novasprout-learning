import type { SemanticSlideInput } from "./types.ts";

export type PurposeLayout =
  | "cover-hero"
  | "diagram-dominant"
  | "equation-workspace"
  | "practice-split"
  | "text-focus"
  | "text-visual"
  | "vocabulary-grid";

export function selectPurposeLayout(slide: SemanticSlideInput): PurposeLayout {
  switch (slide.slideType) {
    case "lesson_cover":
      return "cover-hero";
    case "vocabulary":
      return "vocabulary-grid";
    case "labeled_diagram":
    case "comparison":
    case "process_or_sequence":
      return "diagram-dominant";
    case "worked_example":
    case "formula_reference":
      return "equation-workspace";
    case "guided_practice":
    case "independent_practice":
    case "knowledge_check":
      return "practice-split";
    case "learning_objectives":
    case "prerequisite_check":
    case "summary":
    case "next_steps":
      return "text-focus";
    default:
      return slide.visuals?.length ? "text-visual" : "text-focus";
  }
}

export function legacyLayoutType(layout: PurposeLayout) {
  if (layout === "cover-hero" || layout === "diagram-dominant") return "full-visual" as const;
  if (layout === "equation-workspace") return "equation-focus" as const;
  if (layout === "text-focus") return "text-focus" as const;
  return "text-visual" as const;
}

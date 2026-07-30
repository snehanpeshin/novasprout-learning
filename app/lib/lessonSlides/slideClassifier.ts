import type { SemanticSlideInput, SemanticSlideType } from "./types.ts";

const legacyTypeMap: Record<string, SemanticSlideType> = {
  answer_explanation: "knowledge_check",
  big_idea: "concept_explanation",
  comparison: "comparison",
  concept: "concept_explanation",
  data_display: "labeled_diagram",
  exit_ticket: "next_steps",
  guided_practice: "guided_practice",
  independent_practice: "independent_practice",
  labeled_diagram: "labeled_diagram",
  misconception: "misconception",
  prior_knowledge: "prerequisite_check",
  process: "process_or_sequence",
  roadmap: "learning_objectives",
  summary: "summary",
  title: "lesson_cover",
  vocabulary: "vocabulary",
  warm_up: "prerequisite_check",
  worked_example: "worked_example"
};

export function classifySlide(slide: SemanticSlideInput): SemanticSlideType {
  if (slide.slideType) return slide.slideType;
  const mapped = legacyTypeMap[slide.legacyType ?? ""];
  if (mapped === "concept_explanation" && slide.math?.length) return "formula_reference";
  return mapped ?? "concept_explanation";
}

export function slidePurpose(slideType: SemanticSlideType) {
  const purposes: Record<SemanticSlideType, string> = {
    comparison: "Distinguish two cases using explicit, meaningful criteria.",
    concept_explanation: "Teach one relationship with a concise explanation, example, and relevant model.",
    formula_reference: "Define a formula, its symbols, units, and when it applies.",
    guided_practice: "Apply the idea with a scaffolded decision or hint.",
    independent_practice: "Check transfer without revealing the solution.",
    knowledge_check: "Measure understanding while keeping answers in the answer key.",
    labeled_diagram: "Connect labels to exact components in a topic-specific model.",
    learning_objectives: "State measurable outcomes for the lesson.",
    lesson_cover: "Orient the learner to the topic, level, and lesson goals.",
    misconception: "Replace a tempting error with a more accurate reasoning pattern.",
    next_steps: "Use evidence from practice to choose the next learning step.",
    prerequisite_check: "Activate only the prior knowledge needed for this lesson.",
    process_or_sequence: "Trace a causal, temporal, or procedural sequence.",
    summary: "Retrieve and connect the lesson's most important ideas.",
    vocabulary: "Define the terms, symbols, and units needed for reasoning.",
    worked_example: "Model a complete solution from given information through a checked answer."
  };
  return purposes[slideType];
}

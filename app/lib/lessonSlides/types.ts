export type SemanticSlideType =
  | "lesson_cover"
  | "learning_objectives"
  | "vocabulary"
  | "prerequisite_check"
  | "concept_explanation"
  | "labeled_diagram"
  | "comparison"
  | "process_or_sequence"
  | "worked_example"
  | "formula_reference"
  | "guided_practice"
  | "independent_practice"
  | "misconception"
  | "knowledge_check"
  | "summary"
  | "next_steps";

export type VisualSelectionType =
  | "circuit_diagram"
  | "labeled_scientific_diagram"
  | "equation_flow"
  | "number_line"
  | "coordinate_graph"
  | "comparison_table"
  | "timeline"
  | "process_flow"
  | "concept_map"
  | "icon_grid"
  | "worked_solution"
  | "image_or_illustration"
  | "no_visual";

export type LearningObjective = {
  description: string;
  id: string;
  measurableVerb: string;
};

export type LearnerMetadata = {
  accessibilityNeeds?: string[];
  gradeLevel: string;
  lessonDurationMinutes: number;
  preferredModality?: "auditory" | "balanced" | "kinesthetic" | "visual";
  priorKnowledge?: string[];
  readingLevel?: string;
};

export type AssessmentKind =
  | "multiple_choice"
  | "short_answer"
  | "true_false"
  | "matching"
  | "diagram_labeling";

export type AssessmentDifficulty = "recall" | "interpret" | "substitute" | "compare" | "explain" | "apply";

export type AssessmentItem = {
  commonWrongAnswer: string;
  correctAnswer: string;
  difficulty: AssessmentDifficulty;
  explanation: string;
  hint?: string;
  id: string;
  kind: AssessmentKind;
  learningObjectiveId: string;
  misconceptionAddressed: string;
  options?: string[];
  question: string;
};

export type SpeakerNotes = {
  expectedResponse: string;
  learnerQuestion: string;
  misconceptionToWatchFor: string;
  narration: string;
  teachingObjective: string;
  transition: string;
};

export type TextFitRequest = {
  boxHeight: number;
  boxWidth: number;
  maxLines: number;
  minimumFontSize: number;
  preferredFontSize: number;
  text: string;
};

export type TextFitResult = {
  didShorten: boolean;
  fits: boolean;
  fontSize: number;
  lineCount: number;
  remainingText?: string;
  text: string;
};

export type SlideValidationCode =
  | "answer_leakage"
  | "bullet_too_long"
  | "content_overflow"
  | "duplicate_content"
  | "generic_visual"
  | "incomplete_sentence"
  | "invalid_concept_node"
  | "malformed_equation"
  | "missing_answer_key"
  | "missing_units"
  | "missing_visual"
  | "repeated_concept"
  | "title_too_long"
  | "too_many_bullets"
  | "unsupported_claim"
  | "visual_content_mismatch"
  | "visual_label_overflow";

export type SlideValidationFinding = {
  code: SlideValidationCode;
  message: string;
  repaired: boolean;
  severity: "error" | "warning";
};

export type ValidationResult<T> = {
  findings: SlideValidationFinding[];
  repaired: T;
  valid: boolean;
};

export type SlideQualityBreakdown = {
  consistency: number;
  contentAccuracy: number;
  instructionalUsefulness: number;
  layoutBalance: number;
  readability: number;
  visualRelevance: number;
};

export type SlideQualityScore = {
  breakdown: SlideQualityBreakdown;
  score: number;
  slideId: string;
};

export type DeckQualityScore = {
  average: number;
  exportReady: boolean;
  minimum: number;
  reasons: string[];
  slides: SlideQualityScore[];
};

export type SemanticSlideInput = {
  assessment?: AssessmentItem;
  estimatedMinutes?: number;
  id?: string;
  legacyType?: string;
  math?: Array<{ expression: string; meaning?: string; units?: string }>;
  slideType?: SemanticSlideType;
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
  visuals?: Array<{
    labels?: string[];
    steps?: string[];
    title?: string;
    type?: string;
  }>;
};

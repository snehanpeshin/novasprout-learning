import type {
  AssessmentDifficulty,
  AssessmentItem,
  AssessmentKind,
  SemanticSlideInput
} from "./types.ts";

const assessmentSequence: Array<{ difficulty: AssessmentDifficulty; kind: AssessmentKind }> = [
  { difficulty: "recall", kind: "short_answer" },
  { difficulty: "interpret", kind: "diagram_labeling" },
  { difficulty: "substitute", kind: "short_answer" },
  { difficulty: "compare", kind: "multiple_choice" },
  { difficulty: "explain", kind: "short_answer" },
  { difficulty: "apply", kind: "short_answer" }
];

function clean(value?: string, max = 400) {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function stripAnswerFromQuestion(value?: string) {
  return clean(value, 500)
    .replace(/\b(?:Answer|Solution|Correct answer)\s*:\s*[^]*$/i, "")
    .replace(/\b(?:Why|Explanation)\s*:\s*[^]*$/i, "")
    .trim();
}

function inferMisconception(question: string, answer: string, topic: string) {
  const lower = `${question} ${answer} ${topic}`.toLowerCase();
  if (/\bcircuit|current|battery|bulb\b/.test(lower)) return "Electric charge is used up by a component or can flow through an open path.";
  if (/\bseries|parallel\b/.test(lower)) return "Series and parallel connections change current and voltage in the same way.";
  if (/\bresistance|ohm\b/.test(lower)) return "Resistance can be compared without keeping voltage or current conditions in mind.";
  if (/\bratio|proportion\b/.test(lower)) return "Only one quantity needs the scale factor.";
  return `A surface-level response may name ${clean(topic, 80)} without explaining the relevant relationship.`;
}

function commonWrongAnswer(question: string, answer: string, topic: string) {
  const lower = `${question} ${topic}`.toLowerCase();
  if (/\bopen (?:switch|circuit)|gap|loose wire\b/.test(lower)) return "Current keeps flowing because the battery is still connected.";
  if (/\bcurrent\b/.test(lower)) return "Current is the energy stored in the battery.";
  if (/\bvoltage\b/.test(lower)) return "Voltage is the amount of charge used by a bulb.";
  if (/\bparallel\b/.test(lower)) return "A parallel circuit has only one path.";
  if (/\bseries\b/.test(lower)) return "Each series component receives the full source voltage independently.";
  return answer ? `A response that reverses or ignores the relationship in "${answer}".` : "A guess that does not use the lesson model.";
}

function defaultExplanation(answer: string, topic: string) {
  return answer
    ? `${answer} This follows from the relationship taught in the ${clean(topic, 80)} lesson.`
    : `A complete response should name the relevant ${clean(topic, 80)} idea and explain how the evidence supports it.`;
}

export function createAssessmentItem({
  index,
  learningObjectiveId,
  slide,
  topic
}: {
  index: number;
  learningObjectiveId: string;
  slide: SemanticSlideInput;
  topic: string;
}): AssessmentItem | undefined {
  const question = stripAnswerFromQuestion(slide.studentContent?.question);
  if (!question) return undefined;
  const sequence = assessmentSequence[index % assessmentSequence.length];
  const correctAnswer = clean(slide.studentContent?.answer, 360) || "Use the lesson model and show the relationship that supports your conclusion.";
  const explanation = defaultExplanation(correctAnswer, topic);
  return {
    commonWrongAnswer: commonWrongAnswer(question, correctAnswer, topic),
    correctAnswer,
    difficulty: sequence.difficulty,
    explanation,
    hint: clean(slide.studentContent?.hint, 220) || undefined,
    id: `${clean(slide.id, 80) || `assessment-${index + 1}`}-answer`,
    kind: sequence.kind,
    learningObjectiveId,
    misconceptionAddressed: inferMisconception(question, correctAnswer, topic),
    question
  };
}

export function assessmentAnswerKey(items: Array<AssessmentItem | undefined>) {
  return items.filter((item): item is AssessmentItem => Boolean(item));
}

export function hideAssessmentAnswer(slide: SemanticSlideInput) {
  const question = stripAnswerFromQuestion(slide.studentContent?.question);
  const explanation = clean(slide.studentContent?.explanation, 900);
  const answer = clean(slide.studentContent?.answer, 360);
  const safeExplanation = answer && explanation.toLowerCase().includes(answer.toLowerCase())
    ? explanation.split(/(?<=[.!?])\s+/).filter((sentence) => !sentence.toLowerCase().includes(answer.toLowerCase())).join(" ")
    : explanation;
  return {
    ...slide.studentContent,
    explanation: safeExplanation || undefined,
    question
  };
}

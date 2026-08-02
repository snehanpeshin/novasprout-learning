type LessonValidationResult = {
  issues: string[];
  valid: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasText(value: unknown, minimum = 1) {
  return typeof value === "string" && value.trim().length >= minimum;
}

function normalized(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, " ") : "";
}

function collectText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(collectText).join(" ");
  if (isRecord(value)) return Object.values(value).map(collectText).join(" ");
  return "";
}

export function validateGeneratedLesson(lesson: unknown): LessonValidationResult {
  const issues: string[] = [];
  if (!isRecord(lesson)) return { issues: ["Lesson output is not an object."], valid: false };

  if (!hasText(lesson.title, 3)) issues.push("Lesson title is missing or too short.");
  if (!hasText(lesson.conceptExplanation, 40)) issues.push("Concept explanation is incomplete.");
  if (!hasText(lesson.guidedExample, 25)) issues.push("Guided example is incomplete.");

  const objectives = Array.isArray(lesson.learningObjectives) ? lesson.learningObjectives : [];
  if (objectives.filter((item) => hasText(item, 8)).length < 2) {
    issues.push("At least two complete learning objectives are required.");
  }

  const segments = Array.isArray(lesson.fullLessonSegments) ? lesson.fullLessonSegments : [];
  if (segments.length < 1 || segments.some((segment) => !isRecord(segment) || !hasText(segment.title, 3) || !hasText(segment.activity, 20))) {
    issues.push("Lesson segments must include a title and student-facing teaching content.");
  }

  const visualPlan = Array.isArray(lesson.visualPlan) ? lesson.visualPlan : [];
  if (visualPlan.length < 2) {
    issues.push("The lesson needs an AI-designed visual strategy for its main learning moments.");
  } else if (visualPlan.some((direction) =>
    !isRecord(direction) ||
    !hasText(direction.anchor, 3) ||
    !hasText(direction.visualType, 3) ||
    !hasText(direction.educationalPurpose, 12) ||
    !hasText(direction.description, 12)
  )) {
    issues.push("Each visual direction needs a target, visual type, description, and educational purpose.");
  }

  const exam = lesson.timedExam;
  if (!isRecord(exam)) {
    issues.push("Timed quiz is missing.");
  } else {
    const duration = exam.durationMinutes;
    const passingScore = exam.passingScore;
    if (!Number.isInteger(duration) || Number(duration) < 1 || Number(duration) > 180) {
      issues.push("Quiz duration must be a whole number from 1 to 180 minutes.");
    }
    if (!Number.isInteger(passingScore) || Number(passingScore) < 0 || Number(passingScore) > 100) {
      issues.push("Quiz passing score must be a whole percentage from 0 to 100.");
    }

    const questions = Array.isArray(exam.questions) ? exam.questions : [];
    if (questions.length < 3 || questions.length > 12) {
      issues.push("Timed quiz must contain between 3 and 12 questions.");
    }
    const seenQuestions = new Set<string>();
    questions.forEach((question, index) => {
      const label = `Quiz question ${index + 1}`;
      if (!isRecord(question)) {
        issues.push(`${label} is malformed.`);
        return;
      }
      const questionText = normalized(question.question);
      if (questionText.length < 5) issues.push(`${label} is missing complete question text.`);
      if (questionText && seenQuestions.has(questionText)) issues.push(`${label} duplicates an earlier question.`);
      seenQuestions.add(questionText);

      const options = Array.isArray(question.options) ? question.options : [];
      if (options.length !== 4 || options.some((option) => !hasText(option))) {
        issues.push(`${label} must have exactly four non-empty choices.`);
      } else if (new Set(options.map(normalized)).size !== options.length) {
        issues.push(`${label} contains duplicate answer choices.`);
      }
      if (!Number.isInteger(question.answerIndex) || Number(question.answerIndex) < 0 || Number(question.answerIndex) >= options.length) {
        issues.push(`${label} has an invalid answer index.`);
      }
      if (!hasText(question.explanation, 8)) issues.push(`${label} needs an answer explanation.`);
    });
  }

  const allText = collectText(lesson).toLowerCase();
  const describesExperiment = /\b(?:experiment|laboratory|lab activity|hands-on activity|procedure)\b/.test(allText);
  const hasHazard = /\b(?:heat|flame|electricity|electric|chemical|acid|sharp|blade|biological|bacteria|microbe)\b/.test(allText);
  const hasSafetyDirection = /\b(?:safety|safe|adult supervision|teacher supervision|goggles|gloves|do not touch|unplug|low-voltage|wash hands)\b/.test(allText);
  if (describesExperiment && hasHazard && !hasSafetyDirection) {
    issues.push("A potentially hazardous experiment is missing a clear safety warning.");
  }

  return { issues: [...new Set(issues)], valid: issues.length === 0 };
}

/**
 * Only failures that make a lesson unsafe or structurally unusable should
 * stop delivery. Other findings are returned as advisory quality warnings.
 */
export function criticalLessonValidationIssues(issues: string[]) {
  const criticalPattern = /lesson output is not an object|lesson title is missing|concept explanation is incomplete|guided example is incomplete|lesson segments must include|timed quiz is missing|quiz question \d+ is malformed|quiz question \d+ must have exactly four|quiz question \d+ has an invalid answer index|potentially hazardous experiment is missing/i;

  return issues.filter((issue) => criticalPattern.test(issue));
}

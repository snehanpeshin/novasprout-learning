import { slidePurpose } from "./slideClassifier.ts";
import type { SemanticSlideInput, SemanticSlideType, SpeakerNotes } from "./types.ts";

function clean(value?: string, max = 360) {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function createSpeakerNotes({
  nextSlideTitle,
  slide,
  slideType,
  topic
}: {
  nextSlideTitle?: string;
  slide: SemanticSlideInput;
  slideType: SemanticSlideType;
  topic: string;
}): SpeakerNotes {
  const content = slide.studentContent ?? {};
  const mainIdea = clean(content.keyIdea || content.explanation || content.bullets?.[0] || slide.title, 280);
  const learnerQuestion = clean(
    content.question ||
    slide.assessment?.question ||
    `How would you explain the main relationship on this slide in your own words?`,
    260
  );
  return {
    expectedResponse: clean(slide.assessment?.correctAnswer || mainIdea || `A response that correctly connects the evidence to ${topic}.`, 300),
    learnerQuestion,
    misconceptionToWatchFor: clean(
      slide.assessment?.misconceptionAddressed ||
      `Watch for a definition-only answer that does not explain how the ideas are related.`,
      280
    ),
    narration: clean(
      mainIdea
        ? `${mainIdea} Pause after the visual or example so the learner can describe what changes and what stays constant.`
        : `Introduce ${topic} with one concrete example, then connect the example to the visual.`,
      500
    ),
    teachingObjective: slidePurpose(slideType),
    transition: nextSlideTitle
      ? `Connect this idea to the next slide, "${clean(nextSlideTitle, 90)}".`
      : "Close by asking the learner to name one useful next step."
  };
}

export function speakerNotesText(notes: SpeakerNotes) {
  return [
    `Objective: ${notes.teachingObjective}`,
    `Narration: ${notes.narration}`,
    `Ask: ${notes.learnerQuestion}`,
    `Expected response: ${notes.expectedResponse}`,
    `Watch for: ${notes.misconceptionToWatchFor}`,
    `Transition: ${notes.transition}`
  ].join("\n");
}

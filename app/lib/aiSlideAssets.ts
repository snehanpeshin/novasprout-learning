import type { AiVisualDirection } from "./lessonSlidePlan.ts";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "lesson-visual";
}

function titleMatchIndex(slideTitles: string[], targetTitle?: string) {
  const targetWords = new Set(
    cleanText(targetTitle, 100)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3)
  );
  if (!targetWords.size) return -1;

  return slideTitles
    .map((title, index) => ({
      index,
      score: title
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 3 && targetWords.has(word)).length
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)[0]?.index ?? -1;
}

function directionSlideNumber(direction: AiVisualDirection, slideTitles: string[], fallbackIndex: number) {
  const titleIndex = titleMatchIndex(slideTitles, direction.targetTitle);
  if (titleIndex >= 0) return titleIndex + 1;

  const anchor = cleanText(direction.anchor, 60).toLowerCase();
  const anchorPatterns: Array<[RegExp, RegExp]> = [
    [/cover|title|opening/, /lesson|learn|introduction|overview/i],
    [/big.idea|overview/, /big idea|overview/i],
    [/vocab|keyword/, /key words|vocabulary/i],
    [/warm/, /warm.?up/i],
    [/worked|example/, /example|worked/i],
    [/practice/, /practice|try it/i],
    [/assessment|quiz|check/, /check|quiz|assessment/i],
    [/summary|review/, /review|summary/i]
  ];
  const pattern = anchorPatterns.find(([anchorPattern]) => anchorPattern.test(anchor))?.[1];
  const anchorIndex = pattern ? slideTitles.findIndex((title) => pattern.test(title)) : -1;
  return anchorIndex >= 0 ? anchorIndex + 1 : Math.min(slideTitles.length, Math.max(1, fallbackIndex + 2));
}

export function assetsFromAiVisualPlan({
  grade,
  slideTitles,
  subject,
  topic,
  visualPlan
}: {
  grade: string;
  slideTitles: string[];
  subject: string;
  topic: string;
  visualPlan: AiVisualDirection[];
}) {
  const imageCandidates: Array<Record<string, string>> = [];
  const latexCandidates: Array<Record<string, string>> = [];
  const usedSlides = new Set<number>();

  for (const [index, direction] of visualPlan.entries()) {
    const visualType = cleanText(direction.visualType, 120);
    const normalizedType = visualType.toLowerCase();
    if (!visualType || /\b(?:none|no visual|text only|blank)\b/.test(normalizedType)) continue;

    const slideNumber = directionSlideNumber(direction, slideTitles, index);
    const targetTitle = cleanText(direction.targetTitle, 100) || slideTitles[slideNumber - 1] || topic;
    const description = cleanText(direction.description, 500);
    const purpose = cleanText(direction.educationalPurpose, 300);
    const labels = (direction.labels ?? []).map((label) => cleanText(label, 70)).filter(Boolean).slice(0, 10);
    const position = ["rb", "lb", "rm"][imageCandidates.length % 3];
    const id = `slide-${slideNumber}-${slug(targetTitle)}`;
    const needsGeneratedImage = /\b(?:anatom|cutaway|illustration|real.?world|photograph|map|geograph|spatial|3d|experiment|apparatus|physical object|organism|historical scene)\b/.test(normalizedType);

    if (needsGeneratedImage && !usedSlides.has(slideNumber)) {
      usedSlides.add(slideNumber);
      imageCandidates.push({
        assetId: id,
        alt: description || `Instructional ${visualType} for ${topic}.`,
        aspectRatio: /wide|landscape|timeline|map/.test(normalizedType) ? "16:9" : "4:3",
        caption: purpose,
        educationalPurpose: purpose || `Help the student understand ${targetTitle}.`,
        filename: `${id}.png`,
        latex: "",
        placement: `${slideNumber}${position}`,
        prompt: `${grade} ${subject} educational illustration about ${topic}. Create ${visualType}: ${description}. Show these essential parts and relationships accurately: ${labels.join(", ") || targetTitle}. Learning purpose: ${purpose}. Clear student-friendly textbook visual, strong hierarchy, uncluttered background, age-appropriate detail, accurate spatial relationships, no decorative elements, no embedded words, no labels, no watermark.`,
        type: "image"
      });
    }

    const equation = cleanText(direction.equation, 240);
    if (equation && /\b(?:equation|formula|derivation|symbolic|graph|quantitative|calculation)\b/.test(normalizedType)) {
      latexCandidates.push({
        assetId: `${id}-notation`,
        alt: `Mathematical notation supporting ${targetTitle}.`,
        aspectRatio: "4:3",
        caption: purpose,
        educationalPurpose: purpose || `Connect the notation to ${targetTitle}.`,
        filename: "",
        latex: equation,
        placement: `${slideNumber}${["cb", "rt", "lt"][latexCandidates.length % 3]}`,
        prompt: "",
        type: "latex"
      });
    }
  }

  return [...imageCandidates.slice(0, 3), ...latexCandidates.slice(0, 16)];
}

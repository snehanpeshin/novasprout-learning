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

const generatedImageVisual = /\b(?:anatom|biolog|cellular|cutaway|illustration|real.?world|photograph|map|geograph|spatial|3d|experiment|apparatus|physical object|organism|microscope|mitosis|chromosome|molecule|historical scene|battlefield|trench|animation|storyboard|life cycle|labeled system|stage sequence)\b/;
const programmaticVisual = /\b(?:equation|formula|derivation|symbolic|latex|number line|fraction bar|tape diagram|ratio bar|coordinate graph|plot|chart|data table|comparison table|venn|timeline|flowchart|code trace|circuit schematic)\b/;

function titleMatchIndex(slideTitles: string[], targetTitle?: string) {
  const targetWords = new Set(
    cleanText(targetTitle, 100)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3)
  );
  if (!targetWords.size) return -1;

  const titleWordSets = slideTitles.map((title) => new Set(
    title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3)
  ));
  const wordFrequency = new Map<string, number>();
  for (const words of titleWordSets) {
    for (const word of words) wordFrequency.set(word, (wordFrequency.get(word) ?? 0) + 1);
  }

  return titleWordSets
    .map((words, index) => ({
      index,
      score: [...words]
        .filter((word) => targetWords.has(word))
        .reduce((sum, word) => sum + 1 / (wordFrequency.get(word) ?? 1), 0)
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)[0]?.index ?? -1;
}

function directionSlideNumber(direction: AiVisualDirection, slideTitles: string[], fallbackIndex: number) {
  const anchor = cleanText(direction.anchor, 60).toLowerCase();
  if (/cover|title|opening/.test(anchor)) return 1;

  const titleIndex = titleMatchIndex(slideTitles, direction.targetTitle);
  if (titleIndex >= 0) return titleIndex + 1;

  const anchorPatterns: Array<[RegExp, RegExp]> = [
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
  const mathSubject = /\b(?:math|mathematics|algebra|geometry|statistics|calculus)\b/i.test(subject);

  for (const [index, direction] of visualPlan.entries()) {
    const visualType = cleanText(direction.visualType, 120);
    const normalizedType = visualType.toLowerCase();
    if (!visualType || /\b(?:none|no visual|text only|blank)\b/.test(normalizedType)) continue;

    const slideNumber = directionSlideNumber(direction, slideTitles, index);
    const targetTitle = cleanText(direction.targetTitle, 100) || slideTitles[slideNumber - 1] || topic;
    const description = cleanText(direction.description, 500);
    const purpose = cleanText(direction.educationalPurpose, 300);
    const labels = (direction.labels ?? []).map((label) => cleanText(label, 70)).filter(Boolean).slice(0, 10);
    const priority = cleanText(direction.priority, 30).toLowerCase();
    const position = ["rb", "lb", "rm"][imageCandidates.length % 3];
    const id = `slide-${slideNumber}-${slug(targetTitle)}`;
    const visualEvidence = `${normalizedType} ${description.toLowerCase()} ${targetTitle.toLowerCase()} ${labels.join(" ").toLowerCase()}`;
    const physicalSubject = /\b(?:science|biology|chemistry|physics|environment|geography|history|engineering|health)\b/i.test(subject);
    const needsGeneratedImage = !mathSubject && !programmaticVisual.test(normalizedType) && (
      generatedImageVisual.test(visualEvidence) ||
      physicalSubject && labels.length >= 3 && /\b(?:high|essential)\b/.test(priority)
    );
    const imageTextInstruction = "Do not draw words, letters, numbers, captions, callouts, leader lines, labels, or a watermark. Leave clean space where the slide renderer can add labels separately.";

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
        prompt: `Create a ${grade} ${subject} educational illustration about ${topic}. Visual structure: ${visualType}. Show this scene or system accurately: ${description}. Include these essential parts and relationships as visible shapes and spatial relationships, without printed labels: ${labels.join(", ") || targetTitle}. Learning purpose: ${purpose}. Clear student-friendly textbook visual, strong hierarchy, uncluttered background, age-appropriate detail, accurate spatial relationships, no decorative elements. ${imageTextInstruction}`,
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

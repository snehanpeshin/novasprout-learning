import type { ConceptGraph } from "./lessonEngine.ts";
import type { AiVisualDirection } from "./lessonSlidePlan.ts";

const bridgeMarker = "__novasprout_visual_plan_v1__";
const bridgeTarget = "__backend_compatibility__";
const maxDirections = 36;
const maxEncodedLength = 120_000;

type VisualPlanLesson = {
  conceptModel?: Partial<ConceptGraph>;
  visualPlan?: AiVisualDirection[];
};

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanList(value: unknown, maxItems: number, maxLength: number) {
  return Array.isArray(value)
    ? value.map((item) => cleanText(item, maxLength)).filter(Boolean).slice(0, maxItems)
    : [];
}

function sanitizeDirection(value: unknown): AiVisualDirection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const direction = value as Record<string, unknown>;
  const sanitized: AiVisualDirection = {
    anchor: cleanText(direction.anchor, 80),
    description: cleanText(direction.description, 600),
    educationalPurpose: cleanText(direction.educationalPurpose, 360),
    equation: cleanText(direction.equation, 280),
    labels: cleanList(direction.labels, 12, 80),
    layout: cleanText(direction.layout, 100),
    priority: cleanText(direction.priority, 40),
    steps: cleanList(direction.steps, 10, 140),
    targetTitle: cleanText(direction.targetTitle, 120),
    visualType: cleanText(direction.visualType, 140)
  };

  if (!sanitized.anchor || !sanitized.description || !sanitized.educationalPurpose || !sanitized.visualType) {
    return null;
  }
  return sanitized;
}

export function sanitizeVisualPlan(value: unknown): AiVisualDirection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(sanitizeDirection)
    .filter((direction): direction is AiVisualDirection => Boolean(direction))
    .slice(0, maxDirections);
}

function decodeVisualPlan(value: unknown) {
  const encoded = cleanText(value, maxEncodedLength + 1);
  if (!encoded || encoded.length > maxEncodedLength || !/^[A-Za-z0-9_-]+$/.test(encoded)) return [];

  try {
    return sanitizeVisualPlan(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")));
  } catch {
    return [];
  }
}

/**
 * Restores the visual plan carried by released app versions, then removes the
 * compatibility record before the concept graph reaches the lesson engine.
 */
export function restoreVisualPlanFromLesson<T extends VisualPlanLesson>(lesson: T): T {
  const conceptModel = lesson.conceptModel;
  const relationships = Array.isArray(conceptModel?.relationships) ? conceptModel.relationships : [];
  const bridgeRelationship = relationships.find((relationship) =>
    relationship?.from === bridgeMarker && relationship?.to === bridgeTarget
  );
  const cleanRelationships = relationships.filter((relationship) =>
    relationship?.from !== bridgeMarker || relationship?.to !== bridgeTarget
  );
  const explicitVisualPlan = sanitizeVisualPlan(lesson.visualPlan);
  const bridgedVisualPlan = decodeVisualPlan(bridgeRelationship?.explanation);

  return {
    ...lesson,
    ...(conceptModel
      ? { conceptModel: { ...conceptModel, relationships: cleanRelationships } }
      : {}),
    visualPlan: explicitVisualPlan.length ? explicitVisualPlan : bridgedVisualPlan
  };
}

/**
 * Stores the AI visual plan in a concept-model relationship that older App
 * Store builds already preserve when requesting assets and PDF compilation.
 */
export function bridgeVisualPlanIntoLesson<T extends VisualPlanLesson>(lesson: T): T {
  const restored = restoreVisualPlanFromLesson(lesson);
  const visualPlan = sanitizeVisualPlan(restored.visualPlan);
  if (!visualPlan.length) return restored;

  const conceptModel = restored.conceptModel ?? {};
  const encoded = Buffer.from(JSON.stringify(visualPlan), "utf8").toString("base64url");
  if (encoded.length > maxEncodedLength) return restored;

  return {
    ...restored,
    conceptModel: {
      ...conceptModel,
      assessmentTargets: Array.isArray(conceptModel.assessmentTargets) ? conceptModel.assessmentTargets : [],
      formulas: Array.isArray(conceptModel.formulas) ? conceptModel.formulas : [],
      misconceptions: Array.isArray(conceptModel.misconceptions) ? conceptModel.misconceptions : [],
      nodes: Array.isArray(conceptModel.nodes) ? conceptModel.nodes : [],
      relationships: [
        ...(Array.isArray(conceptModel.relationships) ? conceptModel.relationships : []),
        {
          explanation: encoded,
          from: bridgeMarker,
          relationship: "encodes",
          to: bridgeTarget
        }
      ]
    },
    visualPlan
  };
}


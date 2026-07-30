import { circuitDiagramLabelTexts } from "./circuitBinding.ts";
import type {
  CircuitProblem,
  DiagramBounds,
  DiagramCollision,
  DiagramElement,
  DiagramLayout
} from "./types.ts";

const defaultSafeBounds: DiagramBounds = { height: 500, width: 920, x: 20, y: 20 };
const minimumSeparation = 10;

function boxesOverlap(first: DiagramElement, second: DiagramElement, separation = minimumSeparation) {
  if (
    (first.kind === "component" && second.kind === "line") ||
    (first.kind === "line" && second.kind === "component") ||
    (first.kind === "line" && second.kind === "line")
  ) return false;
  return !(
    first.x + first.width + separation <= second.x ||
    second.x + second.width + separation <= first.x ||
    first.y + first.height + separation <= second.y ||
    second.y + second.height + separation <= first.y
  );
}

function overlapArea(first: DiagramElement, second: DiagramElement) {
  const width = Math.max(0, Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x));
  const height = Math.max(0, Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y));
  return Math.round(width * height);
}

export function detectVisualCollisions(elements: DiagramElement[]): DiagramCollision[] {
  const collisions: DiagramCollision[] = [];
  for (let firstIndex = 0; firstIndex < elements.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < elements.length; secondIndex += 1) {
      const first = elements[firstIndex];
      const second = elements[secondIndex];
      if (boxesOverlap(first, second)) {
        collisions.push({
          firstId: first.id,
          overlapArea: overlapArea(first, second),
          secondId: second.id
        });
      }
    }
  }
  return collisions;
}

export function elementsOutsideSafeBounds(elements: DiagramElement[], safeBounds: DiagramBounds) {
  return elements
    .filter((element) =>
      element.x < safeBounds.x ||
      element.y < safeBounds.y ||
      element.x + element.width > safeBounds.x + safeBounds.width ||
      element.y + element.height > safeBounds.y + safeBounds.height
    )
    .map((element) => element.id);
}

export function resolveLabelPlacement(elements: DiagramElement[], safeBounds: DiagramBounds = defaultSafeBounds) {
  const resolved = elements.map((element) => ({ ...element }));
  for (let pass = 0; pass < 12; pass += 1) {
    const collision = detectVisualCollisions(resolved)[0];
    if (!collision) break;
    const moving = resolved.find((element) => element.id === collision.secondId);
    if (!moving || moving.kind === "line" || moving.kind === "component") break;
    const nextY = moving.y + moving.height + minimumSeparation;
    moving.y = nextY + moving.height <= safeBounds.y + safeBounds.height
      ? nextY
      : Math.max(safeBounds.y, moving.y - moving.height - minimumSeparation);
  }
  return resolved;
}

function textWidth(text: string, minimum = 72, maximum = 190) {
  return Math.max(minimum, Math.min(maximum, 16 + text.length * 6.4));
}

function element(
  id: string,
  kind: DiagramElement["kind"],
  x: number,
  y: number,
  width: number,
  height: number,
  text?: string,
  sourceField?: string
): DiagramElement {
  return { height, id, kind, sourceField, text, width, x, y };
}

export function createCircuitDiagramLayout(
  problem: CircuitProblem,
  showSolution = problem.showSolution,
  safeBounds: DiagramBounds = defaultSafeBounds
): DiagramLayout {
  const elements: DiagramElement[] = [];
  const labels = circuitDiagramLabelTexts(problem, showSolution);
  const sourceLabel = labels.find((label) => label.sourceField === "sourceVoltage");
  elements.push(element("source-symbol", "component", 76, 188, 34, 104));
  elements.push(element("source-wire-top", "line", 110, 118, 730, 4));
  elements.push(element("source-wire-bottom", "line", 110, 322, 730, 4));
  if (sourceLabel) {
    elements.push(element("source-label", "label", 24, 52, 130, 38, sourceLabel.text, sourceLabel.sourceField));
  }

  const circuitComponents = problem.components.filter((component) => component.type !== "battery" && component.type !== "switch");
  if (problem.arrangement === "parallel") {
    const count = Math.max(1, circuitComponents.length);
    circuitComponents.forEach((component, index) => {
      const centerY = count === 1 ? 214 : 155 + index * (118 / Math.max(1, count - 1));
      const label = labels.find((candidate) => candidate.sourceField === `components.${component.id}`);
      elements.push(element(`${component.id}-branch`, "line", 275, centerY + 18, 410, 4));
      elements.push(element(`${component.id}-symbol`, "component", 420, centerY, 120, 40));
      elements.push(element(
        `${component.id}-label`,
        "label",
        390,
        centerY - 48,
        label ? textWidth(label.text, 110) : 110,
        28,
        label?.text ?? component.id,
        label?.sourceField ?? `components.${component.id}.id`
      ));
    });
  } else {
    const count = Math.max(1, circuitComponents.length);
    circuitComponents.forEach((component, index) => {
      const centerX = 300 + index * (330 / Math.max(1, count - 1));
      const label = labels.find((candidate) => candidate.sourceField === `components.${component.id}`);
      elements.push(element(`${component.id}-symbol`, "component", centerX - 55, 98, 110, 40));
      elements.push(element(
        `${component.id}-label`,
        "label",
        centerX - 80,
        42,
        label ? textWidth(label.text, 110) : 110,
        30,
        label?.text ?? component.id,
        label?.sourceField ?? `components.${component.id}.id`
      ));
    });
  }

  if (showSolution && problem.solution?.finalAnswers.length) {
    const answer = problem.solution.finalAnswers.join("   |   ");
    elements.push(element("solution", "solution", 210, 370, 540, 68, answer, "solution.finalAnswers"));
  } else if (problem.requestedQuantities.length) {
    elements.push(element(
      "task-caption",
      "caption",
      245,
      392,
      470,
      45,
      `Find: ${problem.requestedQuantities.join(" and ")}`,
      "requestedQuantities"
    ));
  }

  const resolved = resolveLabelPlacement(elements, safeBounds);
  return {
    collisions: detectVisualCollisions(resolved),
    elements: resolved,
    overflowElementIds: elementsOutsideSafeBounds(resolved, safeBounds),
    safeBounds
  };
}

export function diagramElementPosition(layout: DiagramLayout | undefined, id: string) {
  const target = layout?.elements.find((element) => element.id === id);
  if (!target) return undefined;
  const centerX = target.x + target.width / 2;
  const centerY = target.y + target.height / 2;
  return {
    x: Number((((centerX - 480) / 110)).toFixed(2)),
    y: Number((((270 - centerY) / 100)).toFixed(2))
  };
}

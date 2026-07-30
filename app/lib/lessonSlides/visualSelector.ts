import type { SemanticSlideInput, VisualSelectionType } from "./types.ts";

const weakConceptNodes = new Set([
  "and", "are", "check", "connected", "example", "find", "given", "has", "idea", "learn", "model",
  "notice", "practice", "review", "shows", "simple", "topic", "two", "whether"
]);

const isolatedVerbs = new Set([
  "calculate", "compare", "connect", "describe", "explain", "find", "identify", "learn", "notice", "show", "solve", "understand"
]);

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function isValidConceptNode(text: string, centralNode = "", existingNodes: string[] = []) {
  const normalized = normalize(text).toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "");
  if (!normalized || normalized.length < 3 || normalized.length > 48) return false;
  if (weakConceptNodes.has(normalized) || isolatedVerbs.has(normalized)) return false;
  if (/^(?:and|or|but|because|when|where|which|that)\b/.test(normalized)) return false;
  if (/^(?:is|are|has|have|shows?|finds?|connects?|uses?)\b/.test(normalized)) return false;
  if (normalize(centralNode).toLowerCase() === normalized) return false;
  if (existingNodes.map((node) => normalize(node).toLowerCase()).includes(normalized)) return false;
  return /[\p{L}\p{N}]/u.test(normalized);
}

function slideText(slide: SemanticSlideInput) {
  const content = slide.studentContent ?? {};
  return [
    slide.title,
    content.keyIdea,
    content.explanation,
    content.question,
    ...(content.bullets ?? []),
    ...(content.steps ?? [])
  ].filter(Boolean).join(" ").toLowerCase();
}

export function isElectricityContext(subject: string, topic: string) {
  const normalizedSubject = subject.toLowerCase();
  const normalizedTopic = topic.toLowerCase();
  const electricityTopic =
    /\b(electric|electricity|circuit|current|voltage|resistance|resistor|battery|ohm|voltmeter)\b/.test(normalizedTopic);
  const compatibleSubject =
    /\b(science|physics|engineering|stem)\b/.test(normalizedSubject) &&
    !/\b(social|history|civics|government|english|reading|writing|test preparation)\b/.test(normalizedSubject);
  return electricityTopic && compatibleSubject;
}

export function selectVisualType({
  slide,
  subject,
  topic
}: {
  slide: SemanticSlideInput;
  subject: string;
  topic: string;
}): VisualSelectionType {
  const text = `${subject} ${topic} ${slideText(slide)}`.toLowerCase();
  const type = slide.slideType;
  const electricity = isElectricityContext(subject, topic);
  const quantitativeContext =
    /\b(math|mathematics|algebra|geometry|statistics|data science|science|physics|chemistry)\b/i.test(subject) ||
    /\b(math|algebra|geometry|statistics|coordinate|graph|motion|temperature)\b/i.test(topic);

  if (type === "lesson_cover") return "image_or_illustration";
  if (type === "learning_objectives" || type === "next_steps") return "no_visual";
  if (type === "vocabulary") return "icon_grid";
  if (type === "worked_example") return "worked_solution";
  if (type === "formula_reference") return "equation_flow";
  if (electricity && (type === "independent_practice" || type === "guided_practice" || type === "knowledge_check")) return "circuit_diagram";
  if (electricity && /\b(series|parallel|compare|difference|versus|vs)\b/.test(text)) return "comparison_table";
  if (electricity) return "circuit_diagram";
  if (type === "comparison" || type === "misconception") return "comparison_table";
  if (type === "process_or_sequence") return /\b(year|century|era|timeline|chronolog)\b/.test(text) ? "timeline" : "process_flow";
  if (type === "labeled_diagram" || /\b(anatomy|organ|cell|digestive|ecosystem|structure)\b/.test(text)) return "labeled_scientific_diagram";
  if (/\b(number line|integer|fraction position)\b/.test(text)) return "number_line";
  if (
    quantitativeContext &&
    /\b(coordinate|graph|plot|axis|slope|rate of change|mathematical function|linear function)\b/.test(text)
  ) return "coordinate_graph";
  if (type === "concept_explanation" && /\b(cycle|stages|pathway|sequence|process)\b/.test(text)) return "process_flow";
  if (type === "concept_explanation" && /\b(relationship|system|connects to|causes|depends on)\b/.test(text)) return "concept_map";
  return "no_visual";
}

export function electricityVisualKind(slide: SemanticSlideInput) {
  const text = slideText(slide);
  if (/\bcircuit types?\b|\bvisual comparison\b/.test(text)) return "series_parallel_comparison";
  if (/\bseries\b.*\bparallel\b|\bparallel\b.*\bseries\b/.test(text)) return "series_parallel_comparison";
  if (/\bcurrent\b/.test(text) && /\bvoltage\b/.test(text) && /\bresistance\b/.test(text) && /\bpower\b/.test(text)) return "electric_relationships";
  if (/\bvoltmeter|voltage drop|across (?:the|a) component\b/.test(text)) return "voltmeter_circuit";
  if (/\bpower\b|p\s*=\s*v\s*i/.test(text)) return "electric_power";
  if (/\bohm|v\s*=\s*i\s*r|resistance.*current.*voltage/.test(text)) return "ohms_law";
  if (/\bparallel\b/.test(text)) return "parallel_circuit";
  if (/\bseries\b/.test(text)) return "series_circuit";
  if (/\bwhat does (?:a|the) battery provide\b|\bbattery terminals?\b/.test(text)) return "battery_symbol";
  if (/\bbattery symbol|long plate|short plate|positive terminal|negative terminal/.test(text)) return "battery_symbol";
  return "circuit_diagram";
}

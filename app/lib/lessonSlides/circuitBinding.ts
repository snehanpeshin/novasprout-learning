import type { LessonPlanSlide } from "../lessonSlidePlan.ts";
import type {
  CircuitComponent,
  CircuitProblem,
  CircuitRequestedQuantity,
  CircuitSolution,
  SemanticSlideInput,
  SlideValidationFinding
} from "./types.ts";

const numericPattern = String.raw`(\d+(?:\.\d+)?)`;
const resistanceUnitPattern = String.raw`(?:Ω|ohms?)`;
const studentQuestionTypes = new Set(["guided_practice", "independent_practice", "knowledge_check"]);

function normalize(value?: string) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function stripAnswerMaterial(value?: string) {
  return normalize(value)
    .replace(/\b(?:Answer|Solution|Correct answer)\s*:\s*[^]*$/i, "")
    .replace(/\b(?:Why|Explanation)\s*:\s*[^]*$/i, "")
    .trim();
}

function firstNumber(value: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1] && Number.isFinite(Number(match[1]))) return Number(match[1]);
  }
  return undefined;
}

function subscriptId(value: string) {
  const normalized = value
    .replace(/₀/g, "0")
    .replace(/₁/g, "1")
    .replace(/₂/g, "2")
    .replace(/₃/g, "3")
    .replace(/₄/g, "4")
    .replace(/₅/g, "5")
    .replace(/₆/g, "6")
    .replace(/₇/g, "7")
    .replace(/₈/g, "8")
    .replace(/₉/g, "9");
  return `R${normalized || "1"}`;
}

function requestedQuantities(question: string) {
  const quantities: CircuitRequestedQuantity[] = [];
  if (/\b(?:find|calculate|determine|what is|what are|what happens to)\b[^.?!]*\bcurrent\b|\bcurrent through\b/i.test(question)) quantities.push("current");
  if (/\b(?:find|calculate|determine|what is|what are|what happens to)\b[^.?!]*\bvoltage\b|\bvoltage across\b/i.test(question)) quantities.push("voltage");
  if (/\b(?:find|calculate|determine|what is|what are|what happens to)\b[^.?!]*\bresistance\b/i.test(question)) quantities.push("resistance");
  if (/\b(?:find|calculate|determine|what is|what are|what happens to)\b[^.?!]*\bpower\b/i.test(question)) quantities.push("power");
  return quantities.filter((quantity, index, all) => all.indexOf(quantity) === index);
}

function parseResistors(question: string) {
  const components: CircuitComponent[] = [];
  const labeled = new RegExp(String.raw`\bR\s*([₀₁₂₃₄₅₆₇₈₉0-9]+)\s*=\s*${numericPattern}\s*${resistanceUnitPattern}`, "gi");
  for (const match of question.matchAll(labeled)) {
    components.push({
      id: subscriptId(match[1]),
      resistanceOhms: Number(match[2]),
      type: "resistor"
    });
  }
  if (components.length) return components;

  const pair = question.match(new RegExp(
    String.raw`\b(?:two\s+)?resistors?(?:\s+of|\s+are|\s+with)?\s*${numericPattern}\s*${resistanceUnitPattern}\s*(?:and|,)\s*${numericPattern}\s*${resistanceUnitPattern}`,
    "i"
  ));
  if (pair) {
    return [
      { id: "R1", resistanceOhms: Number(pair[1]), type: "resistor" as const },
      { id: "R2", resistanceOhms: Number(pair[2]), type: "resistor" as const }
    ];
  }

  const valuesBeforeNoun = question.match(new RegExp(
    String.raw`\b${numericPattern}\s*${resistanceUnitPattern}\s*(?:and|,)\s*${numericPattern}\s*${resistanceUnitPattern}\s+resistors?\b`,
    "i"
  ));
  if (valuesBeforeNoun) {
    return [
      { id: "R1", resistanceOhms: Number(valuesBeforeNoun[1]), type: "resistor" as const },
      { id: "R2", resistanceOhms: Number(valuesBeforeNoun[2]), type: "resistor" as const }
    ];
  }

  const single = question.match(new RegExp(String.raw`\b${numericPattern}\s*${resistanceUnitPattern}\s+resistor\b`, "i"));
  if (single) {
    const first = { id: "R1", resistanceOhms: Number(single[1]), type: "resistor" as const };
    return /\banother\s+identical\s+resistor\b/i.test(question)
      ? [first, { ...first, id: "R2" }]
      : [first];
  }

  const bareValues = [...question.matchAll(new RegExp(
    String.raw`\b${numericPattern}\s*${resistanceUnitPattern}(?=\s|[.,;:!?]|$)`,
    "gi"
  ))].map((match) => Number(match[1]));
  if (bareValues.length && /\b(?:battery|source|circuit|connected)\b/i.test(question)) {
    return bareValues.slice(0, 3).map((resistanceOhms, index) => ({
      id: `R${index + 1}`,
      resistanceOhms,
      type: "resistor" as const
    }));
  }
  return [];
}

function requestedComponentId(question: string, components: CircuitComponent[]) {
  const explicit = question.match(/\b(?:through|across)\s+(?:the\s+)?R\s*([₀₁₂₃₄₅₆₇₈₉0-9]+)\b/i);
  if (explicit) return subscriptId(explicit[1]);
  const byResistance = question.match(new RegExp(
    String.raw`\b(?:through|across)\s+(?:the\s+)?${numericPattern}\s*${resistanceUnitPattern}`,
    "i"
  ));
  if (!byResistance) return undefined;
  const resistance = Number(byResistance[1]);
  return components.find((component) => component.resistanceOhms === resistance)?.id;
}

export function formatCircuitNumber(value: number) {
  if (!Number.isFinite(value)) return "";
  return Number(value.toFixed(4)).toString();
}

function ohms(value: number) {
  return `${formatCircuitNumber(value)} Ω`;
}

function volts(value: number) {
  return `${formatCircuitNumber(value)} V`;
}

function amps(value: number) {
  return `${formatCircuitNumber(value)} A`;
}

function watts(value: number) {
  return `${formatCircuitNumber(value)} W`;
}

function approximatelyEqual(left?: number, right?: number) {
  if (left === undefined || right === undefined) return left === right;
  return Math.abs(left - right) < 0.0001;
}

export function solveCircuitProblem(problem: CircuitProblem): CircuitSolution | undefined {
  const resistors = problem.components.filter(
    (component) => component.type === "resistor" && component.resistanceOhms !== undefined
  );
  const load = problem.components.find((component) => component.type === "lamp" || component.type === "device");
  const finalAnswers: string[] = [];
  const steps: string[] = [];

  if (load && problem.sourceVoltage !== undefined && problem.sourceCurrentAmps !== undefined) {
    const resistanceOhms = problem.sourceVoltage / problem.sourceCurrentAmps;
    const powerWatts = problem.sourceVoltage * problem.sourceCurrentAmps;
    steps.push(`GIVEN: V = ${volts(problem.sourceVoltage)}, I = ${amps(problem.sourceCurrentAmps)}.`);
    if (problem.requestedQuantities.includes("resistance")) {
      steps.push(`R = V / I = ${formatCircuitNumber(problem.sourceVoltage)} / ${formatCircuitNumber(problem.sourceCurrentAmps)} = ${ohms(resistanceOhms)}.`);
      finalAnswers.push(`R = ${ohms(resistanceOhms)}`);
    }
    if (problem.requestedQuantities.includes("power")) {
      steps.push(`P = V × I = ${formatCircuitNumber(problem.sourceVoltage)} × ${formatCircuitNumber(problem.sourceCurrentAmps)} = ${watts(powerWatts)}.`);
      finalAnswers.push(`P = ${watts(powerWatts)}`);
    }
    return { finalAnswers, powerWatts, resistanceOhms, steps };
  }

  if (!resistors.length || resistors.some((component) => component.resistanceOhms === undefined)) {
    return undefined;
  }

  const componentCurrentAmps: Record<string, number> = {};
  const componentVoltageVolts: Record<string, number> = {};
  let equivalentResistanceOhms: number;
  let totalCurrentAmps: number | undefined;

  if (problem.arrangement === "parallel") {
    equivalentResistanceOhms = 1 / resistors.reduce((sum, component) => sum + 1 / component.resistanceOhms!, 0);
    if (problem.sourceVoltage !== undefined) {
      for (const component of resistors) {
        componentCurrentAmps[component.id] = problem.sourceVoltage / component.resistanceOhms!;
        componentVoltageVolts[component.id] = problem.sourceVoltage;
      }
      totalCurrentAmps = Object.values(componentCurrentAmps).reduce((sum, current) => sum + current, 0);
    }
    steps.push(`GIVEN: ${problem.sourceVoltage !== undefined ? `V = ${volts(problem.sourceVoltage)}; ` : ""}${resistors.map((component) => `${component.id} = ${ohms(component.resistanceOhms!)}`).join(", ")} in parallel.`);
    steps.push(`1 / Rₑq = ${resistors.map((component) => `1 / ${formatCircuitNumber(component.resistanceOhms!)}`).join(" + ")}.`);
    steps.push(`Rₑq = ${ohms(equivalentResistanceOhms)}.`);
  } else {
    equivalentResistanceOhms = resistors.reduce((sum, component) => sum + component.resistanceOhms!, 0);
    if (problem.sourceVoltage !== undefined) {
      totalCurrentAmps = problem.sourceVoltage / equivalentResistanceOhms;
      for (const component of resistors) {
        componentCurrentAmps[component.id] = totalCurrentAmps;
        componentVoltageVolts[component.id] = totalCurrentAmps * component.resistanceOhms!;
      }
    }
    steps.push(`GIVEN: ${problem.sourceVoltage !== undefined ? `V = ${volts(problem.sourceVoltage)}; ` : ""}${resistors.map((component) => `${component.id} = ${ohms(component.resistanceOhms!)}`).join(", ")} in series.`);
    steps.push(`Rₑq = ${resistors.map((component) => ohms(component.resistanceOhms!)).join(" + ")} = ${ohms(equivalentResistanceOhms)}.`);
    if (problem.sourceVoltage !== undefined && totalCurrentAmps !== undefined) {
      steps.push(`I = V / Rₑq = ${formatCircuitNumber(problem.sourceVoltage)} / ${formatCircuitNumber(equivalentResistanceOhms)} = ${amps(totalCurrentAmps)}.`);
    }
  }

  if (problem.requestedQuantities.includes("resistance")) {
    finalAnswers.push(`Rₑq = ${ohms(equivalentResistanceOhms)}`);
  }
  if (problem.requestedQuantities.includes("current")) {
    const requestedId = problem.requestedComponentId;
    if (requestedId && componentCurrentAmps[requestedId] !== undefined) {
      finalAnswers.push(`I_${requestedId} = ${amps(componentCurrentAmps[requestedId])}`);
    } else if (totalCurrentAmps !== undefined) {
      finalAnswers.push(`I = ${amps(totalCurrentAmps)}`);
    }
  }
  if (problem.requestedQuantities.includes("voltage")) {
    const requestedId = problem.requestedComponentId;
    if (requestedId && componentVoltageVolts[requestedId] !== undefined) {
      if (problem.arrangement === "series" && totalCurrentAmps !== undefined) finalAnswers.push(`I = ${amps(totalCurrentAmps)}`);
      finalAnswers.push(`V_${requestedId} = ${volts(componentVoltageVolts[requestedId])}`);
      steps.push(`V_${requestedId} = I × ${requestedId} = ${formatCircuitNumber(totalCurrentAmps ?? 0)} × ${formatCircuitNumber(resistors.find((component) => component.id === requestedId)?.resistanceOhms ?? 0)} = ${volts(componentVoltageVolts[requestedId])}.`);
    }
  }
  if (problem.requestedQuantities.includes("power")) {
    if (problem.sourceVoltage === undefined || totalCurrentAmps === undefined) {
      return {
        componentCurrentAmps,
        componentVoltageVolts,
        equivalentResistanceOhms,
        finalAnswers,
        steps,
        totalCurrentAmps
      };
    }
    const powerWatts = problem.sourceVoltage * totalCurrentAmps;
    finalAnswers.push(`P = ${watts(powerWatts)}`);
    steps.push(`P = V × I = ${formatCircuitNumber(problem.sourceVoltage)} × ${formatCircuitNumber(totalCurrentAmps)} = ${watts(powerWatts)}.`);
  }

  return {
    componentCurrentAmps,
    componentVoltageVolts,
    equivalentResistanceOhms,
    finalAnswers,
    steps,
    totalCurrentAmps
  };
}

export function parseCircuitProblem(
  value: string,
  options: { showSolution: boolean; defaultArrangement?: CircuitProblem["arrangement"] } = { showSolution: false }
): CircuitProblem | undefined {
  const question = stripAnswerMaterial(value);
  const lower = question.toLowerCase();
  const arrangement: CircuitProblem["arrangement"] = /\bparallel\b/.test(lower)
    ? "parallel"
    : /\bmixed\b/.test(lower)
      ? "mixed"
      : /\bseries\b/.test(lower)
        ? "series"
        : options.defaultArrangement ?? "series";
  const sourceVoltage = firstNumber(question, [
    new RegExp(String.raw`\b${numericPattern}\s*V\s+(?:battery|source)\b`, "i"),
    new RegExp(String.raw`\b(?:battery|source)[^,.!?]{0,35}?${numericPattern}\s*V\b`, "i"),
    new RegExp(String.raw`\bacross\s+${numericPattern}\s*V\b`, "i"),
    new RegExp(String.raw`\bat\s+${numericPattern}\s*V\b`, "i"),
    new RegExp(String.raw`\b${numericPattern}\s*V\b`, "i")
  ]);
  const sourceCurrentAmps = firstNumber(question, [
    new RegExp(String.raw`\b(?:uses|draws?|carries?)\s+${numericPattern}\s*A\b`, "i"),
    new RegExp(String.raw`\b${numericPattern}\s*A\s+at\b`, "i"),
    new RegExp(String.raw`\b${numericPattern}\s*A\b`, "i")
  ]);
  const components = parseResistors(question);
  const load = question.match(/\b(lamp|device|appliance)\b/i)?.[1]?.toLowerCase();
  if (load) {
    components.push({
      currentAmps: sourceCurrentAmps,
      id: load === "lamp" ? "L1" : "D1",
      type: load === "lamp" ? "lamp" : "device",
      voltageVolts: sourceVoltage
    });
  }
  const quantities = requestedQuantities(question);
  const circuitLanguage = /\b(?:battery|circuit|resistor|lamp|voltage|current|resistance|power|series|parallel)\b/i.test(question);
  if (!circuitLanguage) return undefined;
  if (!components.length && !/\b(?:series|parallel|circuit)\b/i.test(question)) return undefined;

  const problem: CircuitProblem = {
    arrangement,
    components: components.length
      ? components
      : [
          { id: "R1", type: "resistor" },
          { id: "R2", type: "resistor" }
        ],
    question,
    requestedComponentId: requestedComponentId(question, components),
    requestedQuantities: quantities,
    requestedQuantity: quantities[0],
    showSolution: options.showSolution,
    sourceCurrentAmps,
    sourceVoltage
  };
  problem.solution = solveCircuitProblem(problem);
  return problem;
}

function slideQuestion(slide: SemanticSlideInput) {
  return normalize(
    slide.studentContent?.question ||
    slide.assessment?.question ||
    slide.studentContent?.explanation ||
    slide.studentContent?.steps?.join(" ")
  );
}

export function bindCircuitProblem(slide: SemanticSlideInput) {
  const showSolution = slide.slideType === "worked_example" && !studentQuestionTypes.has(slide.slideType ?? "");
  return parseCircuitProblem(slideQuestion(slide), {
    defaultArrangement: /\bparallel\b/i.test(slide.title ?? "") ? "parallel" : "series",
    showSolution
  });
}

export function circuitAnswerText(problem?: CircuitProblem) {
  return problem?.solution?.finalAnswers.join("; ") ?? "";
}

export function circuitDiagramLabelTexts(problem: CircuitProblem, showSolution = problem.showSolution) {
  const labels: Array<{ sourceField: string; text: string }> = [];
  if (problem.sourceVoltage !== undefined) labels.push({ sourceField: "sourceVoltage", text: `${volts(problem.sourceVoltage)} source` });
  if (problem.sourceCurrentAmps !== undefined) labels.push({ sourceField: "sourceCurrentAmps", text: `Given current ${amps(problem.sourceCurrentAmps)}` });
  for (const component of problem.components) {
    const values = [
      component.resistanceOhms !== undefined ? ohms(component.resistanceOhms) : "",
      component.voltageVolts !== undefined ? volts(component.voltageVolts) : "",
      component.currentAmps !== undefined ? amps(component.currentAmps) : ""
    ].filter(Boolean);
    labels.push({
      sourceField: `components.${component.id}`,
      text: values.length ? `${component.id} = ${values.join(", ")}` : component.id
    });
  }
  if (showSolution) {
    for (const answer of problem.solution?.finalAnswers ?? []) {
      labels.push({ sourceField: "solution.finalAnswers", text: answer });
    }
  }
  return labels;
}

function mismatch(
  message: string,
  offendingElement: string,
  expectedValue: string,
  actualValue: string
): SlideValidationFinding {
  return {
    actualValue,
    code: "semantic_value_mismatch",
    expectedValue,
    message,
    offendingElement,
    problemType: "circuit",
    repaired: false,
    severity: "error"
  };
}

export function validateCircuitSemanticConsistency(slide: LessonPlanSlide): SlideValidationFinding[] {
  const findings: SlideValidationFinding[] = [];
  const visual = slide.visuals.find((candidate) => candidate.diagramData?.kind === "circuit_problem");
  const problem = visual?.diagramData?.kind === "circuit_problem" ? visual.diagramData.circuit : undefined;
  if (!problem) return findings;

  const reparsed = parseCircuitProblem(problem.question, {
    defaultArrangement: problem.arrangement,
    showSolution: problem.showSolution
  });
  if (!reparsed) {
    findings.push(mismatch("The circuit question could not be rebound to structured diagram data.", "question", "A parseable circuit problem", problem.question));
    return findings;
  }
  if (reparsed.arrangement !== problem.arrangement) {
    findings.push(mismatch("Circuit arrangement disagrees with the question.", "arrangement", reparsed.arrangement, problem.arrangement));
  }
  if (!approximatelyEqual(reparsed.sourceVoltage, problem.sourceVoltage)) {
    findings.push(mismatch("Battery voltage disagrees with the question.", "sourceVoltage", String(reparsed.sourceVoltage), String(problem.sourceVoltage)));
  }
  const expectedResistors = reparsed.components.filter((component) => component.type === "resistor");
  const actualResistors = problem.components.filter((component) => component.type === "resistor");
  if (expectedResistors.length !== actualResistors.length) {
    findings.push(mismatch("The number of diagram resistors disagrees with the question.", "components", String(expectedResistors.length), String(actualResistors.length)));
  }
  for (const expected of expectedResistors) {
    const actual = actualResistors.find((component) => component.id === expected.id);
    if (!actual || !approximatelyEqual(actual.resistanceOhms, expected.resistanceOhms)) {
      findings.push(mismatch(
        `${expected.id} resistance disagrees with the question.`,
        expected.id,
        String(expected.resistanceOhms),
        String(actual?.resistanceOhms)
      ));
    }
  }

  for (const component of problem.components) {
    const label = visual?.labels?.find((candidate) => candidate.includes(component.id));
    if (!label) {
      findings.push(mismatch(
        `${component.id} is missing from the diagram labels.`,
        `${visual?.id ?? "visual"}.labels`,
        component.id,
        visual?.labels?.join(", ") ?? "none"
      ));
    }
  }

  const allowedUnitValues = new Set<string>();
  if (problem.sourceVoltage !== undefined) allowedUnitValues.add(`${formatCircuitNumber(problem.sourceVoltage)} V`);
  if (problem.sourceCurrentAmps !== undefined) allowedUnitValues.add(`${formatCircuitNumber(problem.sourceCurrentAmps)} A`);
  for (const component of problem.components) {
    if (component.resistanceOhms !== undefined) allowedUnitValues.add(`${formatCircuitNumber(component.resistanceOhms)} Ω`);
    if (component.voltageVolts !== undefined) allowedUnitValues.add(`${formatCircuitNumber(component.voltageVolts)} V`);
    if (component.currentAmps !== undefined) allowedUnitValues.add(`${formatCircuitNumber(component.currentAmps)} A`);
  }
  if (problem.showSolution) {
    for (const answer of problem.solution?.finalAnswers ?? []) {
      for (const match of answer.matchAll(/\d+(?:\.\d+)?\s*(?:V|A|Ω|W)(?=\s|[.,;:!?)]|$)/g)) {
        allowedUnitValues.add(normalize(match[0]));
      }
    }
  }
  const renderedText = [
    visual?.caption,
    visual?.equation,
    ...(visual?.labels ?? []),
    ...(visual?.steps ?? [])
  ].filter(Boolean).join(" ");
  for (const match of renderedText.matchAll(/\d+(?:\.\d+)?\s*(?:V|A|Ω|W)(?=\s|[.,;:!?)]|$)/g)) {
    const actual = normalize(match[0]);
    if (!allowedUnitValues.has(actual)) {
      findings.push(mismatch(
        "A diagram or equation value is not traceable to the current slide data.",
        visual?.id ?? "visual",
        [...allowedUnitValues].join(", ") || "No numeric labels",
        actual
      ));
    }
  }

  const recalculated = solveCircuitProblem(problem);
  if (problem.solution && recalculated) {
    if (!approximatelyEqual(problem.solution.equivalentResistanceOhms, recalculated.equivalentResistanceOhms)) {
      findings.push({
        actualValue: String(problem.solution.equivalentResistanceOhms),
        code: "calculation_error",
        expectedValue: String(recalculated.equivalentResistanceOhms),
        message: "Equivalent resistance is mathematically inconsistent.",
        offendingElement: "solution.equivalentResistanceOhms",
        problemType: "circuit",
        repaired: false,
        severity: "error"
      });
    }
    if (!approximatelyEqual(problem.solution.totalCurrentAmps, recalculated.totalCurrentAmps)) {
      findings.push({
        actualValue: String(problem.solution.totalCurrentAmps),
        code: "calculation_error",
        expectedValue: String(recalculated.totalCurrentAmps),
        message: "Calculated current is mathematically inconsistent.",
        offendingElement: "solution.totalCurrentAmps",
        problemType: "circuit",
        repaired: false,
        severity: "error"
      });
    }
  }

  const isStudentQuestion = studentQuestionTypes.has(slide.slideType) || slide.type === "warm_up";
  if (isStudentQuestion && problem.showSolution) {
    findings.push({
      actualValue: "showSolution=true",
      automaticCorrection: "Set showSolution to false for learner-facing activity slides.",
      code: "answer_leakage",
      expectedValue: "showSolution=false",
      message: "Student-facing circuit visual exposes its solution.",
      offendingElement: "diagramData.circuit.showSolution",
      problemType: "circuit",
      repaired: false,
      severity: "error"
    });
  }
  const expectedAnswer = circuitAnswerText(problem);
  if (slide.assessment && expectedAnswer && normalize(slide.assessment.correctAnswer) !== normalize(expectedAnswer)) {
    findings.push(mismatch(
      "Answer-key values disagree with the circuit solution.",
      "assessment.correctAnswer",
      expectedAnswer,
      slide.assessment.correctAnswer
    ));
  }
  return findings;
}

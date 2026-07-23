export type MathVariable = {
  definition: string;
  symbol: string;
  units?: string;
  value?: number;
};

export type EquationSpec = {
  assumptions: string[];
  canonicalLatex: string;
  exactResult?: number;
  interpretation: string;
  roundedResult?: number;
  semanticExpression: string;
  units?: string;
  variables: MathVariable[];
};

export type MathValidationFinding = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type ConfidenceIntervalResult = {
  center: number;
  confidenceLevel: number;
  criticalValue: number;
  lower: number;
  margin: number;
  standardError: number;
  upper: number;
};

const forbiddenLatex = /\\(?:input|include|write|read|openout|openin|usepackage|documentclass|begin|end)\b/i;
const rawNotationWords = /\b(?:micro|sigma symbol|square root n|x bar)\b/i;

export function canonicalizeMathExpression(value: string) {
  return value
    .normalize("NFC")
    .replace(/x\u0304|x̄/g, "\\bar{x}")
    .replace(/μ/g, "\\mu")
    .replace(/σ²/g, "\\sigma^2")
    .replace(/σ/g, "\\sigma")
    .replace(/√\s*\(?\s*n\s*\)?/gi, "\\sqrt{n}")
    .replace(/√\s*\(?\s*([A-Za-z0-9]+)\s*\)?/g, "\\sqrt{$1}")
    .replace(/±/g, "\\pm")
    .replace(/≥/g, "\\ge")
    .replace(/≤/g, "\\le")
    .replace(/≠/g, "\\ne")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateCanonicalLatex(expression: string) {
  const findings: MathValidationFinding[] = [];
  const latex = canonicalizeMathExpression(expression);
  let braceDepth = 0;
  let dollarDepth = 0;

  for (const character of latex) {
    if (character === "{") braceDepth += 1;
    if (character === "}") braceDepth -= 1;
    if (character === "$") dollarDepth += 1;
    if (braceDepth < 0) {
      findings.push({ code: "unbalanced_delimiter", message: "Equation has an unmatched closing brace.", severity: "error" });
      break;
    }
  }
  if (!latex) findings.push({ code: "empty_equation", message: "Equation is empty.", severity: "error" });
  if (braceDepth !== 0) findings.push({ code: "unbalanced_delimiter", message: "Equation has unmatched braces.", severity: "error" });
  if (dollarDepth % 2 !== 0) findings.push({ code: "unbalanced_math_environment", message: "Equation has an unmatched math delimiter.", severity: "error" });
  if (forbiddenLatex.test(latex)) findings.push({ code: "forbidden_latex", message: "Equation contains a forbidden LaTeX command.", severity: "error" });
  if (rawNotationWords.test(latex)) findings.push({ code: "corrupted_notation", message: "Equation contains a natural-language replacement for mathematical notation.", severity: "error" });
  if (/\\frac\s*\{\s*\}\s*\{/.test(latex) || /\\frac\s*\{[^}]+\}\s*\{\s*\}/.test(latex)) {
    findings.push({ code: "missing_fraction_part", message: "Equation has an empty numerator or denominator.", severity: "error" });
  }
  return { canonicalLatex: latex, findings, valid: !findings.some((finding) => finding.severity === "error") };
}

export function validateEquationSpec(equation: EquationSpec) {
  const syntax = validateCanonicalLatex(equation.canonicalLatex);
  const findings = [...syntax.findings];
  const definedSymbols = new Set(equation.variables.map((variable) => canonicalizeMathExpression(variable.symbol)));
  const usedSymbols = extractEquationSymbols(syntax.canonicalLatex);

  for (const symbol of usedSymbols) {
    if (!definedSymbols.has(symbol) && !isBuiltInSymbol(symbol)) {
      findings.push({
        code: "undefined_variable",
        message: `Variable ${symbol} is used but not defined.`,
        severity: "error"
      });
    }
  }
  if (!equation.interpretation.trim()) {
    findings.push({ code: "missing_interpretation", message: "Equation needs a learner-facing interpretation.", severity: "error" });
  }
  if (equation.roundedResult !== undefined && equation.exactResult !== undefined && !Number.isFinite(equation.roundedResult)) {
    findings.push({ code: "invalid_rounded_result", message: "Rounded result is not finite.", severity: "error" });
  }
  return { canonicalLatex: syntax.canonicalLatex, findings, valid: !findings.some((finding) => finding.severity === "error") };
}

function extractEquationSymbols(expression: string) {
  const symbols = new Set<string>();
  const patterns = [
    /\\bar\{x\}/g,
    /\\operatorname\{SE\}\s*\(\s*\\bar\{x\}\s*\)/g,
    /\\mu/g,
    /\\sigma/g,
    /(?<![\\A-Za-z])n(?![A-Za-z])/g,
    /(?<![\\A-Za-z])s(?![A-Za-z])/g,
    /(?<![\\A-Za-z])z(?![A-Za-z])/g,
    /(?<![\\A-Za-z])t(?![A-Za-z])/g
  ];
  for (const pattern of patterns) {
    for (const match of expression.matchAll(pattern)) symbols.add(match[0].replace(/\s+/g, ""));
  }
  return symbols;
}

function isBuiltInSymbol(symbol: string) {
  return ["z", "t"].includes(symbol) || symbol.startsWith("\\operatorname{SE}");
}

export function mean(values: number[]) {
  requireNumericSample(values);
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function sampleVariance(values: number[]) {
  requireNumericSample(values, 2);
  const center = mean(values);
  return values.reduce((total, value) => total + (value - center) ** 2, 0) / (values.length - 1);
}

export function populationVariance(values: number[]) {
  requireNumericSample(values);
  const center = mean(values);
  return values.reduce((total, value) => total + (value - center) ** 2, 0) / values.length;
}

export function standardError(standardDeviation: number, sampleSize: number) {
  requirePositive(standardDeviation, "Standard deviation");
  requirePositiveInteger(sampleSize, "Sample size");
  return standardDeviation / Math.sqrt(sampleSize);
}

export function oneSampleZScore(sampleMean: number, populationMean: number, populationStandardDeviation: number, sampleSize: number) {
  return (sampleMean - populationMean) / standardError(populationStandardDeviation, sampleSize);
}

export function oneSampleTScore(sampleMean: number, populationMean: number, sampleStandardDeviation: number, sampleSize: number) {
  return (sampleMean - populationMean) / standardError(sampleStandardDeviation, sampleSize);
}

export function normalConfidenceInterval({
  confidenceLevel = 0.95,
  criticalValue = 1.96,
  populationStandardDeviation,
  sampleMean,
  sampleSize
}: {
  confidenceLevel?: number;
  criticalValue?: number;
  populationStandardDeviation: number;
  sampleMean: number;
  sampleSize: number;
}): ConfidenceIntervalResult {
  const se = standardError(populationStandardDeviation, sampleSize);
  const margin = criticalValue * se;
  return {
    center: sampleMean,
    confidenceLevel,
    criticalValue,
    lower: sampleMean - margin,
    margin,
    standardError: se,
    upper: sampleMean + margin
  };
}

export function isInsideInterval(value: number, lower: number, upper: number, inclusive = true) {
  if (![value, lower, upper].every(Number.isFinite) || lower > upper) {
    throw new Error("Interval values must be finite and ordered.");
  }
  return inclusive ? value >= lower && value <= upper : value > lower && value < upper;
}

export function normalCdf(z: number) {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const coefficients = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429];
  const erf = sign * (1 - (((((coefficients[4] * t + coefficients[3]) * t + coefficients[2]) * t + coefficients[1]) * t + coefficients[0]) * t) * Math.exp(-x * x));
  return 0.5 * (1 + erf);
}

export function validateIntervalStatement({
  claimedInside,
  lower,
  upper,
  value
}: {
  claimedInside: boolean;
  lower: number;
  upper: number;
  value: number;
}) {
  const actualInside = isInsideInterval(value, lower, upper);
  return {
    actualInside,
    valid: actualInside === claimedInside,
    message:
      actualInside === claimedInside
        ? `${value} is correctly described as ${actualInside ? "inside" : "outside"} (${lower}, ${upper}).`
        : `${value} is ${actualInside ? "inside" : "outside"} (${lower}, ${upper}), contradicting the stated interpretation.`
  };
}

export function validateProcedureChoice({
  populationStandardDeviationKnown,
  procedure,
  sampleSize
}: {
  populationStandardDeviationKnown: boolean;
  procedure: "t" | "z";
  sampleSize: number;
}) {
  requirePositiveInteger(sampleSize, "Sample size");
  if (populationStandardDeviationKnown && procedure === "z") return { valid: true, message: "Known population standard deviation supports a z-procedure." };
  if (!populationStandardDeviationKnown && procedure === "t") return { valid: true, message: `Unknown population standard deviation supports a t-procedure with ${sampleSize - 1} degrees of freedom.` };
  return {
    valid: false,
    message: populationStandardDeviationKnown
      ? "Population standard deviation is known; explain why a t-procedure is being used or use a z-procedure."
      : "Population standard deviation is unknown; use s/sqrt(n) with a t-procedure and n-1 degrees of freedom."
  };
}

export const bannedProductionInstructionPattern =
  /\b(?:draw (?:three|two|a|the)|place a|include (?:a|the) (?:normal-table )?snippet|transparent box|render (?:a|the)|insert (?:a|the) (?:diagram|image))\b/i;

export function findPrintedProductionInstructions(value: string) {
  return value
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => bannedProductionInstructionPattern.test(sentence));
}

function requireNumericSample(values: number[], minimumLength = 1) {
  if (values.length < minimumLength || !values.every(Number.isFinite)) {
    throw new Error(`A numeric sample with at least ${minimumLength} value${minimumLength === 1 ? "" : "s"} is required.`);
  }
}

function requirePositive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be positive.`);
}

function requirePositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${label} must be a positive integer.`);
}

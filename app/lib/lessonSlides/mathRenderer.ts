import { canonicalizeMathExpression, validateCanonicalLatex } from "../mathValidation.ts";

const subscriptMap: Record<string, string> = {
  "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
  "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9"
};

function normalizeSubscripts(value: string) {
  return value.replace(/([A-Za-z])([₀-₉]+)/g, (_, symbol: string, digits: string) => (
    `${symbol}_{${[...digits].map((digit) => subscriptMap[digit] ?? digit).join("")}}`
  ));
}

export function formatMathExpression(value: string) {
  return canonicalizeMathExpression(normalizeSubscripts(value.replace(/Rₑq/g, "R_{\\mathrm{eq}}")))
    .replace(/Ω/g, "\\Omega")
    .replace(/Δ/g, "\\Delta")
    .replace(/[×✕]/g, "\\times")
    .replace(/÷/g, "\\div")
    .replace(/\bR(?:eq|EQ)\b/g, "R_{\\mathrm{eq}}")
    .replace(/\b([0-9.]+)\s*ohms?\b/gi, "$1\\,\\Omega")
    .replace(/\b([0-9.]+)\s*([AVW])\b/g, "$1\\,\\mathrm{$2}")
    .replace(/\s*=\s*/g, " = ")
    .replace(/\s*\+\s*/g, " + ")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateFormattedMath(expression: string, units?: string) {
  const formatted = formatMathExpression(expression);
  const syntax = validateCanonicalLatex(formatted);
  const findings = [...syntax.findings];
  if (/\bR(?:_\{[^}]+\})?(?=\s|=|$)|resistan/i.test(formatted) && /\d/.test(formatted) && !/\\Omega|ohm/i.test(`${formatted} ${units ?? ""}`)) {
    findings.push({ code: "missing_resistance_unit", message: "Resistance values need ohm units.", severity: "error" as const });
  }
  if (/\bI\b/.test(formatted) && /=/.test(formatted) && /\d/.test(formatted) && !/\\mathrm\{A\}|amp/i.test(`${formatted} ${units ?? ""}`)) {
    findings.push({ code: "missing_current_unit", message: "Calculated current needs ampere units.", severity: "warning" as const });
  }
  return { canonicalLatex: formatted, findings, valid: !findings.some((finding) => finding.severity === "error") };
}

export const electricityFormulaSet = [
  {
    expression: "V = I R",
    meaning: "Voltage equals current multiplied by resistance.",
    units: "V in volts, I in amperes, R in ohms"
  },
  {
    expression: "I = \\frac{V}{R}",
    meaning: "Current equals voltage divided by resistance.",
    units: "I in amperes"
  },
  {
    expression: "R = \\frac{V}{I}",
    meaning: "Resistance equals voltage divided by current.",
    units: "R in ohms"
  },
  {
    expression: "P = V I",
    meaning: "Electrical power equals voltage multiplied by current.",
    units: "P in watts"
  }
];

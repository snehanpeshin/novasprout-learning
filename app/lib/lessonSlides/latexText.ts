export function normalizeVisibleMathText(value?: string) {
  return (value ?? "")
    .replace(/\\(?:dfrac|tfrac|frac)\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "$1/$2")
    .replace(/\\(?:left|right)\b/g, "")
    .replace(/\\(?:times|cdot)\b/g, " x ")
    .replace(/\\div\b/g, " / ")
    .replace(/\\(?:neq|ne)\b/g, " != ")
    .replace(/\\leq?\b/g, " <= ")
    .replace(/\\geq?\b/g, " >= ")
    .replace(/\\(?:[,;!]|quad\b|qquad\b)/g, " ")
    .replace(/\\[()[\]]/g, "")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function looksLikeDisplayMath(value?: string) {
  const expression = (value ?? "").trim();
  if (!expression || /[:;]/.test(expression)) return false;

  const words = expression.match(/[A-Za-z]{3,}/g) ?? [];
  const hasMathStructure = /\\(?:frac|dfrac|tfrac|sqrt|pi|theta|sum|int|log|ln|sin|cos|tan)\b|[_^=<>]|\d\s*[+*/^]\s*[A-Za-z\d(]|[A-Za-z\d)]\s*[-+]\s*\d/.test(expression);
  if (!hasMathStructure) return false;

  return words.length <= 4 || /\\(?:frac|dfrac|tfrac|sqrt)\b/.test(expression);
}

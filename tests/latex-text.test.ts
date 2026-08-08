import assert from "node:assert/strict";
import test from "node:test";

import { looksLikeDisplayMath, normalizeVisibleMathText } from "../app/lib/lessonSlides/latexText.ts";

test("converts common LaTeX fractions into readable learner-facing text", () => {
  assert.equal(normalizeVisibleMathText("Solve \\frac{7}{x} = \\dfrac{21}{9}"), "Solve 7/x = 21/9");
});

test("does not mistake instructional prose for a display equation", () => {
  assert.equal(looksLikeDisplayMath("Column 1: write the matching ratio"), false);
  assert.equal(looksLikeDisplayMath("Compare the same point"), false);
  assert.equal(looksLikeDisplayMath("3/2 = 12/8"), true);
  assert.equal(looksLikeDisplayMath(String.raw`\pi r^2`), true);
});

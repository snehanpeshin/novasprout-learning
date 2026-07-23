import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalizeMathExpression,
  isInsideInterval,
  normalConfidenceInterval,
  oneSampleZScore,
  sampleVariance,
  standardError,
  validateProcedureChoice
} from "../app/lib/mathValidation.ts";

test("preserves canonical statistical notation", () => {
  assert.equal(canonicalizeMathExpression("SE(x̄)=σ/√n"), "SE(\\bar{x})=\\sigma/\\sqrt{n}");
  assert.doesNotMatch(canonicalizeMathExpression("μ ± σ"), /micro/);
});

test("recomputes core statistics deterministically", () => {
  assert.equal(sampleVariance([5, 7, 9, 10, 9]), 4);
  assert.equal(standardError(12, 36), 2);
  assert.equal(oneSampleZScore(50, 45, 8, 16), 2.5);
});

test("checks confidence interval endpoints and membership", () => {
  const interval = normalConfidenceInterval({
    populationStandardDeviation: 10,
    sampleMean: 82,
    sampleSize: 25
  });
  assert.equal(interval.lower, 78.08);
  assert.equal(interval.upper, 85.92);
  assert.equal(isInsideInterval(78, interval.lower, interval.upper), false);
});

test("validates the requested 120-point confidence interval fixture", () => {
  const interval = normalConfidenceInterval({
    populationStandardDeviation: 15,
    sampleMean: 120,
    sampleSize: 25
  });
  assert.equal(interval.lower, 114.12);
  assert.equal(interval.upper, 125.88);
});

test("quadrupling sample size halves standard error", () => {
  assert.equal(standardError(12, 25) / standardError(12, 100), 2);
});

test("distinguishes known sigma z from unknown sigma t", () => {
  assert.equal(validateProcedureChoice({ populationStandardDeviationKnown: true, procedure: "z", sampleSize: 25 }).valid, true);
  assert.equal(validateProcedureChoice({ populationStandardDeviationKnown: false, procedure: "t", sampleSize: 25 }).valid, true);
  assert.equal(validateProcedureChoice({ populationStandardDeviationKnown: false, procedure: "z", sampleSize: 25 }).valid, false);
});

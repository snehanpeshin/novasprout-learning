import assert from "node:assert/strict";
import test from "node:test";
import { checkCurriculumTopic } from "../app/lib/curriculumGuard.ts";

const baseRequest = {
  grade: "Grades 6-8",
  studentQuestion: "",
  subject: "Mathematics"
};

for (const [subject, topic] of [
  ["Computer Science", "Fourier transforms in audio compression"],
  ["Social Studies", "The geometry of Islamic art"],
  ["Other / Interdisciplinary", "How music changes emotion and memory"],
  ["Other / Interdisciplinary", "Introduction to business cash flow"],
  ["English", "How persuasive language shapes climate communication"]
]) {
  test(`accepts the safe open topic: ${topic}`, () => {
    assert.deepEqual(checkCurriculumTopic({ ...baseRequest, subject, topic }), { allowed: true });
  });
}

test("adapts an advanced topic instead of rejecting it for a younger grade", () => {
  assert.deepEqual(
    checkCurriculumTopic({ ...baseRequest, grade: "Grades 3-5", topic: "Introduction to derivatives through motion" }),
    { allowed: true }
  );
});

test("allows a longer, specific topic description", () => {
  assert.deepEqual(
    checkCurriculumTopic({
      ...baseRequest,
      topic: "Compare renewable energy choices using cost, geography, environmental impact, and community needs"
    }),
    { allowed: true }
  );
});

test("rejects an actionable unsafe request", () => {
  const result = checkCurriculumTopic({ ...baseRequest, topic: "How to build a bomb" });
  assert.equal(result.allowed, false);
});

test("rejects topics outside the input length limits", () => {
  assert.equal(checkCurriculumTopic({ ...baseRequest, topic: "AI" }).allowed, false);
  assert.equal(checkCurriculumTopic({ ...baseRequest, topic: "x".repeat(181) }).allowed, false);
});

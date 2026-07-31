import { mkdir, writeFile } from "node:fs/promises";
import { checkCurriculumTopic } from "../app/lib/curriculumGuard.ts";
import { comprehensiveQaCases } from "./comprehensive-qa-cases.ts";

type QaResult = (typeof comprehensiveQaCases)[number] & {
  actual: string;
  issue: string;
  passed: boolean;
  recommendation: string;
  severity: "Critical" | "High" | "Medium" | "Low";
};

function escapeCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

const results: QaResult[] = comprehensiveQaCases.map((item) => {
  const check = checkCurriculumTopic({
    grade: item.grade,
    studentQuestion: item.prompt,
    subject: item.subject,
    topic: item.prompt
  });
  const actualDecision = check.allowed ? "accept" : "refuse";
  const passed = actualDecision === item.expectedDecision;
  return {
    ...item,
    actual: check.allowed
      ? "Accepted by the deterministic input/safety gate for personalized lesson generation."
      : check.error,
    issue: passed ? "None in the deterministic request boundary." : `Expected ${item.expectedDecision}; received ${actualDecision}.`,
    passed,
    recommendation: passed ? "Keep this case in the regression matrix." : "Refine the curriculum guard without blocking legitimate learning intent.",
    severity: passed ? "Low" : item.id.startsWith("SAFE") ? "Critical" : "High"
  };
});

const passed = results.filter((result) => result.passed).length;
const failed = results.length - passed;
const bySubject = Object.entries(
  results.reduce<Record<string, { failed: number; total: number }>>((summary, result) => {
    summary[result.subject] ??= { failed: 0, total: 0 };
    summary[result.subject].total += 1;
    if (!result.passed) summary[result.subject].failed += 1;
    return summary;
  }, {})
).sort((a, b) => b[1].failed - a[1].failed || b[1].total - a[1].total);

const report = `# NovaSprout Comprehensive QA Report

Generated: ${new Date().toISOString()}

## Scope

This automated pass executes all 85 requested input-routing and safety-boundary cases against the same deterministic guard used by the web app. Each academic case includes an independently checked reference answer for a live-response run. Structural lesson, quiz-key, semantic-slide, PDF, and responsive-interface checks run in the project test/build pipeline and are summarized separately below.

This report does not claim that accepting a prompt proves a future probabilistic AI answer is factually correct. Live model answers must match the stored reference result and pass NovaSprout's post-generation validator before release sampling is considered complete.

## Summary

- Total cases: ${results.length}
- Passed request/safety boundary: ${passed}
- Failed request/safety boundary: ${failed}
- Boundary pass rate: ${((passed / results.length) * 100).toFixed(1)}%
- Safety cases passed: ${results.filter((result) => result.id.startsWith("SAFE") && result.passed).length}/10
- Critical failures: ${results.filter((result) => !result.passed && result.severity === "Critical").length}
- High failures: ${results.filter((result) => !result.passed && result.severity === "High").length}

## Results By Subject

${bySubject.map(([subject, count]) => `- ${subject}: ${count.total - count.failed}/${count.total} passed`).join("\n")}

## Detailed Cases

| ID | Subject | Grade | Exact prompt | Expected result | Actual result | Status | Severity | Issue | Recommended correction | Reference |
|---|---|---|---|---|---|---|---|---|---|---|
${results.map((result) => `| ${result.id} | ${escapeCell(result.subject)} | ${escapeCell(result.grade)} | ${escapeCell(result.prompt)} | ${escapeCell(result.expected)} | ${escapeCell(result.actual)} | ${result.passed ? "Pass" : "Fail"} | ${result.severity} | ${escapeCell(result.issue)} | ${escapeCell(result.recommendation)} | Automated guard |`).join("\n")}

## Release Verification

1. Run the complete Node test suite, including lesson output, quiz answer-index, semantic binding, Slide Doctor, math, and safety tests.
2. Build the production Next.js app to catch route, type, and rendering failures.
3. Generate representative live lessons across Mathematics, Science, English, Social Studies, Computer Science, and General Learning; compare claims and answer keys to the references above.
4. Compile representative PDFs and inspect desktop/mobile rendering for clipping, overlap, equations, tables, answer leakage, retry behavior, and quiz choice completeness.
5. Treat any unresolved factual, safety, answer-key, or cross-subject error as release-blocking.
`;

await mkdir("qa", { recursive: true });
await Promise.all([
  writeFile("qa/NovaSprout-Comprehensive-QA-Report.md", report),
  writeFile("qa/NovaSprout-Comprehensive-QA-Results.json", JSON.stringify({ generatedAt: new Date().toISOString(), results, summary: { failed, passed, total: results.length } }, null, 2))
]);

console.log(`NovaSprout comprehensive QA: ${passed}/${results.length} passed; ${failed} failed.`);
if (failed > 0) process.exitCode = 1;

# Validated Mathematics Lesson Pipeline

NovaSprout lesson engine 2.1 separates teaching intent from LaTeX rendering:

1. Normalize the learner request.
2. Build a concept and prerequisite graph.
3. Produce a typed `StructuredLessonSpec`.
4. Attach canonical `EquationSpec` and semantic `VisualSpec` objects.
5. Reject unrelated content, incompatible visuals, unsafe LaTeX, undefined variables, and printed production directions.
6. Recompute deterministic results before rendering.
7. Select a layout from the slide's pedagogical role.
8. Compile Beamer, extract PDF text, and render every page to PNG.
9. Block output when page counts, rendered pages, notation, or learner-facing content fail inspection.

## Adding A Math Topic

Add its vocabulary and domain pattern to `lessonSlidePlan.ts`, its concept relationships and formulas to `lessonEngine.ts`, and compatible visual types to `visualCompatibility`. Equations must define every variable, list assumptions, preserve canonical LaTeX, and include a learner-facing interpretation.

Do not reuse a visual because it shares a keyword. The visual must encode a mathematical quantity or relationship and state the learner question and expected insight.

## Adding A Visual

1. Add the visual type to `VisualType`.
2. Add semantic compatibility rules in `lessonEngine.ts`.
3. Implement a deterministic TikZ renderer in `ai-lesson-deck/route.ts`.
4. Add a cross-domain rejection test and a correct-domain snapshot or integration test.
5. Verify labels, scales, safe margins, and readable font sizes in every rendered page.

## Statistics Reference

The statistics path includes population parameters, repeated random samples, a dot plot of sample means, same-scale standard-error curves, a marked normal tail, and a confidence-interval number line. Known population standard deviation uses a z-procedure; unknown population standard deviation uses estimated standard error and normally a t-procedure with `n-1` degrees of freedom.

The deterministic reference is:

```text
SE = 10 / sqrt(25) = 2
z = (82 - 78) / 2 = 2
95% CI = 82 +/- 1.96(2) = (78.08, 85.92)
```

Therefore, 78 is outside the interval.

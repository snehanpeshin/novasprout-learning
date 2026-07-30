# NovaSprout Lesson Engine 3.0

The lesson engine uses one semantic lesson model for the web app, iOS app, and PDF export. Content generation, instructional planning, validation, and LaTeX rendering are separate stages.

## Generation pipeline

1. The request is normalized into grade, subject, topic, duration, depth, visual emphasis, practice intensity, language, output type, audience mode, and learner metadata.
2. The AI response produces lesson content and concept relationships before presentation markup.
3. `lessonSlidePlan.ts` converts legacy lesson responses into short slide intents so existing requests remain compatible.
4. `lessonPlanner.ts` finalizes every slide with an explicit semantic `slideType`, learning objective, visual specification, fitted content, assessment data, and speaker notes.
5. `visualSelector.ts` chooses a relevant visual from the slide's educational purpose. A concept map is selected only when its labeled relationships improve understanding.
6. `slideValidator.ts` repairs or reports overflow, incomplete sentences, duplicated content, weak concept nodes, malformed math, missing units, answer leakage, visual mismatches, and unsupported renderers.
7. `deckQualityScorer.ts` scores content accuracy, visual relevance, readability, balance, usefulness, and consistency.
8. `/api/ai-lesson-deck` renders purpose-built Beamer layouts and registered TikZ diagrams. Student output hides answers; teacher output can include the answer key with `audienceMode: "teacher"`.
9. Export is blocked unless every slide scores at least 75, the deck average is at least 85, equations validate, content fits, and every practice slide has an answer-key entry.

Programmatic visuals are the reliable baseline. AI-generated images remain optional enrichment and cannot make a lesson unavailable when image generation or compilation fails.

## Why the old output repeated itself

- Slide purpose was inferred from titles, so vague titles frequently fell through to one generic template.
- Keyword extraction treated filler words and fragments as concepts, producing low-value five-node maps.
- Visual requests were stored as prose rather than validated renderer specifications.
- Questions and answers shared free-form strings, which allowed answers to leak into student slides.
- Ordinary string normalization removed symbols and spacing from mathematical expressions.
- One general text-plus-graphic layout compressed important content while leaving unused space.
- There was no deck-wide quality gate before PDF compilation.

LessonSlidePlan v3 removes those failure modes with explicit slide types, structured assessments, a renderer registry, deterministic fitting, math-aware formatting, and a score-based export gate.

## Core modules

- `lessonPlanner.ts`: semantic finalization and subject-aware slide materialization.
- `slideClassifier.ts`: backward-compatible classification of legacy slide intents.
- `contentCompressor.ts`: deterministic title and body fitting at sentence boundaries.
- `visualSelector.ts`: purpose-based visual selection and concept-node filtering.
- `layoutEngine.ts`: layout budgets and hierarchy for each semantic slide type.
- `diagramRendererRegistry.ts`: supported renderer catalog and subject extension point.
- `mathRenderer.ts`: symbols, units, subscripts, multiplication, and formula validation.
- `assessmentGenerator.ts`: recall-to-application progression and separate answer data.
- `speakerNotesGenerator.ts`: objective, narration, learner prompt, response, misconception, and transition.
- `slideValidator.ts`: repairable findings and blocking validation errors.
- `deckQualityScorer.ts`: slide and deck scoring against the export thresholds.

## Electricity acceptance deck

`tests/electricity-deck.test.ts` verifies a complete middle-school electricity lesson with:

- a topic-specific cover and vocabulary visual;
- charge, current, voltage, resistance, and power relationships;
- a correctly labeled closed circuit and battery polarity;
- conventional-current arrows;
- Ohm's law and preserved `Ω` and `Rₑq` notation;
- series, parallel, comparison, voltmeter, and power diagrams;
- six questions in recall-to-application order with hidden answers;
- speaker notes, answer-key entries, and passing quality scores;
- no generic filler-word maps or unrelated graphs.

## Adding a subject diagram

1. Add the renderer name to `VisualType` in `lessonSlidePlan.ts`.
2. Register the renderer and subject in `lessonSlides/diagramRendererRegistry.ts`.
3. Add the semantic selection rule to `lessonSlides/visualSelector.ts`.
4. Materialize the visual's typed data in `lessonSlides/lessonPlanner.ts`.
5. Add the TikZ or table renderer and dispatch case in `/api/ai-lesson-deck/route.ts`.
6. Add a subject fixture that asserts the renderer, required labels, formulas, notes, assessment integrity, and quality score.
7. Add or update a deterministic preview under `docs/previews/`.

Keep the visual renderer deterministic. A subject-specific diagram should use validated plan data and remain available when external image generation is unavailable.

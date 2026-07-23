# NovaSprout Lesson Engine 2.0

The lesson engine uses one canonical semantic model for the web app, iOS app, and PDF export.

1. The request is normalized into grade, subject, topic, duration, depth, visual emphasis, practice intensity, language, output type, and audience mode.
2. The AI response produces a concept graph before prose: nodes, directional relationships, formulas, misconceptions, and assessment targets.
3. The legacy lesson response is converted into short slide intents for backward compatibility.
4. `enhanceLessonPlan` assigns each slide one pedagogical purpose, a layout, structured math, and a relationship-driven visual.
5. Content is fitted at sentence boundaries against a layout-specific budget. Character ellipses are not used as a repair strategy.
6. The evaluator returns machine-readable findings for overflow, incomplete sentences, generic visuals, answer leakage, invalid formulas, filler, and near-duplicate slides.
7. Student PDF output hides hints and answers. Teacher output can include both by sending `audienceMode: "teacher"` to `/api/ai-lesson-deck`.

Programmatic visuals are the reliable baseline. AI-generated images remain optional enrichment and cannot make the lesson unavailable when image generation or compilation fails.

The Third Law regression fixture checks entropy-temperature behavior, low-temperature heat capacity, microstate comparison, cooling sequence, and structured equations. The same visual planner also selects graphs, processes, equations, and labeled systems for other subjects from semantic content instead of title keyword clouds.

# Video tutor review - October 12, 2026

Scope: personalized narrated animations, pedagogy, visual accuracy, controls, narration recovery, access ownership, quotas, server-side caching, exports, mobile layout and optional detailed illustrations.

## Findings and fixes

- Reopening a lesson regenerated narration and consumed the bounded allowance. Owner-scoped MP3 cache records now reuse clips up to 300 KB until the original ticket expires. Oversized clips retain the two-attempt fallback; browser retries reuse already decoded clips.
- Playback had no scene navigation, timing display, adjustable pace or reflection pauses. Added a keyboard-operable progress slider, scene buttons, slower/normal/faster playback, and optional pauses between scenes. The audio engine clock drives both sound and animation.
- Skipping or changing speed could produce an incomplete export. Partial recording is discarded; complete normal-speed playback from the beginning creates a downloadable MP4/WebM. Pause/resume remains supported. Download validation found duplicate timestamps in Chrome MP4 after a reflection pause, so WebM is preferred where supported; a dedicated paused WebM export decoded without timestamp errors. MP4 remains a fallback for browsers without WebM support. Unsupported export formats keep transcript and playback usable.
- Narration sometimes described word animations that the renderer could not show. Instructions now state renderer capabilities explicitly and ask for prediction, concrete examples, worked reasoning and misconception checks. Source language is preserved. A video covers one core idea; the written lesson covers the wider topic.
- Fraction-bar labels could accidentally accept negative or decimal expressions as positive fractions. These are rejected. Numeric visuals require the correct representation, and number lines now show ten equal intervals with an interval-size label. Comparisons with two valid proper fractions render equal-size whole bars, including older cached plans that selected generic cards. Text truncation is marked visibly.
- Wrong quiz answers immediately revealed the full answer. Learners now receive a retry/hint prompt, with an optional answer explanation. Correct-answer feedback still explains the reasoning.
- Concurrent storyboard requests could return different plans or a save error. The losing request returns the first saved plan and refunds its reservation.
- Added optional detailed AI illustrations for each scene, drawn from the server-owned storyboard. They accompany the exact diagram, appear in exports and can be viewed at full size. Images are automatically moderated by OpenAI, bounded before storage, owner-scoped and temporary. Client prompts cannot alter their subject matter. A real provider check measured the fast image model at 11.8 seconds versus 51 seconds for the earlier model, so the default is gpt-image-2.5-flare.

## Verification

- 190 automated lesson-engine, access, billing, ownership, quota, cache and failure-recovery tests passed.
- Next.js production build and TypeScript validation passed. An existing CSS autoprefixer warning remains unrelated to this change.
- Six real OpenAI-backed cases passed: Grade 4 fraction addition, Grade 6 negative decimals, Grade 3 evaporation/condensation, Grade 2 action verbs, Grade 8 loops, Grade 7 river settlements. Each verified storyboard reuse, byte-identical cached narration, invalid-scene rejection and unauthorized access rejection.
- Desktop and 390-pixel mobile browser checks passed for four real scene illustrations, narration, speed changes, scene selection, reflection pauses, comprehension feedback, transcript and export. No page errors or horizontal overflow were observed. Eight diagram samples were rendered and visually reviewed.
- Source and generated narratives were reviewed against diagram labels and quantities. Fractions preserve one whole; negative decimals retain order; water vapor is distinguished from visible droplets; loops preserve item order; river-settlement claims are conditional rather than universal.

## Practical limits

Generated illustrations provide context and can still contain visual inaccuracies. Exact equations, counts and relationships remain in controlled diagrams. The review does not establish universal factual correctness or learning efficacy. Real Safari/iPhone hardware has not been tested. Pricing remains $2.99/lesson or $14.99/month for up to 20 lessons; no paid card transaction was performed during this review.

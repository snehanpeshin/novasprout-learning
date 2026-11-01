# Interactive tutor verification

The website now prioritizes a captioned learning journey over long text slides. Content remains available as an optional printable lesson.

- Lesson-engine tests: 165 pass, including decimal preservation, practice solution separation, sequence interleaving, narration ownership, provider failure restoration, and separate audio versus purchase limits.
- Production Next.js build and type checks pass.
- Desktop (1440px) and mobile (390px) browser checks pass: attempt gate, step reveal, walkthrough pause, hidden practice answers, quiz feedback, no horizontal overflow or page errors.
- Real OpenAI test: Grade 5 decimal place-value lesson, six quiz questions, zero validation warnings. Narration returned 163,968 bytes of audio/mpeg. Invalid step returns 400 and unauthenticated narration returns 401.
- Narration uses only server-verified lesson content, one visible step at a time. Browser playback and cached replay pass with a real audio clip; the learner attempt transfers into the coach form.

The walkthrough is a progressive browser animation, not a downloadable generated video. Typed practice uses self-comparison plus the optional AI coach; it is not automatically graded. No microphone recording is used.

## Bloom-inspired learning update — 2026-11-01

- 195 regression tests pass, including new first-attempt versus correction bookkeeping.
- Production build and type checks pass. Existing unrelated CSS autoprefixer warning remains.
- Desktop (1440 px) and mobile (390 px): all six sample quiz questions were deliberately answered incorrectly, blocked Next, and unlocked only after correction; the summary retained 0 first-try correct and 6 corrected.
- Homepage and concept page: approach section present, research limitation visible on expansion, no horizontal overflow. Mobile concept illustration sizing corrected.
- Next-day review questions separate prompts from optional answer comparisons.
- New coach and generator instructions were inspected; no paid live AI generation was performed for this update. Prompt adherence and learning gains still require evaluation. No claim of a demonstrated two-sigma gain is made.

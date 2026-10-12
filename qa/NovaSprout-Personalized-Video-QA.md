# Personalized narrated video tutor QA — October 12, 2026

- 177 lesson-engine tests pass. New coverage checks source/ticket ownership, cache reuse, planning failure restoration, scene voice failure restoration, quotas, invalid diagrams, fraction representation, and source-derived answer keys.
- Real OpenAI math and English storyboards and narration pass; cached requests do not repeat planning. Invalid scenes return 400 and unauthenticated planning returns 401.
- A real browser session created a personalized fraction lesson, prepared four narrated animated scenes, paused/resumed playback, answered the check question, and downloaded an MP4. The exported 57.4-second H.264/AAC video decodes successfully; fraction frames were visually reviewed.
- Mobile playback/layout used the same verified plan and voice clips: no horizontal overflow or page errors.
- Shapes are explicit: bar explanations render bars, round wholes render circles, and numeric fraction comparisons use one unambiguous fraction per label. Number-line axes preserve source endpoint values.
- Provider credentials stay on the server. Plan cache entries are owner-bound and expire with the original lesson ticket. Fixed canvas renderers never execute generated code. Export records generated graphics and synthetic voice only.

The chosen format is personalized narrated animation using OpenAI, with a transcript, captions export, replay, and a comprehension check. It requires no Runway account. Browser export depends on MediaRecorder support and produces MP4 or WebM.

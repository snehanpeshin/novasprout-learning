"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Beaker,
  Bot,
  BookOpenCheck,
  Calculator,
  CheckCircle2,
  Clock,
  Code2,
  FileCode2,
  Images,
  LockKeyhole,
  Printer,
  TimerReset,
  Trophy,
  X,
  type LucideIcon
} from "lucide-react";
import { legacyLessonToSlidePlan } from "../lib/lessonSlidePlan";
import { contactEmail } from "../site-data";

type ExamQuestion = {
  answerIndex: number;
  explanation: string;
  options: string[];
  question: string;
};

type GeneratedLesson = {
  conceptExplanation?: string;
  customPlan?: {
    focusAreas?: string[];
    recommendedCadence?: string;
    summary?: string;
    weeklyPlan?: string[];
  };
  duration?: string;
  fullLessonSegments?: Array<{
    activity: string;
    time: string;
    title: string;
  }>;
  guidedExample?: string;
  learningObjectives?: string[];
  mode?: string;
  parentTutorNotes?: string;
  practiceQuestions?: string[];
  prerequisiteCheck?: string[];
  quickAssessment?: string[];
  recommendedNextSession?: string;
  studentFit?: string;
  timedExam?: {
    durationMinutes: number;
    passingScore: number;
    questions: ExamQuestion[];
  };
  title?: string;
  warmUp?: string;
};

type LessonGenerationData = {
  error?: string;
  lesson?: GeneratedLesson;
  lessonText?: string;
  responseId?: string;
  status?: string;
  warning?: string;
};

type LessonSlide = {
  content: ReactNode;
  minutes: number;
  title: string;
  type?: "lesson" | "quiz";
  visualLabel?: string;
};

type LessonContext = {
  grade: string;
  subject: string;
  topic: string;
};

type SlideAsset = {
  assetId?: string;
  alt: string;
  aspectRatio?: string;
  caption?: string;
  dataUrl?: string;
  educationalPurpose?: string;
  filename?: string;
  latex: string;
  placement: string;
  prompt: string;
  type: "image" | "latex";
};

type CompiledDeck = {
  assetManifest?: Array<{ assetId?: string; filename: string; placement: string; type?: string }>;
  compilerStatus?: "compiled" | "compiler_missing" | "compile_failed" | "validation_failed";
  error?: string;
  pageCount?: number;
  pdfDataUrl?: string;
  pdfSize?: number;
  pdfUrl?: string;
  qualityChecks?: string[];
  qualityWarnings?: string[];
  tex?: string;
  validationErrors?: string[];
};

type SubjectTheme = {
  accent: string;
  deckLabel: string;
  icon: LucideIcon;
  key: "math" | "science" | "ela" | "coding";
  slideLabels: {
    concept: string;
    example: string;
    practice: string;
    warmUp: string;
  };
  visualHint: string;
};

const accessStorageKey = "novasprout_ai_access_token";
const lessonPollingIntervalMs = 2500;
const lessonPollingTimeoutMs = 300000;
const assetPlanningTimeoutMs = 285000;
const imageGenerationTimeoutMs = 285000;
const minimumBuildStageMs = {
  compile: 7000,
  images: 12000,
  latex: 1800,
  quality: 2500,
  visuals: 4500
};

const grades = [
  "Pre-K / Kindergarten",
  "Grades 1-2",
  "Grades 3-5",
  "Grades 6-8",
  "Grades 9-10",
  "Grades 11-12",
  "College / adult"
];

const subjects = [
  "Mathematics",
  "Science",
  "English",
  "Social Studies",
  "Computer Science",
  "Test Preparation"
];
const levels = ["Start from the basics", "Give me some support", "Teach at my grade level", "Challenge me"];
const goals = [
  "Concept clarity",
  "Homework help",
  "Prepare for a test",
  "Solve practice questions",
  "Build confidence",
  "Complete a school project"
];
const modes = [
  "Quick explanation",
  "Comprehensive lesson",
  "Homework help",
  "Exam preparation",
  "Practice worksheet",
  "Interactive quiz"
];
const durations = [
  "20-minute lesson",
  "30-minute lesson",
  "45-minute comprehensive lesson",
  "60-minute deep lesson"
];
const teachingStyles = ["Simple and friendly", "Step-by-step", "Visual", "Exam-focused"];
const difficulties = ["Easy", "Standard", "Challenging", "Adaptive"];
const languages = ["English", "Hindi", "Spanish", "Bilingual", "Simplified English"];
const lessonIncludes = [
  "Key vocabulary",
  "Diagrams",
  "Worked examples",
  "Practice questions",
  "Interactive quiz",
  "Summary notes",
  "Common mistakes",
  "Live tutor option"
];
const topicSuggestionsBySubject: Record<string, string[]> = {
  Mathematics: ["Fractions", "Ratios and proportions", "Equations", "Geometry", "Graphing", "Probability", "Statistics", "Word problems"],
  Science: ["Digestive system", "Electricity", "Forces and motion", "Cells", "Ecosystems", "Matter", "Solar system", "Scientific method"],
  English: ["Reading comprehension", "Grammar", "Paragraph writing", "Essay writing", "Vocabulary", "Storytelling", "Main idea", "Evidence"],
  "Social Studies": ["Maps and geography", "Ancient civilizations", "Government", "Civics", "Economics", "World history", "Culture", "Current events"],
  "Computer Science": ["Computer basics", "Scratch", "Python", "HTML and CSS", "Algorithms", "AI basics", "Robotics", "Game development"],
  "Test Preparation": ["Timed practice", "Reading questions", "Math review", "Science review", "Essay planning", "Test strategy"]
};

function getSubjectTheme(subject: string): SubjectTheme {
  if (["Science", "Biology", "Chemistry", "Physics", "Environmental Studies", "Health Education"].includes(subject)) {
    return {
      accent: "Inquiry",
      deckLabel: "Science Lab Deck",
      icon: Beaker,
      key: "science",
      slideLabels: {
        concept: "Core science idea",
        example: "Observe an example",
        practice: "Apply the idea",
        warmUp: "Starter question"
      },
      visualHint: "Claim · Evidence · Reasoning"
    };
  }

  if (["English", "Languages", "Social Studies", "History", "Geography", "Civics", "Economics", "Psychology"].includes(subject)) {
    return {
      accent: "Read",
      deckLabel: "Study Skills Deck",
      icon: BookOpenCheck,
      key: "ela",
      slideLabels: {
        concept: "Strategy",
        example: "Model answer",
        practice: "Your turn",
        warmUp: "Focus prompt"
      },
      visualHint: "Read · Think · Explain"
    };
  }

  if (["Computer Science", "Coding", "Robotics", "Engineering"].includes(subject)) {
    return {
      accent: "Build",
      deckLabel: "Coding/Data Deck",
      icon: Code2,
      key: "coding",
      slideLabels: {
        concept: "Pattern to notice",
        example: "Trace the example",
        practice: "Build it",
        warmUp: "Debug warm-up"
      },
      visualHint: "Input → Process → Output"
    };
  }

  return {
    accent: "Solve",
    deckLabel: "Math Deck",
    icon: Calculator,
    key: "math",
    slideLabels: {
      concept: "Big math idea",
      example: "Worked example",
      practice: "Practice step",
      warmUp: "Number warm-up"
    },
    visualHint: "See it · Solve it · Check it"
  };
}

function countTextChunks(value?: string, maxLength = 360, maxChunks = 4) {
  return planningTextChunks(value, maxLength, maxChunks).length;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function readLessonApiResponse(response: Response): Promise<LessonGenerationData> {
  const responseText = await response.text();
  if (!responseText) return {};

  try {
    return JSON.parse(responseText) as LessonGenerationData;
  } catch {
    return {
      error: response.ok
        ? "The AI lesson service returned an unreadable response."
        : responseText.slice(0, 220) || "The hosting layer returned an unreadable error."
    };
  }
}

async function waitForMinimumElapsed(startedAt: number, minimumMs: number) {
  const remainingMs = minimumMs - (Date.now() - startedAt);
  if (remainingMs > 0) {
    await sleep(remainingMs);
  }
}

function planningTextChunks(value?: string, maxLength = 360, maxChunks = 4) {
  const text = (value ?? "").replace(/\s+/g, " ").trim();
  if (!text) {
    return [];
  }

  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  sentences.forEach((sentence) => {
    if (chunks.length >= maxChunks) {
      return;
    }

    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > maxLength && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = next;
    }
  });

  if (current && chunks.length < maxChunks) {
    chunks.push(current);
  }

  return chunks.length ? chunks : [text.slice(0, maxLength)];
}

function planningTeachingTitle(prefix: string, text: string, index: number) {
  const words = text
    .replace(/[^\w\s:+\-/%]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 7)
    .join(" ");
  return words ? `${prefix}: ${words}` : `${prefix} ${index + 1}`;
}

function countItemChunks(items?: string[], size = 3, maxChunks = 4) {
  const count = (items ?? []).filter((item) => item.trim()).length;
  return Math.min(maxChunks, Math.ceil(count / size));
}

function subjectVisualTitles(subject: string, topic?: string) {
  const normalizedSubject = subject.toLowerCase();
  if (["science", "biology", "health education"].includes(normalizedSubject) && topic?.toLowerCase().includes("digestive")) {
    return ["Digestive System Map", "Mechanical vs Chemical Digestion"];
  }
  if (["science", "biology", "chemistry", "physics", "environmental studies", "health education"].includes(normalizedSubject)) {
    return ["Visual Reasoning Model"];
  }
  if (["english", "languages", "social studies", "history", "geography", "civics", "economics", "psychology"].includes(normalizedSubject)) {
    return ["Study Strategy Map"];
  }
  if (["computer science", "coding", "robotics", "engineering"].includes(normalizedSubject)) {
    return ["Input Process Output"];
  }
  return ["Visual Model", "Equation Walkthrough"];
}

function pdfDeckPlanningTitles(lesson: GeneratedLesson, context: LessonContext) {
  return legacyLessonToSlidePlan({ context, lesson }).slides.map((slide) => slide.title);
}

function LessonSection({
  children,
  label,
  time
}: {
  children: ReactNode;
  label: string;
  time?: string;
}) {
  return (
    <div>
      {time ? <span>{time}</span> : null}
      <strong>{label}</strong>
      {children}
    </div>
  );
}

function ListBlock({ items }: { items?: string[] }) {
  if (!items?.length) {
    return null;
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function SubjectLearningCard({
  children,
  label,
  theme
}: {
  children: ReactNode;
  label: string;
  theme: SubjectTheme;
}) {
  const Icon = theme.icon;

  return (
    <div className={`subject-learning-card ${theme.key}`}>
      <div className="subject-learning-visual">
        <Icon aria-hidden="true" size={34} />
        <span>{label}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function parseSlideMinutes(time?: string) {
  const matches = time?.match(/\d+/g)?.map(Number) ?? [];
  if (matches.length >= 2) {
    return Math.max(3, matches[1] - matches[0]);
  }

  return matches[0] ? Math.max(3, matches[0]) : 5;
}

function buildLessonSlides(lesson: GeneratedLesson, theme: SubjectTheme, includeQuiz: boolean) {
  const slides: LessonSlide[] = [
    {
      title: lesson.title ?? "NovaSprout Lesson",
      minutes: 2,
      visualLabel: theme.deckLabel,
      content: (
        <div className="deck-title-card">
          <span>NovaSprout Learning · {theme.deckLabel}</span>
          <h3>{lesson.title}</h3>
          <p>{lesson.studentFit}</p>
        </div>
      )
    },
    {
      title: "What you will learn",
      minutes: 3,
      visualLabel: theme.visualHint,
      content: (
        <SubjectLearningCard label={theme.accent} theme={theme}>
          <ListBlock items={lesson.learningObjectives} />
        </SubjectLearningCard>
      )
    },
    {
      title: "Before we start",
      minutes: 3,
      visualLabel: "Ready?",
      content: (
        <SubjectLearningCard label="Check" theme={theme}>
          <ListBlock items={lesson.prerequisiteCheck} />
        </SubjectLearningCard>
      )
    },
    {
      title: theme.slideLabels.warmUp,
      minutes: 4,
      visualLabel: "Warm up",
      content: (
        <SubjectLearningCard label="Start" theme={theme}>
          <p>{lesson.warmUp}</p>
        </SubjectLearningCard>
      )
    },
    {
      title: theme.slideLabels.concept,
      minutes: 6,
      visualLabel: theme.visualHint,
      content: (
        <SubjectLearningCard label={theme.accent} theme={theme}>
          <p>{lesson.conceptExplanation}</p>
        </SubjectLearningCard>
      )
    },
    {
      title: theme.slideLabels.example,
      minutes: 6,
      visualLabel: "Example",
      content: (
        <SubjectLearningCard label="Model" theme={theme}>
          <p>{lesson.guidedExample}</p>
        </SubjectLearningCard>
      )
    },
    ...(lesson.fullLessonSegments?.map((segment) => ({
      title: segment.title,
      minutes: parseSlideMinutes(segment.time),
      visualLabel: segment.time,
      content: (
        <SubjectLearningCard label="Learn" theme={theme}>
          <p>{segment.activity}</p>
        </SubjectLearningCard>
      )
    })) ?? []),
    ...(lesson.practiceQuestions?.map((question, index) => ({
      title: `${theme.slideLabels.practice} ${index + 1}`,
      minutes: 3,
      visualLabel: "Try it",
      content: (
        <SubjectLearningCard label="Practice" theme={theme}>
          <p>{question}</p>
        </SubjectLearningCard>
      )
    })) ?? []),
    ...(lesson.quickAssessment?.map((check, index) => ({
      title: `Quick check ${index + 1}`,
      minutes: 2,
      visualLabel: "Check",
      content: (
        <SubjectLearningCard label="Check" theme={theme}>
          <p>{check}</p>
        </SubjectLearningCard>
      )
    })) ?? []),
    {
      title: "Recommended next step",
      minutes: 2,
      visualLabel: "Next",
      content: (
        <SubjectLearningCard label="Next" theme={theme}>
          <p>{lesson.recommendedNextSession}</p>
        </SubjectLearningCard>
      )
    }
  ];

  if (includeQuiz && lesson.timedExam?.questions?.length) {
    slides.push({
      title: "Final quiz",
      minutes: lesson.timedExam.durationMinutes,
      type: "quiz",
      visualLabel: "Score",
      content: null
    });
  }

  return slides.filter((slide) => slide.type === "quiz" || slide.content);
}

function escapeLatex(value?: string) {
  return (value ?? "")
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function latexItems(items?: string[]) {
  if (!items?.length) {
    return "\\item No items generated yet.";
  }

  return items.map((item) => `\\item ${escapeLatex(item)}`).join("\n");
}

function latexFrame(title: string, body: string) {
  return `\\begin{frame}{${escapeLatex(title)}}\n${body}\n\\end{frame}`;
}

function generateBeamerTex(lesson: GeneratedLesson, context: LessonContext) {
  const theme = getSubjectTheme(context.subject);
  const segmentFrames =
    lesson.fullLessonSegments
      ?.map((segment) =>
        latexFrame(
          segment.title,
          `${segment.time ? `\\textbf{Suggested time:} ${escapeLatex(segment.time)}\\\\[0.5em]\n` : ""}${escapeLatex(
            segment.activity
          )}`
        )
      )
      .join("\n\n") ?? "";

  const quizFrame = lesson.timedExam?.questions?.length
    ? latexFrame(
        "Exit Quiz",
        `\\begin{enumerate}\n${lesson.timedExam.questions
          .slice(0, 6)
          .map((question) => `\\item ${escapeLatex(question.question)}`)
          .join("\n")}\n\\end{enumerate}`
      )
    : "";

  return String.raw`\documentclass[aspectratio=169]{beamer}
\usetheme{Madrid}
\usecolortheme{seahorse}
\definecolor{NovaBlue}{HTML}{1976D2}
\definecolor{NovaMint}{HTML}{0F9B78}
\definecolor{NovaInk}{HTML}{10263F}
\setbeamercolor{structure}{fg=NovaBlue}
\setbeamercolor{frametitle}{fg=white,bg=NovaInk}
\setbeamercolor{title}{fg=white,bg=NovaInk}
\setbeamertemplate{navigation symbols}{}
\title{${escapeLatex(lesson.title ?? "NovaSprout Lesson")}}
\subtitle{${escapeLatex(`${theme.deckLabel} · ${context.grade} · ${context.topic}`)}}
\author{NovaSprout Learning}
\date{\today}

\begin{document}

\begin{frame}
  \titlepage
  \vfill
  \small ${escapeLatex(lesson.studentFit)}
\end{frame}

${latexFrame("What You Will Learn", `\\begin{itemize}\n${latexItems(lesson.learningObjectives)}\n\\end{itemize}`)}

${latexFrame("Warm-Up", escapeLatex(lesson.warmUp))}

${latexFrame("Big Idea", escapeLatex(lesson.conceptExplanation))}

${latexFrame("Worked Example", escapeLatex(lesson.guidedExample))}

${segmentFrames}

${latexFrame("Try It Yourself", `\\begin{enumerate}\n${latexItems(lesson.practiceQuestions)}\n\\end{enumerate}`)}

${latexFrame("Quick Check", `\\begin{enumerate}\n${latexItems(lesson.quickAssessment)}\n\\end{enumerate}`)}

${quizFrame}

${latexFrame("Next Step", `${escapeLatex(lesson.recommendedNextSession)}\\\\[1em]\n\\textbf{Tutor note:} ${escapeLatex(lesson.parentTutorNotes)}`)}

\end{document}
`;
}

function getAssetSlideNumber(placement: string) {
  const match = placement.trim().toLowerCase().match(/^(\d+)/);
  return match ? Number(match[1]) : 0;
}

function getAssetPosition(placement: string) {
  const position = placement.trim().toLowerCase().replace(/^\d+/, "");
  return ["lt", "ct", "rt", "lm", "cm", "rm", "lb", "cb", "rb"].includes(position) ? position : "rb";
}

function renderSlideAssets(assets: SlideAsset[], slideIndex: number) {
  const slideAssets = assets.filter((asset) => getAssetSlideNumber(asset.placement) === slideIndex + 1);

  if (!slideAssets.length) {
    return null;
  }

  return (
    <div className="deck-assets" aria-hidden="true">
      {slideAssets.map((asset) => {
        const position = getAssetPosition(asset.placement);
        return (
          <div className={`deck-asset ${asset.type} ${position}`} key={`${asset.placement}-${asset.type}-${asset.prompt}`}>
            {asset.type === "image" ? (
              asset.dataUrl ? (
                <img alt="" src={asset.dataUrl} />
              ) : (
                <span>Image planned · {asset.placement}</span>
              )
            ) : (
              <code>{asset.latex}</code>
            )}
          </div>
        );
      })}
    </div>
  );
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal }).finally(() => window.clearTimeout(timeout));
}

function LessonPlayer({
  context,
  lesson,
  onClose
}: {
  context: LessonContext;
  lesson: GeneratedLesson;
  onClose: () => void;
}) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isRunning, setIsRunning] = useState(true);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const slides = useMemo<LessonSlide[]>(() => {
    return buildLessonSlides(lesson, getSubjectTheme(context.subject), true);
  }, [context.subject, lesson]);

  const activeSlide = slides[activeSlideIndex];
  const [remainingSeconds, setRemainingSeconds] = useState((activeSlide?.minutes ?? 5) * 60);
  const questions = lesson.timedExam?.questions ?? [];
  const quizScore = useMemo(() => {
    if (!questions.length) {
      return null;
    }

    const correct = questions.filter((question, index) => answers[index] === question.answerIndex).length;
    return {
      correct,
      percent: Math.round((correct / questions.length) * 100),
      total: questions.length
    };
  }, [answers, questions]);

  useEffect(() => {
    setRemainingSeconds((slides[activeSlideIndex]?.minutes ?? 5) * 60);
    setIsRunning(true);
  }, [activeSlideIndex, slides]);

  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, remainingSeconds]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const progress = slides.length > 1 ? Math.round((activeSlideIndex / (slides.length - 1)) * 100) : 100;

  return (
    <div className="lesson-player-backdrop" role="dialog" aria-modal="true" aria-labelledby="lesson-player-title">
      <section className="lesson-player">
        <header className="lesson-player-header">
          <div>
            <p className="eyebrow">Private lesson window</p>
            <h2 id="lesson-player-title">{lesson.title}</h2>
            <p>
              Slide {activeSlideIndex + 1} of {slides.length}
            </p>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Close lesson player">
            <X aria-hidden="true" size={18} />
          </button>
        </header>

        <div className="lesson-player-progress" aria-label={`${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="lesson-player-body">
          <aside className="lesson-player-sidebar">
            <div className="timer-card">
              <Clock aria-hidden="true" size={22} />
              <strong>
                {minutes}:{seconds.toString().padStart(2, "0")}
              </strong>
              <span>{activeSlide?.minutes} min suggested</span>
            </div>
            <button className="button secondary full" onClick={() => setIsRunning((running) => !running)} type="button">
              {isRunning ? "Pause timer" : "Start timer"}
            </button>
            <button
              className="button secondary full"
              onClick={() => setRemainingSeconds((activeSlide?.minutes ?? 5) * 60)}
              type="button"
            >
              <TimerReset aria-hidden="true" size={18} />
              Reset slide
            </button>
            <ol className="slide-list">
              {slides.map((slide, index) => (
                <li className={index === activeSlideIndex ? "active" : ""} key={`${slide.title}-${index}`}>
                  <button onClick={() => setActiveSlideIndex(index)} type="button">
                    <span>{index + 1}</span>
                    {slide.title}
                  </button>
                </li>
              ))}
            </ol>
          </aside>

          <article className="lesson-slide">
            <p className="mini-label">{activeSlide?.type === "quiz" ? "Final check" : "Lesson slide"}</p>
            <h3>{activeSlide?.title}</h3>
            {activeSlide?.type === "quiz" ? (
              <div className="exam-question-list">
                {questions.map((question, questionIndex) => (
                  <fieldset className="exam-question" key={question.question}>
                    <legend>{question.question}</legend>
                    {question.options.map((option, optionIndex) => (
                      <label key={option}>
                        <input
                          checked={answers[questionIndex] === optionIndex}
                          disabled={quizSubmitted}
                          name={`player-question-${questionIndex}`}
                          onChange={() =>
                            setAnswers((currentAnswers) => ({
                              ...currentAnswers,
                              [questionIndex]: optionIndex
                            }))
                          }
                          type="radio"
                        />
                        {option}
                      </label>
                    ))}
                    {quizSubmitted ? (
                      <p className={answers[questionIndex] === question.answerIndex ? "answer-correct" : "answer-wrong"}>
                        {answers[questionIndex] === question.answerIndex ? "Correct. " : "Review. "}
                        {question.explanation}
                      </p>
                    ) : null}
                  </fieldset>
                ))}
                {quizSubmitted && quizScore ? (
                  <p className="score-card">
                    Score: {quizScore.correct}/{quizScore.total} ({quizScore.percent}%)
                  </p>
                ) : (
                  <button className="button primary" onClick={() => setQuizSubmitted(true)} type="button">
                    Submit Quiz
                  </button>
                )}
              </div>
            ) : (
              <div className="slide-content">{activeSlide?.content}</div>
            )}
          </article>
        </div>

        <footer className="lesson-player-footer">
          <button
            className="button secondary"
            disabled={activeSlideIndex === 0}
            onClick={() => setActiveSlideIndex((index) => Math.max(0, index - 1))}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={18} />
            Previous
          </button>
          <button
            className="button primary"
            disabled={activeSlideIndex === slides.length - 1}
            onClick={() => setActiveSlideIndex((index) => Math.min(slides.length - 1, index + 1))}
            type="button"
          >
            Next Slide
            <ArrowRight aria-hidden="true" size={18} />
          </button>
        </footer>
      </section>
    </div>
  );
}

function StudentSlideDeck({
  accessToken,
  context,
  lesson,
  onClose
}: {
  accessToken: string;
  context: LessonContext;
  lesson: GeneratedLesson;
  onClose: () => void;
}) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [assetError, setAssetError] = useState("");
  const [assets, setAssets] = useState<SlideAsset[]>([]);
  const [compiledDeck, setCompiledDeck] = useState<CompiledDeck | null>(null);
  const [deckStage, setDeckStage] = useState("");
  const [, setIsCompilingDeck] = useState(false);
  const [isFullPipelineRunning, setIsFullPipelineRunning] = useState(false);
  const [, setIsGeneratingImages] = useState(false);
  const [, setIsPlanningAssets] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);
  const [quizLaunchCount, setQuizLaunchCount] = useState(0);
  const hasStartedBuild = useRef(false);
  const theme = useMemo(() => getSubjectTheme(context.subject), [context.subject]);

  const slides = useMemo<LessonSlide[]>(() => {
    const deckSlides = buildLessonSlides(lesson, theme, false);
    if (lesson.timedExam?.questions?.length) {
      deckSlides.push({
        title: "Exit quiz",
        minutes: lesson.timedExam.durationMinutes,
        visualLabel: "Quiz",
        content: (
          <ol className="deck-quiz-list">
            {lesson.timedExam.questions.slice(0, 6).map((question) => (
              <li key={question.question}>{question.question}</li>
            ))}
          </ol>
        )
      });
    }

    return deckSlides;
  }, [lesson, theme]);

  const activeSlide = slides[activeSlideIndex];
  const BeamerIcon = theme.icon;
  const pdfPlanningTitles = useMemo(
    () => pdfDeckPlanningTitles(lesson, context),
    [context, lesson]
  );
  const texFilename = `${(lesson.title ?? "novasprout-lesson")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "novasprout-lesson"}.tex`;
  const pdfFilename = texFilename.replace(/\.tex$/, ".pdf");
  const compiledPdfHref = compiledDeck?.pdfUrl ?? compiledDeck?.pdfDataUrl ?? "";
  const compiledPageCount = compiledDeck?.pageCount ?? slides.length;
  const pdfViewerSrc = compiledPdfHref ? `${compiledPdfHref}#page=${pdfPage}` : "";
  const pdfViewerKey = `${compiledDeck?.pdfUrl ?? compiledDeck?.pdfSize ?? "compiled-pdf"}-${compiledPageCount}-${pdfPage}-${quizLaunchCount}`;
  const totalLessonMinutes = Math.max(
    1,
    slides
      .filter((slide) => slide.title.toLowerCase() !== "exit quiz")
      .reduce((total, slide) => total + slide.minutes, 0)
  );
  const totalLessonSeconds = totalLessonMinutes * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(totalLessonSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const elapsedSeconds = Math.max(0, totalLessonSeconds - remainingSeconds);
  const quizUnlockSeconds = Math.ceil(totalLessonSeconds / 2);
  const quizUnlocked = elapsedSeconds >= quizUnlockSeconds || remainingSeconds === 0;
  const unlockRemainingSeconds = Math.max(0, quizUnlockSeconds - elapsedSeconds);
  const timerMinutes = Math.floor(remainingSeconds / 60);
  const timerSeconds = remainingSeconds % 60;
  const unlockMinutes = Math.floor(unlockRemainingSeconds / 60);
  const unlockSeconds = unlockRemainingSeconds % 60;
  const progress = compiledPdfHref
    ? Math.round((elapsedSeconds / Math.max(1, totalLessonSeconds)) * 100)
    : slides.length > 1 ? Math.round((activeSlideIndex / (slides.length - 1)) * 100) : 100;
  const buildStages = ["Generating LaTeX", "Planning visuals", "Generating images", "Compiling PDF", "Checking quality", "Ready"];
  const stageAliases: Record<string, string> = {
    "Images ready": "Generating images",
    "Images skipped": "Generating images",
    "Visual plan ready": "Planning visuals",
    "Visual planning skipped": "Planning visuals"
  };
  const activeBuildStage = stageAliases[deckStage] ?? deckStage;
  const shouldRequireGeneratedImage = context.subject === "Science" || context.topic.toLowerCase().includes("digest");

  async function readDeckResponse<T>(response: Response, fallbackMessage: string) {
    const responseText = await response.text();
    let data: T & { error?: string };

    try {
      data = responseText ? JSON.parse(responseText) : ({} as T & { error?: string });
    } catch {
      throw new Error(responseText || fallbackMessage);
    }

    if (!response.ok) {
      throw new Error(data.error ?? fallbackMessage);
    }

    return data;
  }

  function countEmbeddedImageAssets(deck: CompiledDeck | null) {
    return deck?.assetManifest?.filter((asset) => asset.type === "image").length ?? 0;
  }

  function validateCompiledDeck(deck: CompiledDeck, inputAssets: SlideAsset[]) {
    const plannedImageCount = inputAssets.filter((asset) => asset.type === "image").length;
    const embeddedImageCount = countEmbeddedImageAssets(deck);

    if (deck.compilerStatus !== "compiled") {
      throw new Error(deck.error ?? "The PDF compiler did not report a successful compile.");
    }

    if (!deck.pdfUrl && !deck.pdfDataUrl) {
      throw new Error("The PDF compiler did not return a previewable PDF.");
    }

    if (!deck.pageCount || deck.pageCount < Math.max(3, Math.floor(pdfPlanningTitles.length * 0.5))) {
      throw new Error("The compiled PDF has fewer pages than expected.");
    }

    if (plannedImageCount && embeddedImageCount < plannedImageCount) {
      throw new Error(`Only ${embeddedImageCount} of ${plannedImageCount} generated image assets were embedded in the PDF.`);
    }

    if (shouldRequireGeneratedImage && embeddedImageCount < 1) {
      throw new Error("This topic needs at least one generated visual, but no generated image was embedded in the PDF.");
    }
  }

  async function planSlideAssets() {
    setAssetError("");
    setDeckStage("Planning visuals");
    setIsPlanningAssets(true);
    const stageStartedAt = Date.now();

    try {
      const response = await fetchWithTimeout("/api/ai-slide-assets", {
        body: JSON.stringify({
          context,
          lesson,
          slideTitles: pdfPlanningTitles
        }),
        headers: {
          "Content-Type": "application/json",
          "x-ai-access-token": accessToken.trim()
        },
        method: "POST"
      }, assetPlanningTimeoutMs);
      const data = await readDeckResponse<{ assets?: SlideAsset[] }>(
        response,
        "Could not create the slide asset plan."
      );
      const plannedAssets = data.assets ?? [];
      if (shouldRequireGeneratedImage && !plannedAssets.some((asset) => asset.type === "image")) {
        throw new Error("Visual planning did not produce a generated image asset for this science lesson.");
      }
      await waitForMinimumElapsed(stageStartedAt, minimumBuildStageMs.visuals);
      setAssets(plannedAssets);
      setDeckStage("Visual plan ready");
      return plannedAssets;
    } catch (error) {
      await waitForMinimumElapsed(stageStartedAt, minimumBuildStageMs.visuals);
      setAssetError(error instanceof Error ? `Visual planning failed: ${error.message}` : "Visual planning failed.");
      setDeckStage("Visual planning skipped");
      return null;
    } finally {
      setIsPlanningAssets(false);
    }
  }

  async function generateSlideImages(inputAssets = assets) {
    setAssetError("");
    setDeckStage("Generating images");
    setIsGeneratingImages(true);
    const stageStartedAt = Date.now();

    try {
      const response = await fetchWithTimeout("/api/ai-slide-images", {
        body: JSON.stringify({ assets: inputAssets }),
        headers: {
          "Content-Type": "application/json",
          "x-ai-access-token": accessToken.trim()
        },
        method: "POST"
      }, imageGenerationTimeoutMs);
      const data = await readDeckResponse<{ images?: SlideAsset[] }>(
        response,
        "Could not generate slide images."
      );
      const generatedImages = data.images ?? [];
      const plannedImages = inputAssets.filter((asset) => asset.type === "image");
      if (plannedImages.length && generatedImages.length < plannedImages.length) {
        throw new Error(
          `Only ${generatedImages.length} of ${plannedImages.length} planned images were generated. Check OpenAI image billing/quota and try again.`
        );
      }

      const mergedAssets = inputAssets.map((asset) => {
          const generated = generatedImages.find(
            (image) => image.placement === asset.placement && image.prompt === asset.prompt
          );
          return generated ? { ...asset, ...generated } : asset;
        });
      const missingImages = mergedAssets.filter((asset) => asset.type === "image" && !asset.dataUrl);
      if (missingImages.length) {
        throw new Error(`${missingImages.length} planned image asset${missingImages.length === 1 ? "" : "s"} did not return PNG data.`);
      }

      await waitForMinimumElapsed(stageStartedAt, minimumBuildStageMs.images);
      setAssets(mergedAssets);
      setDeckStage("Images ready");
      return mergedAssets;
    } catch (error) {
      await waitForMinimumElapsed(stageStartedAt, minimumBuildStageMs.images);
      const message = error instanceof Error ? error.message : "Could not generate slide images.";
      setAssetError(
        shouldRequireGeneratedImage
          ? `Required visual generation failed: ${message}`
          : `Generated images skipped: ${message}`
      );
      setDeckStage("Images skipped");
      return null;
    } finally {
      setIsGeneratingImages(false);
    }
  }

  async function compileLatexDeck(inputAssets = assets) {
    setAssetError("");
    setCompiledDeck(null);
    setDeckStage("Compiling PDF");
    setIsCompilingDeck(true);
    const stageStartedAt = Date.now();

    try {
      const response = await fetch("/api/ai-lesson-deck", {
        body: JSON.stringify({
          assets: inputAssets,
          context,
          lesson,
          slideTitles: pdfPlanningTitles
        }),
        headers: {
          "Content-Type": "application/json",
          "x-ai-access-token": accessToken.trim()
        },
        method: "POST"
      });
      const responseText = await response.text();
      let data: CompiledDeck = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          responseText
            ? `Compiler server returned a non-JSON error: ${responseText.slice(0, 500)}`
            : "Could not compile the LaTeX deck."
        );
      }

      await waitForMinimumElapsed(stageStartedAt, minimumBuildStageMs.compile);
      if (!response.ok && data.error) {
        setCompiledDeck(data);
        setPdfPage(1);
        setAssetError(data.error);
      } else if (!response.ok) {
        setCompiledDeck(data);
        setPdfPage(1);
        setAssetError("Could not compile the LaTeX deck.");
      } else {
        setDeckStage("Checking quality");
        await sleep(minimumBuildStageMs.quality);
        validateCompiledDeck(data, inputAssets);
        setCompiledDeck(data);
        setPdfPage(1);
        setDeckStage("Ready");
      }
      return response.ok ? data : null;
    } catch (error) {
      await waitForMinimumElapsed(stageStartedAt, minimumBuildStageMs.compile);
      setAssetError(error instanceof Error ? error.message : "Could not compile the LaTeX deck.");
      return null;
    } finally {
      setIsCompilingDeck(false);
    }
  }

  async function buildPdfLesson() {
    setIsFullPipelineRunning(true);
    setAssetError("");
    setCompiledDeck(null);

    try {
      setDeckStage("Generating LaTeX");
      await sleep(minimumBuildStageMs.latex);
      const plannedAssets = await planSlideAssets();
      if (!plannedAssets && shouldRequireGeneratedImage) {
        return;
      }
      const safePlannedAssets = plannedAssets ?? [];

      const assetsWithImages = safePlannedAssets.some((asset) => asset.type === "image")
        ? await generateSlideImages(safePlannedAssets)
        : safePlannedAssets;
      if (!assetsWithImages && safePlannedAssets.some((asset) => asset.type === "image")) {
        return;
      }

      const safeAssetsWithImages = assetsWithImages ?? safePlannedAssets;

      await compileLatexDeck(safeAssetsWithImages);
    } finally {
      setIsFullPipelineRunning(false);
    }
  }

  useEffect(() => {
    if (hasStartedBuild.current) {
      return;
    }

    hasStartedBuild.current = true;
    void buildPdfLesson();
  }, []);

  useEffect(() => {
    setRemainingSeconds(totalLessonSeconds);
    setIsTimerRunning(Boolean(compiledPdfHref));
  }, [compiledPdfHref, totalLessonSeconds]);

  useEffect(() => {
    if (!compiledPdfHref || !isTimerRunning || remainingSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [compiledPdfHref, isTimerRunning, remainingSeconds]);

  return (
    <div className="lesson-player-backdrop" role="dialog" aria-modal="true" aria-labelledby="student-deck-title">
      <section className={`student-deck ${theme.key}`}>
        <header className="student-deck-header">
          <div>
            <p className="eyebrow">Student slide deck</p>
            <h2 id="student-deck-title">{lesson.title}</h2>
            <p>
              {compiledPdfHref
                ? `Compiled PDF deck · ${totalLessonMinutes} min lesson timer`
                : `Slide ${activeSlideIndex + 1} of ${slides.length} · ${activeSlide?.minutes} min suggested`}
            </p>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Close student deck">
            <X aria-hidden="true" size={18} />
          </button>
        </header>
        <div className="lesson-player-progress" aria-label={`${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        {compiledPdfHref ? (
          <article className="compiled-pdf-primary" id="compiled-pdf-viewer">
            <iframe key={pdfViewerKey} src={pdfViewerSrc} title={`Compiled NovaSprout lesson PDF page ${pdfPage}`} />
          </article>
        ) : isFullPipelineRunning ? (
          <article className="deck-build-status">
            <FileCode2 aria-hidden="true" size={42} />
            <p className="eyebrow">Preparing private lesson</p>
            <h3>{deckStage || "Building PDF lesson"}</h3>
            <ol>
              {buildStages.map((stage) => {
                const currentIndex = buildStages.indexOf(activeBuildStage);
                const stageIndex = buildStages.indexOf(stage);
                return (
                  <li className={stage === activeBuildStage ? "active" : stageIndex < currentIndex ? "done" : ""} key={stage}>
                    {stage}
                  </li>
                );
              })}
            </ol>
          </article>
        ) : (
          <article className={`student-deck-slide ${theme.key}`}>
            <div className="deck-visual">
              <BeamerIcon aria-hidden="true" size={42} />
              <span>{activeSlide?.visualLabel ?? theme.visualHint}</span>
            </div>
            <div className="deck-copy">
              <p className="mini-label">
                {context.grade} · {context.subject} · {activeSlide?.minutes} minute focus
              </p>
              <h3>{activeSlide?.title}</h3>
              <div className="slide-content">{activeSlide?.content}</div>
            </div>
            {renderSlideAssets(assets, activeSlideIndex)}
          </article>
        )}
        {compiledDeck && (!compiledPdfHref || compiledDeck.qualityWarnings?.length || compiledDeck.validationErrors?.length) ? (
          <aside className="compiled-deck-panel">
            <div>
              <p className="mini-label">Backend LaTeX deck</p>
              <h3>
                {compiledDeck.compilerStatus === "compiled"
                  ? "Compiled PDF preview"
                  : "LaTeX generated, compiler not ready"}
              </h3>
              <ul>
                {compiledDeck.qualityChecks?.map((check) => (
                  <li key={check}>{check}</li>
                ))}
                {compiledDeck.qualityWarnings?.map((warning) => (
                  <li className="quality-warning" key={warning}>{warning}</li>
                ))}
              </ul>
              {compiledDeck.validationErrors?.length ? (
                <ul>
                  {compiledDeck.validationErrors.map((validationError) => (
                    <li className="quality-warning" key={validationError}>{validationError}</li>
                  ))}
                </ul>
              ) : null}
              {compiledDeck.error ? <p className="form-error">{compiledDeck.error}</p> : null}
            </div>
            {compiledPdfHref ? <p className="generator-note">The compiled PDF above is the lesson display and the downloadable deck.</p> : null}
          </aside>
        ) : null}
        <div className="print-deck" aria-hidden="true">
          {slides.map((slide, index) => (
            <section className="print-slide" key={`${slide.title}-print-${index}`}>
              <p>NovaSprout Learning · {lesson.title}</p>
              <h2>{slide.title}</h2>
              <div>{slide.content}</div>
              {renderSlideAssets(assets, index)}
              <span>
                Slide {index + 1} of {slides.length} · {slide.minutes} min suggested
              </span>
            </section>
          ))}
        </div>
        <footer className="lesson-player-footer">
          <div className="deck-ai-tools" aria-live="polite">
            <p className="deck-stage">{assetError ? "Needs attention" : deckStage || "Preparing lesson"}</p>
            {assetError ? (
              <button className="button primary" disabled={isFullPipelineRunning} onClick={buildPdfLesson} type="button">
                <FileCode2 aria-hidden="true" size={18} />
                Retry PDF lesson
              </button>
            ) : null}
          </div>
          {assetError ? <p className="form-error deck-asset-error">{assetError}</p> : null}
          {compiledPdfHref ? (
            <>
              <span className="pdf-timer-pill" aria-live="polite">
                <Clock aria-hidden="true" size={18} />
                <strong>
                  {timerMinutes}:{timerSeconds.toString().padStart(2, "0")}
                </strong>
                <span>Total lesson timer</span>
              </span>
              <button className="button secondary" onClick={() => setIsTimerRunning((running) => !running)} type="button">
                {isTimerRunning ? "Pause" : "Start"}
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  setRemainingSeconds(totalLessonSeconds);
                  setPdfPage(1);
                  setQuizLaunchCount((count) => count + 1);
                  setIsTimerRunning(true);
                }}
                type="button"
              >
                <TimerReset aria-hidden="true" size={18} />
                Reset
              </button>
              <button
                className="button primary"
                disabled={!quizUnlocked}
                onClick={() => {
                  setPdfPage(Math.max(1, compiledPageCount - 1));
                  setQuizLaunchCount((count) => count + 1);
                  setIsTimerRunning(false);
                }}
                type="button"
              >
                <Trophy aria-hidden="true" size={18} />
                Start Quiz
              </button>
              <span className="pdf-lesson-note">
                {quizUnlocked
                  ? "Quiz is unlocked. Use the PDF viewer controls for pages and zoom."
                  : `Quiz unlocks after 50% of lesson time, in ${unlockMinutes}:${unlockSeconds.toString().padStart(2, "0")}.`}
              </span>
              <button
                className="button secondary"
                onClick={() => document.getElementById("compiled-pdf-viewer")?.requestFullscreen?.()}
                type="button"
              >
                Fullscreen
              </button>
              <a className="button primary" download={pdfFilename} href={compiledPdfHref}>
                <Printer aria-hidden="true" size={18} />
                Download PDF
              </a>
            </>
          ) : (
            <button className="button secondary" disabled={isFullPipelineRunning} onClick={() => window.print()} type="button">
              <Printer aria-hidden="true" size={18} />
              Preview PDF
            </button>
          )}
          {!compiledPdfHref && !isFullPipelineRunning ? (
            <>
              <button
                className="button secondary"
                disabled={activeSlideIndex === 0}
                onClick={() => setActiveSlideIndex((index) => Math.max(0, index - 1))}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={18} />
                Previous
              </button>
              <button
                className="button primary"
                disabled={activeSlideIndex === slides.length - 1}
                onClick={() => setActiveSlideIndex((index) => Math.min(slides.length - 1, index + 1))}
                type="button"
              >
                Next Slide
                <ArrowRight aria-hidden="true" size={18} />
              </button>
            </>
          ) : null}
        </footer>
      </section>
    </div>
  );
}

export default function AILessonGenerator() {
  const [accessToken, setAccessToken] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [grade, setGrade] = useState("Grades 6-8");
  const [subject, setSubject] = useState("Science");
  const [topic, setTopic] = useState("Digestive system");
  const [level, setLevel] = useState("Teach at my grade level");
  const [goal, setGoal] = useState("Concept clarity");
  const [mode, setMode] = useState("Comprehensive lesson");
  const [duration, setDuration] = useState("45-minute comprehensive lesson");
  const [teachingStyle, setTeachingStyle] = useState("Visual");
  const [difficulty, setDifficulty] = useState("Adaptive");
  const [lessonLanguage, setLessonLanguage] = useState("English");
  const [includeInLesson, setIncludeInLesson] = useState<string[]>(lessonIncludes);
  const [studentQuestion, setStudentQuestion] = useState("");
  const [lesson, setLesson] = useState<GeneratedLesson | null>(null);
  const [lessonText, setLessonText] = useState("");
  const [isDeckOpen, setIsDeckOpen] = useState(false);
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [examStartedAt, setExamStartedAt] = useState<number | null>(null);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const savedToken = window.localStorage.getItem(accessStorageKey);
    if (savedToken) {
      setAccessToken(savedToken);
      setIsUnlocked(true);
    }
  }, []);

  const examScore = useMemo(() => {
    const questions = lesson?.timedExam?.questions ?? [];
    if (!questions.length) {
      return null;
    }

    const correct = questions.filter((question, index) => examAnswers[index] === question.answerIndex).length;
    return {
      correct,
      percent: Math.round((correct / questions.length) * 100),
      total: questions.length
    };
  }, [examAnswers, lesson]);
  const topicSuggestions = topicSuggestionsBySubject[subject] ?? ["Homework help", "Chapter review", "Practice questions", "Exam preparation"];

  function toggleIncludedLessonItem(item: string) {
    setIncludeInLesson((current) =>
      current.includes(item)
        ? current.filter((selected) => selected !== item)
        : [...current, item]
    );
  }

  function unlockTools(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanedToken = accessToken.trim();
    if (!cleanedToken) {
      setError("Enter the AI access code or approved paid-user email.");
      return;
    }

    window.localStorage.setItem(accessStorageKey, cleanedToken);
    setIsUnlocked(true);
    setError("");
  }

  async function generateLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLesson(null);
    setLessonText("");
    setIsDeckOpen(false);
    setExamAnswers({});
    setExamStartedAt(null);
    setExamSubmitted(false);
    setIsGenerating(true);

    try {
      setNotice("Starting your AI lesson...");
      const startResponse = await fetch("/api/ai-lesson", {
        body: JSON.stringify({
          difficulty,
          duration,
          goal,
          grade,
          includeInLesson,
          language: lessonLanguage,
          level,
          mode,
          studentQuestion,
          subject,
          teachingStyle,
          topic
        }),
        headers: {
          "Content-Type": "application/json",
          "x-ai-access-token": accessToken.trim()
        },
        method: "POST"
      });
      let data = await readLessonApiResponse(startResponse);

      if (!startResponse.ok) {
        throw new Error(
          data.error
            ? `Lesson generation failed (${startResponse.status}): ${data.error}`
            : `Could not start the lesson (${startResponse.status}).`
        );
      }

      if (!data.lesson && data.responseId) {
        const backgroundResponseId = data.responseId;
        const pollingStartedAt = Date.now();
        let temporaryFailures = 0;

        while (Date.now() - pollingStartedAt < lessonPollingTimeoutMs) {
          const elapsedMinutes = Math.max(1, Math.floor((Date.now() - pollingStartedAt) / 60000) + 1);
          setNotice(
            elapsedMinutes === 1
              ? "Creating the lesson in the background. Keep this page open."
              : `Still building the full lesson and visuals (${elapsedMinutes} min). Keep this page open.`
          );
          await sleep(lessonPollingIntervalMs);

          const statusResponse = await fetch(
            `/api/ai-lesson/status?responseId=${encodeURIComponent(backgroundResponseId)}`,
            {
              headers: { "x-ai-access-token": accessToken.trim() },
              method: "GET"
            }
          );
          const statusData = await readLessonApiResponse(statusResponse);

          if (!statusResponse.ok) {
            if ([502, 503, 504].includes(statusResponse.status) && temporaryFailures < 6) {
              temporaryFailures += 1;
              continue;
            }
            throw new Error(
              statusData.error
                ? `Lesson generation failed (${statusResponse.status}): ${statusData.error}`
                : `Could not check the lesson (${statusResponse.status}).`
            );
          }

          temporaryFailures = 0;
          if (statusData.lesson || statusData.lessonText) {
            data = statusData;
            break;
          }

          if (!["queued", "in_progress"].includes(statusData.status ?? "")) {
            throw new Error("The AI lesson stopped before it was complete. Please try again.");
          }
        }

        if (!data.lesson && !data.lessonText) {
          throw new Error("The AI lesson is still processing after five minutes. Please try again shortly.");
        }
      }

      const generatedLesson = data.lesson ?? null;
      if (!generatedLesson && !data.lessonText) {
        throw new Error("The lesson service returned no lesson content.");
      }
      setLesson(generatedLesson);
      setLessonText(data.lessonText ?? "");
      setNotice(data.warning ?? "");
      if (generatedLesson?.timedExam?.questions?.length) {
        setExamStartedAt(Date.now());
      }
    } catch (generatorError) {
      setNotice("");
      setError(generatorError instanceof Error ? generatorError.message : "Could not generate a lesson.");
    } finally {
      setIsGenerating(false);
    }
  }

  const requestAccessHref = `mailto:${contactEmail}?subject=${encodeURIComponent(
    "NovaSprout AI generator access"
  )}&body=${encodeURIComponent(`Hi NovaSprout Learning,

I would like access to the AI-generated tutoring tool.

Email or phone:
Student grade:
Subject:
Interested in: Free trial / Paid AI-generated lessons
`)}`;
  const liveTutorRequestHref = `mailto:${contactEmail}?subject=${encodeURIComponent(
    `Live tutor request: ${grade} ${subject} - ${topic}`
  )}&body=${encodeURIComponent(`Hi NovaSprout Learning,

I would like to request a separate live tutoring session for this topic.

Grade: ${grade}
Subject: ${subject}
Topic: ${topic}
Output type: ${mode}
Goal: ${goal}
Student level: ${level}
Teaching style: ${teachingStyle}
Difficulty: ${difficulty}

Specific difficulty:
Preferred tutor:
Preferred date and time:
Individual or group session:
Homework/worksheet link:

Notes from AI lesson:
${lesson?.recommendedNextSession ?? "Lesson plan generated in NovaSprout AI Tutor."}
`)}`;

  if (!isUnlocked) {
    return (
      <section className="section demo-generator-section" id="generator">
        <div className="section-heading">
          <p className="eyebrow">Start here</p>
          <h2>Open your AI Tutor.</h2>
          <p>Use your access code or the email approved for your plan.</p>
        </div>
        <form className="ai-access-card" onSubmit={unlockTools}>
          <LockKeyhole aria-hidden="true" size={34} />
          <label>
            Access code or approved email
            <input
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="Enter code or email"
              type="text"
              value={accessToken}
            />
          </label>
          <button className="button primary full" type="submit">
            Continue
            <ArrowRight aria-hidden="true" size={18} />
          </button>
          <div className="access-help-actions">
            <a className="text-link" href={requestAccessHref}>Request free access</a>
            <a className="text-link" href="/#pricing">View plans</a>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      </section>
    );
  }

  return (
    <>
      {lesson && isDeckOpen ? (
        <StudentSlideDeck
          accessToken={accessToken}
          context={{ grade, subject, topic }}
          lesson={lesson}
          onClose={() => setIsDeckOpen(false)}
        />
      ) : null}
      <section className="section demo-generator-section" id="generator">
      <div className="section-heading">
        <p className="eyebrow">Create a lesson</p>
        <h2>What would you like to learn?</h2>
        <p>Choose the basics. NovaSprout handles the lesson structure, visuals, practice, and quiz.</p>
      </div>

      <div className="ai-generator-layout">
        <form className="ai-generator-form" onSubmit={generateLesson}>
          <label>
            Output type
            <select onChange={(event) => setMode(event.target.value)} value={mode}>
              {modes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Grade or class
            <select onChange={(event) => setGrade(event.target.value)} value={grade}>
              {grades.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Subject
            <select
              onChange={(event) => {
                const nextSubject = event.target.value;
                setSubject(nextSubject);
                const nextSuggestion = topicSuggestionsBySubject[nextSubject]?.[0];
                if (nextSuggestion) {
                  setTopic(nextSuggestion);
                }
              }}
              value={subject}
            >
              {subjects.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Topic
            <input
              maxLength={90}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Example: equivalent fractions"
              required
              value={topic}
            />
          </label>
          <div className="topic-suggestions" aria-label="Topic suggestions">
            {topicSuggestions.slice(0, 8).map((item) => (
              <button
                className={topic === item ? "selected" : ""}
                key={item}
                onClick={() => setTopic(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
          <label>
            Student level
            <select onChange={(event) => setLevel(event.target.value)} value={level}>
              {levels.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Goal
            <select onChange={(event) => setGoal(event.target.value)} value={goal}>
              {goals.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Lesson length
            <select onChange={(event) => setDuration(event.target.value)} value={duration}>
              {durations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Teaching style
            <select onChange={(event) => setTeachingStyle(event.target.value)} value={teachingStyle}>
              {teachingStyles.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Difficulty
            <select onChange={(event) => setDifficulty(event.target.value)} value={difficulty}>
              {difficulties.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Language
            <select onChange={(event) => setLessonLanguage(event.target.value)} value={lessonLanguage}>
              {languages.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <fieldset className="lesson-include-field">
            <legend>Include in lesson</legend>
            <div>
              {lessonIncludes.map((item) => (
                <label key={item}>
                  <input
                    checked={includeInLesson.includes(item)}
                    onChange={() => toggleIncludedLessonItem(item)}
                    type="checkbox"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            Student question or learning need
            <textarea
              maxLength={900}
              onChange={(event) => setStudentQuestion(event.target.value)}
              placeholder="Example: I understand the formula but get confused when the word problem changes."
              value={studentQuestion}
            />
          </label>
          <button className="button primary full" disabled={isGenerating || topic.trim().length < 3} type="submit">
            {isGenerating ? "Creating your lesson..." : "Create My Lesson"}
            <ArrowRight aria-hidden="true" size={18} />
          </button>
          <button
            className="text-button"
            onClick={() => {
              window.localStorage.removeItem(accessStorageKey);
              setIsUnlocked(false);
              setAccessToken("");
            }}
            type="button"
          >
            Use a different access code
          </button>
          <p className="generator-note">
            Full lessons can take 3-5 minutes and continue in the background. Keep this page open,
            and do not enter sensitive student information.
          </p>
          {notice ? <p className="generator-note">{notice}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </form>

        <article className="generated-lesson ai-output" aria-live="polite">
          {lesson || lessonText ? (
            <>
              <p className="mini-label">
                {grade} · {subject} · {lesson?.mode ?? mode} · {lesson?.duration ?? duration}
              </p>
              <h3>{lesson?.title ?? "Generated tutoring material"}</h3>
              {lesson?.studentFit ? <p>{lesson.studentFit}</p> : null}
              {lesson ? (
                <>
                <div className="lesson-launch-card">
                  <div>
                    <p className="eyebrow">Ready to learn</p>
                    <h4>Your private lesson is ready to build.</h4>
                    <p>Open it for the visual PDF, lesson timer, and scored quiz.</p>
                  </div>
                  <div className="lesson-launch-actions">
                    <button className="button primary" onClick={() => setIsDeckOpen(true)} type="button">
                      <Images aria-hidden="true" size={18} />
                      Open Private Lesson
                    </button>
                    <a className="button secondary" href={liveTutorRequestHref}>
                      Request a Live Tutor
                    </a>
                  </div>
                </div>
                <details className="lesson-plan-details">
                  <summary>Review lesson plan</summary>
                  <div className="lesson-timeline">
                  <LessonSection label="Learning objectives">
                    <ListBlock items={lesson.learningObjectives} />
                  </LessonSection>
                  <LessonSection label="Prerequisite check">
                    <ListBlock items={lesson.prerequisiteCheck} />
                  </LessonSection>
                  <LessonSection label="Warm-up">
                    <p>{lesson.warmUp}</p>
                  </LessonSection>
                  <LessonSection label="Concept explanation">
                    <p>{lesson.conceptExplanation}</p>
                  </LessonSection>
                  <LessonSection label="Guided example">
                    <p>{lesson.guidedExample}</p>
                  </LessonSection>
                  {lesson.fullLessonSegments?.map((segment) => (
                    <LessonSection key={`${segment.time}-${segment.title}`} label={segment.title} time={segment.time}>
                      <p>{segment.activity}</p>
                    </LessonSection>
                  ))}
                  <LessonSection label="Practice questions">
                    <ListBlock items={lesson.practiceQuestions} />
                  </LessonSection>
                  <LessonSection label="Quick assessment">
                    <ListBlock items={lesson.quickAssessment} />
                  </LessonSection>
                  {lesson.customPlan ? (
                    <LessonSection label="Custom study plan">
                      <p>{lesson.customPlan.summary}</p>
                      <ListBlock items={lesson.customPlan.focusAreas} />
                      <ListBlock items={lesson.customPlan.weeklyPlan} />
                      <p>{lesson.customPlan.recommendedCadence}</p>
                    </LessonSection>
                  ) : null}
                  {lesson.timedExam?.questions?.length ? (
                    <LessonSection label="Timed exam and score">
                      <div className="exam-header">
                        <span>
                          <Clock aria-hidden="true" size={16} />
                          {lesson.timedExam.durationMinutes} minute exam
                        </span>
                        <span>
                          <Trophy aria-hidden="true" size={16} />
                          Passing score {lesson.timedExam.passingScore}%
                        </span>
                      </div>
                      <div className="exam-question-list">
                        {lesson.timedExam.questions.map((question, questionIndex) => (
                          <fieldset className="exam-question" key={question.question}>
                            <legend>{question.question}</legend>
                            {question.options.map((option, optionIndex) => (
                              <label key={option}>
                                <input
                                  checked={examAnswers[questionIndex] === optionIndex}
                                  disabled={examSubmitted}
                                  name={`question-${questionIndex}`}
                                  onChange={() =>
                                    setExamAnswers((answers) => ({
                                      ...answers,
                                      [questionIndex]: optionIndex
                                    }))
                                  }
                                  type="radio"
                                />
                                {option}
                              </label>
                            ))}
                            {examSubmitted ? (
                              <p className={examAnswers[questionIndex] === question.answerIndex ? "answer-correct" : "answer-wrong"}>
                                {examAnswers[questionIndex] === question.answerIndex ? "Correct. " : "Review. "}
                                {question.explanation}
                              </p>
                            ) : null}
                          </fieldset>
                        ))}
                      </div>
                      {examSubmitted && examScore ? (
                        <p className="score-card">
                          Score: {examScore.correct}/{examScore.total} ({examScore.percent}%)
                        </p>
                      ) : (
                        <button className="button primary" onClick={() => setExamSubmitted(true)} type="button">
                          Submit Exam
                        </button>
                      )}
                      {examStartedAt ? (
                        <p className="generator-note">
                          Started {new Date(examStartedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.
                        </p>
                      ) : null}
                    </LessonSection>
                  ) : null}
                  <LessonSection label="Recommended next session">
                    <p>{lesson.recommendedNextSession}</p>
                  </LessonSection>
                  <LessonSection label="Parent/tutor notes">
                    <p>{lesson.parentTutorNotes}</p>
                  </LessonSection>
                  </div>
                </details>
                </>
              ) : (
                <pre className="lesson-text-fallback">{lessonText}</pre>
              )}
            </>
          ) : (
            <div className="empty-generator-state">
              <Bot aria-hidden="true" size={42} />
              <h3>Your lesson will appear here.</h3>
              <p>Choose a grade, subject, topic, and lesson type, then select Create My Lesson.</p>
            </div>
          )}
        </article>
      </div>
      </section>
    </>
  );
}

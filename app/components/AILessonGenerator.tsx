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
  CreditCard,
  FileCode2,
  Gift,
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
const leadStorageKey = "novasprout_ai_lead";
const assetPlanningTimeoutMs = 18000;
const imageGenerationTimeoutMs = 60000;

const grades = [
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "Teen / beginner",
  "College / adult"
];

const subjects = ["Math", "Science", "ELA and study support", "Coding and data skills"];
const levels = ["Struggling", "On grade level", "Advanced"];
const goals = ["Homework help", "Concept clarity", "Test preparation", "Enrichment", "Project mentoring"];
const modes = ["Demo session", "Comprehensive lesson", "Custom study plan", "Timed exam"];
const durations = ["30 minutes", "45 minutes", "60 minutes"];

function getSubjectTheme(subject: string): SubjectTheme {
  if (subject === "Science") {
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

  if (subject === "ELA and study support") {
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

  if (subject === "Coding and data skills") {
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
  if (subject === "Science" && topic?.toLowerCase().includes("digestive")) {
    return ["Digestive System Map", "Mechanical vs Chemical Digestion"];
  }
  if (subject === "Science") {
    return ["Visual Reasoning Model"];
  }
  if (subject === "ELA and study support") {
    return ["Study Strategy Map"];
  }
  if (subject === "Coding and data skills") {
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

  async function planSlideAssets() {
    setAssetError("");
    setDeckStage("Planning visuals");
    setIsPlanningAssets(true);

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
      setAssets(data.assets ?? []);
      setDeckStage("Visual plan ready");
      return data.assets ?? [];
    } catch (error) {
      setAssetError("");
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
      const mergedAssets = inputAssets.map((asset) => {
          const generated = generatedImages.find(
            (image) => image.placement === asset.placement && image.prompt === asset.prompt
          );
          return generated ? { ...asset, ...generated } : asset;
        });
      setAssets(mergedAssets);
      setDeckStage("Images ready");
      return mergedAssets;
    } catch (error) {
      setAssetError(error instanceof Error ? `Generated images skipped: ${error.message}` : "Generated images skipped.");
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

      setCompiledDeck(data);
      setPdfPage(1);
      if (!response.ok && data.error) {
        setAssetError(data.error);
      } else if (!response.ok) {
        setAssetError("Could not compile the LaTeX deck.");
      } else {
        setDeckStage("Checking quality");
        window.setTimeout(() => setDeckStage("Ready"), 250);
      }
      return response.ok ? data : null;
    } catch (error) {
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
      const plannedAssets = await planSlideAssets();
      const safePlannedAssets = plannedAssets ?? [];

      const assetsWithImages = safePlannedAssets.some((asset) => asset.type === "image")
        ? await generateSlideImages(safePlannedAssets)
        : safePlannedAssets;
      const safeAssetsWithImages = assetsWithImages ?? safePlannedAssets.filter((asset) => asset.type !== "image");

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
  const [leadContact, setLeadContact] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showLeadPopup, setShowLeadPopup] = useState(false);
  const [grade, setGrade] = useState("Grade 7");
  const [subject, setSubject] = useState("Math");
  const [topic, setTopic] = useState("Ratios and proportional relationships");
  const [level, setLevel] = useState("On grade level");
  const [goal, setGoal] = useState("Concept clarity");
  const [mode, setMode] = useState("Comprehensive lesson");
  const [duration, setDuration] = useState("45 minutes");
  const [studentQuestion, setStudentQuestion] = useState("");
  const [lesson, setLesson] = useState<GeneratedLesson | null>(null);
  const [lessonText, setLessonText] = useState("");
  const [isDeckOpen, setIsDeckOpen] = useState(false);
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [examStartedAt, setExamStartedAt] = useState<number | null>(null);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const savedToken = window.localStorage.getItem(accessStorageKey);
    if (savedToken) {
      setAccessToken(savedToken);
      setIsUnlocked(true);
    }

    if (!window.localStorage.getItem(leadStorageKey)) {
      setShowLeadPopup(true);
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

  function saveLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanedContact = leadContact.trim();
    if (!cleanedContact) {
      setError("Enter an email or phone number for AI access.");
      return;
    }

    window.localStorage.setItem(
      leadStorageKey,
      JSON.stringify({
        contact: cleanedContact,
        createdAt: new Date().toISOString(),
        interest: "AI-generated tutoring access"
      })
    );
    setShowLeadPopup(false);
    setError("");
  }

  async function generateLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLesson(null);
    setLessonText("");
    setIsDeckOpen(false);
    setExamAnswers({});
    setExamStartedAt(null);
    setExamSubmitted(false);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/ai-lesson", {
        body: JSON.stringify({ duration, goal, grade, level, mode, studentQuestion, subject, topic }),
        headers: {
          "Content-Type": "application/json",
          "x-ai-access-token": accessToken.trim()
        },
        method: "POST"
      });
      const responseText = await response.text();
      let data: { error?: string; lesson?: GeneratedLesson; lessonText?: string; warning?: string } = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(responseText || "The AI lesson service returned an unreadable response.");
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Could not generate a lesson.");
      }

      setLesson(data.lesson ?? null);
      setLessonText(data.lessonText ?? "");
      setError(data.warning ?? "");
      if (data.lesson?.timedExam?.questions?.length) {
        setExamStartedAt(Date.now());
      }
    } catch (generatorError) {
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

  const leadPopup = showLeadPopup ? (
    <div className="lead-popup-backdrop" role="dialog" aria-modal="true" aria-labelledby="ai-access-title">
      <form className="lead-popup" onSubmit={saveLead}>
        <button
          aria-label="Close access popup"
          className="icon-button"
          onClick={() => setShowLeadPopup(false)}
          type="button"
        >
          <X aria-hidden="true" size={18} />
        </button>
        <p className="eyebrow">Locked AI tutor</p>
        <h3 id="ai-access-title">Unlock AI-generated tutoring lessons.</h3>
        <p>
          Enter an email or phone number to request access. Paid users can unlock the AI tutor with
          their approved email address after NovaSprout adds it to the access list.
        </p>
        <label>
          Email or phone
          <input
            onChange={(event) => setLeadContact(event.target.value)}
            placeholder="parent@email.com or phone"
            value={leadContact}
          />
        </label>
        <button className="button primary full" type="submit">
          Continue
          <Gift aria-hidden="true" size={18} />
        </button>
        <a className="button secondary full" href="/pricing">
          View Tutoring Plans
          <CreditCard aria-hidden="true" size={18} />
        </a>
        <a className="text-link popup-mail-link" href={requestAccessHref}>
          Email NovaSprout for the access code
        </a>
      </form>
    </div>
  ) : null;

  if (!isUnlocked) {
    return (
      <>
        {leadPopup}
        <section className="section demo-generator-section" id="generator">
        <div className="section-heading">
          <p className="eyebrow">Protected AI tutoring tools</p>
          <h2>Enter the NovaSprout access code or approved paid-user email.</h2>
          <p>
            This keeps OpenAI usage controlled while allowing selected students, parents, tutors,
            and paid users to generate personalized AI-supported lessons.
          </p>
        </div>
        <form className="ai-access-card" onSubmit={unlockTools}>
          <LockKeyhole aria-hidden="true" size={34} />
          <label>
            AI access code or paid email
            <input
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="Access code or paid@email.com"
              type="text"
              value={accessToken}
            />
          </label>
          <button className="button primary full" type="submit">
            Unlock AI Tools
            <ArrowRight aria-hidden="true" size={18} />
          </button>
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      </section>
      </>
    );
  }

  return (
    <>
      {leadPopup}
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
        <p className="eyebrow">AI-generated tutoring</p>
        <h2>Create lessons, custom study plans, and scored timed exams.</h2>
        <p>
          Choose the student context and output type. NovaSprout uses AI to prepare fresh tutoring
          material, while human tutors can refine the plan during live sessions.
        </p>
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
            <select onChange={(event) => setSubject(event.target.value)} value={subject}>
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
            Student question or learning need
            <textarea
              maxLength={900}
              onChange={(event) => setStudentQuestion(event.target.value)}
              placeholder="Example: I understand the formula but get confused when the word problem changes."
              value={studentQuestion}
            />
          </label>
          <button className="button primary full" disabled={isGenerating || topic.trim().length < 3} type="submit">
            {isGenerating ? "Generating..." : "Generate Tutoring Material"}
            <ArrowRight aria-hidden="true" size={18} />
          </button>
          <button
            className="button secondary full"
            onClick={() => {
              window.localStorage.removeItem(accessStorageKey);
              setIsUnlocked(false);
              setAccessToken("");
            }}
            type="button"
          >
            Lock AI Tools
          </button>
          <p className="generator-note">
            Do not enter a child&apos;s full name, school ID, private address, or sensitive personal information.
          </p>
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
                    <p className="eyebrow">Ready to teach</p>
                    <h4>Review the plan, then start the private timed PDF lesson.</h4>
                    <p>
                      The same LaTeX PDF deck opens in a focused window with page timing, controls, and download.
                    </p>
                  </div>
                  <div className="lesson-launch-actions">
                    <button className="button primary" onClick={() => setIsDeckOpen(true)} type="button">
                      <Images aria-hidden="true" size={18} />
                      Start Timed PDF Lesson
                    </button>
                  </div>
                </div>
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
                </>
              ) : (
                <pre className="lesson-text-fallback">{lessonText}</pre>
              )}
            </>
          ) : (
            <div className="empty-generator-state">
              <Bot aria-hidden="true" size={42} />
              <h3>Your AI-generated tutoring material will appear here.</h3>
              <p>
                Generate a full lesson, demo session, custom plan, or timed exam after choosing the
                student&apos;s grade, subject, topic, and goal.
              </p>
              <ul>
                <li><CheckCircle2 aria-hidden="true" size={16} /> AI-generated comprehensive lessons</li>
                <li><CheckCircle2 aria-hidden="true" size={16} /> Custom plans from student questions</li>
                <li><CheckCircle2 aria-hidden="true" size={16} /> Timed exams with instant scoring</li>
              </ul>
            </div>
          )}
        </article>
      </div>
      </section>
    </>
  );
}

"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { ArrowRight, Bot, CheckCircle2, Clock, LockKeyhole, Trophy } from "lucide-react";

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

const accessStorageKey = "novasprout_ai_access_token";

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

export default function AILessonGenerator() {
  const [accessToken, setAccessToken] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
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
      setError("Enter the AI access code.");
      return;
    }

    window.localStorage.setItem(accessStorageKey, cleanedToken);
    setIsUnlocked(true);
    setError("");
  }

  async function generateLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLesson(null);
    setLessonText("");
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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not generate a lesson.");
      }

      setLesson(data.lesson ?? null);
      setLessonText(data.lessonText ?? "");
      if (data.lesson?.timedExam?.questions?.length) {
        setExamStartedAt(Date.now());
      }
    } catch (generatorError) {
      setError(generatorError instanceof Error ? generatorError.message : "Could not generate a lesson.");
    } finally {
      setIsGenerating(false);
    }
  }

  if (!isUnlocked) {
    return (
      <section className="section demo-generator-section" id="generator">
        <div className="section-heading">
          <p className="eyebrow">Protected AI tutoring tools</p>
          <h2>Enter the NovaSprout access code to generate lessons and exams.</h2>
          <p>
            This keeps OpenAI usage controlled while still allowing selected students, parents, and tutors
            to preview personalized AI-supported tutoring.
          </p>
        </div>
        <form className="ai-access-card" onSubmit={unlockTools}>
          <LockKeyhole aria-hidden="true" size={34} />
          <label>
            AI access code
            <input
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="Enter access code"
              type="password"
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
    );
  }

  return (
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
  );
}

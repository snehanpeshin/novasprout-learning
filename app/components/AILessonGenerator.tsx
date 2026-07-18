"use client";

import { FormEvent, ReactNode, useState } from "react";
import { ArrowRight, Bot, CheckCircle2 } from "lucide-react";

type GeneratedLesson = {
  conceptExplanation?: string;
  guidedExample?: string;
  parentTutorNotes?: string;
  practiceQuestions?: string[];
  quickAssessment?: string[];
  recommendedNextSession?: string;
  studentFit?: string;
  title?: string;
  warmUp?: string;
};

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

export default function AILessonGenerator() {
  const [grade, setGrade] = useState("Grade 7");
  const [subject, setSubject] = useState("Math");
  const [topic, setTopic] = useState("Ratios and proportional relationships");
  const [level, setLevel] = useState("On grade level");
  const [goal, setGoal] = useState("Concept clarity");
  const [lesson, setLesson] = useState<GeneratedLesson | null>(null);
  const [lessonText, setLessonText] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLesson(null);
    setLessonText("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/ai-lesson", {
        body: JSON.stringify({ grade, goal, level, subject, topic }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not generate a lesson.");
      }

      setLesson(data.lesson ?? null);
      setLessonText(data.lessonText ?? "");
    } catch (generatorError) {
      setError(generatorError instanceof Error ? generatorError.message : "Could not generate a lesson.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="section demo-generator-section">
      <div className="section-heading">
        <p className="eyebrow">Live AI Lesson Generator</p>
        <h2>Generate a fresh personalized tutorial sample.</h2>
        <p>
          Choose the class, subject, topic, current level, and goal. The server generates a new
          tutor-style plan each time without exposing the API key.
        </p>
      </div>

      <div className="ai-generator-layout">
        <form className="ai-generator-form" onSubmit={generateLesson}>
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
          <button className="button primary full" disabled={isGenerating || topic.trim().length < 3} type="submit">
            {isGenerating ? "Generating..." : "Generate Tutorial"}
            <ArrowRight aria-hidden="true" size={18} />
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
                {grade} · {subject} · {level}
              </p>
              <h3>{lesson?.title ?? "Generated lesson"}</h3>
              {lesson?.studentFit ? <p>{lesson.studentFit}</p> : null}
              {lesson ? (
                <div className="lesson-timeline">
                  <LessonSection label="Warm-up" time="0-5 min">
                    <p>{lesson.warmUp}</p>
                  </LessonSection>
                  <LessonSection label="Concept explanation" time="5-12 min">
                    <p>{lesson.conceptExplanation}</p>
                  </LessonSection>
                  <LessonSection label="Guided example" time="12-18 min">
                    <p>{lesson.guidedExample}</p>
                  </LessonSection>
                  <LessonSection label="Practice questions" time="18-25 min">
                    <ul>
                      {lesson.practiceQuestions?.map((question) => (
                        <li key={question}>{question}</li>
                      ))}
                    </ul>
                  </LessonSection>
                  <LessonSection label="Quick assessment" time="25-28 min">
                    <ul>
                      {lesson.quickAssessment?.map((check) => (
                        <li key={check}>{check}</li>
                      ))}
                    </ul>
                  </LessonSection>
                  <LessonSection label="Recommended next session" time="28-30 min">
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
              <h3>Your generated tutorial will appear here.</h3>
              <p>
                The output is a sample planning aid for tutoring. A human tutor can adapt it during
                the live session.
              </p>
              <ul>
                <li><CheckCircle2 aria-hidden="true" size={16} /> Personalized explanation</li>
                <li><CheckCircle2 aria-hidden="true" size={16} /> Practice by difficulty</li>
                <li><CheckCircle2 aria-hidden="true" size={16} /> Parent/tutor notes</li>
              </ul>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

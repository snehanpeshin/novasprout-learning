import { NextResponse } from "next/server";

export const runtime = "nodejs";

type LessonRequest = {
  duration?: string;
  grade?: string;
  goal?: string;
  level?: string;
  mode?: string;
  studentQuestion?: string;
  subject?: string;
  topic?: string;
};

const allowedGrades = new Set([
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
]);

const allowedSubjects = new Set([
  "Math",
  "Science",
  "ELA and study support",
  "Coding and data skills"
]);

const allowedLevels = new Set(["Struggling", "On grade level", "Advanced"]);

const allowedGoals = new Set([
  "Homework help",
  "Concept clarity",
  "Test preparation",
  "Enrichment",
  "Project mentoring"
]);

const allowedModes = new Set([
  "Demo session",
  "Comprehensive lesson",
  "Custom study plan",
  "Timed exam"
]);

const allowedDurations = new Set(["30 minutes", "45 minutes", "60 minutes"]);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const maybeOutputText = (payload as { output_text?: unknown }).output_text;
  if (typeof maybeOutputText === "string") {
    return maybeOutputText;
  }

  const output = (payload as { output?: Array<{ content?: Array<{ text?: string }> }> }).output;
  return (
    output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n") ?? ""
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const expectedAccessToken = process.env.AI_LESSON_ACCESS_TOKEN?.trim();
  const providedAccessToken = request.headers.get("x-ai-access-token")?.trim();

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured for this deployment." },
      { status: 500 }
    );
  }

  if (!expectedAccessToken || providedAccessToken !== expectedAccessToken) {
    return NextResponse.json({ error: "Enter the NovaSprout AI access code to use this tool." }, { status: 401 });
  }

  let body: LessonRequest;
  try {
    body = (await request.json()) as LessonRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const grade = cleanText(body.grade, 40);
  const duration = cleanText(body.duration, 20);
  const subject = cleanText(body.subject, 60);
  const topic = cleanText(body.topic, 90);
  const level = cleanText(body.level, 40);
  const goal = cleanText(body.goal, 60);
  const mode = cleanText(body.mode, 40);
  const studentQuestion = cleanText(body.studentQuestion, 900);

  if (
    !allowedGrades.has(grade) ||
    !allowedDurations.has(duration) ||
    !allowedSubjects.has(subject) ||
    !allowedLevels.has(level) ||
    !allowedGoals.has(goal) ||
    !allowedModes.has(mode) ||
    topic.length < 3
  ) {
    return NextResponse.json({ error: "Please choose a valid grade, subject, level, goal, duration, and topic." }, { status: 400 });
  }

  const prompt = `
You are an experienced online tutor and curriculum designer for NovaSprout Learning.

Create a personalized tutoring output using original content, aligned to common U.S. learning expectations without copying any school syllabus, textbook, worksheet, or proprietary curriculum.

Student context:
- Grade or level: ${grade}
- Subject: ${subject}
- Topic: ${topic}
- Current level: ${level}
- Parent/student goal: ${goal}
- Requested output: ${mode}
- Session length: ${duration}
- Student question or concern: ${studentQuestion || "No extra question provided."}

Return only valid JSON with this exact shape:
{
  "title": "short title",
  "mode": "${mode}",
  "duration": "${duration}",
  "studentFit": "one sentence explaining who this is for",
  "learningObjectives": ["objective 1", "objective 2", "objective 3"],
  "prerequisiteCheck": ["short readiness question 1", "short readiness question 2"],
  "warmUp": "short warm-up",
  "conceptExplanation": "student-friendly explanation",
  "guidedExample": "worked example",
  "fullLessonSegments": [
    {"time": "0-5 min", "title": "segment title", "activity": "what the tutor and student do"},
    {"time": "5-15 min", "title": "segment title", "activity": "what the tutor and student do"},
    {"time": "15-30 min", "title": "segment title", "activity": "what the tutor and student do"}
  ],
  "practiceQuestions": ["question 1", "question 2", "question 3", "question 4"],
  "quickAssessment": ["short check 1", "short check 2"],
  "timedExam": {
    "durationMinutes": 12,
    "passingScore": 70,
    "questions": [
      {
        "question": "multiple choice question",
        "options": ["A", "B", "C", "D"],
        "answerIndex": 0,
        "explanation": "brief explanation"
      }
    ]
  },
  "customPlan": {
    "summary": "short plan summary",
    "focusAreas": ["focus 1", "focus 2", "focus 3"],
    "weeklyPlan": ["week 1", "week 2", "week 3", "week 4"],
    "recommendedCadence": "recommended tutoring frequency"
  },
  "recommendedNextSession": "specific next lesson recommendation",
  "parentTutorNotes": "short summary for parent or tutor"
}

For Timed exam, include 6 multiple-choice questions with one correct answerIndex from 0 to 3. For Comprehensive lesson, make fullLessonSegments detailed. For Custom study plan, use the student question heavily.
Keep claims cautious. Do not promise grades, test scores, admissions results, diagnosis, therapy, or guaranteed mastery.
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: prompt,
      max_output_tokens: 1400,
      model: process.env.OPENAI_MODEL ?? "gpt-5"
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: payload.error?.message ?? "Could not generate the lesson right now." },
      { status: response.status }
    );
  }

  const outputText = extractOutputText(payload);
  try {
    return NextResponse.json({ lesson: JSON.parse(outputText) });
  } catch {
    return NextResponse.json({ lessonText: outputText });
  }
}

import { NextResponse } from "next/server";

export const runtime = "nodejs";

type LessonRequest = {
  grade?: string;
  goal?: string;
  level?: string;
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

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured for this deployment." },
      { status: 500 }
    );
  }

  let body: LessonRequest;
  try {
    body = (await request.json()) as LessonRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const grade = cleanText(body.grade, 40);
  const subject = cleanText(body.subject, 60);
  const topic = cleanText(body.topic, 90);
  const level = cleanText(body.level, 40);
  const goal = cleanText(body.goal, 60);

  if (
    !allowedGrades.has(grade) ||
    !allowedSubjects.has(subject) ||
    !allowedLevels.has(level) ||
    !allowedGoals.has(goal) ||
    topic.length < 3
  ) {
    return NextResponse.json({ error: "Please choose a valid grade, subject, level, goal, and topic." }, { status: 400 });
  }

  const prompt = `
You are an experienced online tutor and curriculum designer for NovaSprout Learning.

Create a personalized 30-minute tutoring demo lesson using original content, aligned to common U.S. learning expectations without copying any school syllabus, textbook, worksheet, or proprietary curriculum.

Student context:
- Grade or level: ${grade}
- Subject: ${subject}
- Topic: ${topic}
- Current level: ${level}
- Parent/student goal: ${goal}

Return only valid JSON with this exact shape:
{
  "title": "short lesson title",
  "studentFit": "one sentence explaining who this is for",
  "warmUp": "0-5 minute warm-up",
  "conceptExplanation": "5-12 minute explanation in student-friendly language",
  "guidedExample": "12-18 minute worked example",
  "practiceQuestions": ["question 1", "question 2", "question 3", "question 4"],
  "quickAssessment": ["short check 1", "short check 2"],
  "recommendedNextSession": "specific next lesson recommendation",
  "parentTutorNotes": "short summary for parent or tutor"
}

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

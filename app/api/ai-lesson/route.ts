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

const lessonJsonSchema = {
  name: "novasprout_lesson",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      conceptExplanation: { type: "string" },
      customPlan: {
        type: "object",
        additionalProperties: false,
        properties: {
          focusAreas: { type: "array", items: { type: "string" } },
          recommendedCadence: { type: "string" },
          summary: { type: "string" },
          weeklyPlan: { type: "array", items: { type: "string" } }
        },
        required: ["focusAreas", "recommendedCadence", "summary", "weeklyPlan"]
      },
      duration: { type: "string" },
      fullLessonSegments: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            activity: { type: "string" },
            time: { type: "string" },
            title: { type: "string" }
          },
          required: ["activity", "time", "title"]
        }
      },
      guidedExample: { type: "string" },
      learningObjectives: { type: "array", items: { type: "string" } },
      mode: { type: "string" },
      parentTutorNotes: { type: "string" },
      practiceQuestions: { type: "array", items: { type: "string" } },
      prerequisiteCheck: { type: "array", items: { type: "string" } },
      quickAssessment: { type: "array", items: { type: "string" } },
      recommendedNextSession: { type: "string" },
      studentFit: { type: "string" },
      timedExam: {
        type: "object",
        additionalProperties: false,
        properties: {
          durationMinutes: { type: "number" },
          passingScore: { type: "number" },
          questions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                answerIndex: { type: "number" },
                explanation: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                question: { type: "string" }
              },
              required: ["answerIndex", "explanation", "options", "question"]
            }
          }
        },
        required: ["durationMinutes", "passingScore", "questions"]
      },
      title: { type: "string" },
      warmUp: { type: "string" }
    },
    required: [
      "conceptExplanation",
      "customPlan",
      "duration",
      "fullLessonSegments",
      "guidedExample",
      "learningObjectives",
      "mode",
      "parentTutorNotes",
      "practiceQuestions",
      "prerequisiteCheck",
      "quickAssessment",
      "recommendedNextSession",
      "studentFit",
      "timedExam",
      "title",
      "warmUp"
    ]
  },
  strict: true
};

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

function parseLessonJson(outputText: string) {
  const trimmed = outputText.trim();

  const markdownMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const unwrappedText = markdownMatch?.[1]?.trim() ?? trimmed;
  const firstBrace = unwrappedText.indexOf("{");
  const lastBrace = unwrappedText.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  try {
    return JSON.parse(unwrappedText.slice(firstBrace, lastBrace + 1));
  } catch {
    return null;
  }
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text.slice(0, 500) } };
  }
}

async function requestOpenAiLesson({
  apiKey,
  prompt
}: {
  apiKey: string;
  prompt: string;
}) {
  const body = {
    input: prompt,
    max_output_tokens: 2800,
    model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
    text: {
      format: {
        type: "json_schema",
        ...lessonJsonSchema
      }
    }
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  return {
    payload: await readJsonResponse(response),
    response
  };
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
Create a clear lesson plan. The website will automatically convert your sections into private timed slides, so do not create a separate slide deck.

Student context:
- Grade or level: ${grade}
- Subject: ${subject}
- Topic: ${topic}
- Current level: ${level}
- Parent/student goal: ${goal}
- Requested output: ${mode}
- Session length: ${duration}
- Student question or concern: ${studentQuestion || "No extra question provided."}

For Demo session, make a concise 30-minute style lesson.
For Comprehensive lesson, include 3-4 useful fullLessonSegments.
For Custom study plan, use the student question heavily.
For Timed exam, include 6 multiple-choice questions with one correct answerIndex from 0 to 3.
Use plain text only. Avoid LaTeX backslashes, markdown, code fences, comments, or explanatory text outside the JSON.
Keep every field brief enough that the full response is complete.
Return only the JSON object. Do not include markdown, code fences, comments, or explanatory text outside the JSON.
Keep claims cautious. Do not promise grades, test scores, admissions results, diagnosis, therapy, or guaranteed mastery.
`;

  try {
    const { payload, response } = await requestOpenAiLesson({ apiKey, prompt });

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            payload?.error?.message ??
            payload?.message ??
            `OpenAI returned ${response.status}. Please check billing, model, and API key settings.`
        },
        { status: response.status }
      );
    }

    const outputText = extractOutputText(payload);
    const lesson = parseLessonJson(outputText);

    if (!lesson) {
      return NextResponse.json(
        {
          error:
            "The AI response was incomplete or not valid lesson JSON. Please try Demo session or shorten the topic."
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Could not reach the AI lesson service: ${error.message}`
            : "Could not reach the AI lesson service."
      },
      { status: 500 }
    );
  }
}

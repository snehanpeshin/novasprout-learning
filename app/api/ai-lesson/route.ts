import { NextResponse } from "next/server";
import { aiAccessError, isAiAccessAllowed } from "../../lib/aiAccess";

export const runtime = "nodejs";
export const maxDuration = 60;

const openAiLessonTimeoutMs = 22000;

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

function fallbackLesson({
  duration,
  goal,
  grade,
  level,
  mode,
  studentQuestion,
  subject,
  topic
}: {
  duration: string;
  goal: string;
  grade: string;
  level: string;
  mode: string;
  studentQuestion: string;
  subject: string;
  topic: string;
}) {
  const durationMinutes = Number(duration.match(/\d+/)?.[0] ?? 45);
  const studentFit = `For a ${grade} student studying ${subject.toLowerCase()} who is ${level.toLowerCase()} and wants help with ${topic.toLowerCase()} for ${goal.toLowerCase()}.`;
  const isDigestiveSystem = topic.toLowerCase().includes("digest");

  if (isDigestiveSystem) {
    return {
      conceptExplanation:
        "The digestive system changes food into nutrients the body can use. Food follows one main path: mouth to esophagus to stomach to small intestine to large intestine. Mechanical digestion breaks food into smaller pieces. Chemical digestion uses acid, bile, and enzymes to break large food molecules into smaller nutrients. The small intestine absorbs most nutrients into the blood, while the large intestine absorbs water and prepares waste for removal.",
      customPlan: {
        focusAreas: ["Organ order and function", "Mechanical vs chemical digestion", "Absorption in the small intestine"],
        recommendedCadence: "Start with one diagram-based lesson, then practice organ-function questions and short explanations.",
        summary: "A Grade 7 digestive-system lesson focused on understanding the path of food and how nutrients are absorbed.",
        weeklyPlan: [
          "Session 1: label the digestive organs and trace a meal through the system.",
          "Session 2: compare mechanical and chemical digestion using examples.",
          "Session 3: practice exam-style questions on enzymes, bile, villi, and absorption."
        ]
      },
      duration,
      fullLessonSegments: [
        {
          activity: "Trace the path of food through the main digestive organs and identify what each organ does.",
          time: "0-10 min",
          title: "Food Path"
        },
        {
          activity: "Compare mechanical digestion with chemical digestion using chewing, stomach churning, acid, bile, and enzymes.",
          time: "10-22 min",
          title: "Two Types of Digestion"
        },
        {
          activity: "Follow a sandwich through the system and explain where starch, protein, fat, and nutrients are handled.",
          time: "22-38 min",
          title: "Worked Example"
        },
        {
          activity: "Answer short practice questions about organ order, absorption, and common misconceptions.",
          time: `38-${durationMinutes} min`,
          title: "Practice and Check"
        }
      ],
      guidedExample:
        "Example: Follow a sandwich through digestion. Step 1: In the mouth, teeth break the food apart and saliva begins starch digestion. Step 2: The esophagus moves the swallowed food by peristalsis. Step 3: The stomach churns food and acid helps start protein digestion. Step 4: In the small intestine, enzymes finish digestion and villi absorb nutrients into the blood. Step 5: The large intestine absorbs water and forms waste. Final check: most nutrient absorption happens in the small intestine.",
      learningObjectives: [
        "Put the main digestive organs in the correct order.",
        "Explain the difference between mechanical and chemical digestion.",
        "Describe why villi help the small intestine absorb nutrients."
      ],
      mode,
      parentTutorNotes: `Fallback science lesson generated because live AI was unavailable. Student note: ${studentQuestion || "No extra student question provided."}`,
      practiceQuestions: [
        "Try: Put these in order: stomach, mouth, small intestine, esophagus. Hint: Start where food enters. Answer: mouth to esophagus to stomach to small intestine. Why: food travels through the digestive tract in order.",
        "Try: Is chewing mechanical or chemical digestion? Hint: Ask whether food size or molecules change. Answer: mechanical digestion. Why: chewing physically breaks food into smaller pieces.",
        "Try: Where does most nutrient absorption happen? Hint: Think about villi. Answer: small intestine. Why: villi increase surface area so nutrients can move into the blood.",
        "Try: Does food pass through the liver or pancreas? Hint: They are helper organs. Answer: no. Why: they add chemicals to digestion, but food stays in the digestive tract."
      ],
      prerequisiteCheck: [
        "Can you name three organs in the digestive system?",
        "What does it mean for the body to absorb nutrients?"
      ],
      quickAssessment: [
        "Question: Name the organ where most nutrient absorption happens. Answer: small intestine.",
        "Question: Explain one difference between mechanical and chemical digestion. Answer: mechanical changes food size; chemical changes food molecules.",
        "Question: Why are villi useful? Answer: they increase surface area for absorption."
      ],
      recommendedNextSession:
        "Practice exam-style digestive-system questions using labeled diagrams, organ functions, enzymes, bile, and villi.",
      studentFit,
      timedExam: {
        durationMinutes: Math.min(20, Math.max(10, Math.round(durationMinutes / 3))),
        passingScore: 70,
        questions: [
          {
            answerIndex: 2,
            explanation: "Food enters through the mouth, then moves down the esophagus to the stomach.",
            options: ["Stomach", "Small intestine", "Mouth", "Large intestine"],
            question: "Where does food enter the digestive system?"
          },
          {
            answerIndex: 1,
            explanation: "Chewing physically breaks food into smaller pieces.",
            options: ["Chemical digestion", "Mechanical digestion", "Absorption", "Excretion"],
            question: "What type of digestion is chewing?"
          },
          {
            answerIndex: 2,
            explanation: "The small intestine absorbs most nutrients into the blood.",
            options: ["Mouth", "Stomach", "Small intestine", "Esophagus"],
            question: "Where does most nutrient absorption happen?"
          },
          {
            answerIndex: 3,
            explanation: "Bile helps break fat into smaller droplets so enzymes can work better.",
            options: ["Protein", "Starch", "Water", "Fat"],
            question: "Bile mainly helps digest which nutrient group?"
          },
          {
            answerIndex: 0,
            explanation: "Villi increase surface area for absorption.",
            options: ["They increase surface area", "They chew food", "They make acid", "They store waste"],
            question: "Why are villi important?"
          },
          {
            answerIndex: 1,
            explanation: "Food does not pass through helper organs such as the liver or pancreas.",
            options: ["Food passes through the pancreas", "Food does not pass through the pancreas", "The pancreas stores waste", "The pancreas chews food"],
            question: "Which statement about the pancreas is correct?"
          }
        ]
      },
      title: `${topic} ${mode}`,
      warmUp: "Name three digestive organs and write one job for each. Then circle the organ where most nutrients are absorbed."
    };
  }

  return {
    conceptExplanation: `${topic} becomes easier when the student first understands the main idea, sees one clear model, and then practices in small steps. The tutor should connect each step back to the student's question and check understanding before moving forward.`,
    customPlan: {
      focusAreas: [`Core idea of ${topic}`, "Step-by-step problem solving", "Independent practice with feedback"],
      recommendedCadence: "Start with one focused session, then review progress before scheduling the next lesson.",
      summary: `A short personalized plan for ${topic} based on the selected grade, level, and goal.`,
      weeklyPlan: [
        `Session 1: introduce ${topic} with a simple model and guided example.`,
        "Session 2: practice mixed examples and correct common mistakes.",
        "Session 3: apply the idea to homework-style or test-style questions."
      ]
    },
    duration,
    fullLessonSegments: [
      {
        activity: `Introduce the goal of the lesson and ask what feels confusing about ${topic}.`,
        time: "0-5 min",
        title: "Set the Goal"
      },
      {
        activity: `Explain the core idea of ${topic} using plain language and one visual or example.`,
        time: "5-15 min",
        title: "Build the Concept"
      },
      {
        activity: "Work through one guided example slowly, asking the student to explain each step.",
        time: "15-30 min",
        title: "Guided Example"
      },
      {
        activity: "Give the student short practice questions, correct mistakes, and summarize the next step.",
        time: `30-${durationMinutes} min`,
        title: "Practice and Check"
      }
    ],
    guidedExample: `Tutor model: Start with a simple ${topic} question. Identify what is given, choose the first step, solve carefully, and check whether the answer makes sense.`,
    learningObjectives: [
      `Explain the main idea of ${topic} in simple words.`,
      `Solve a guided ${topic} example with support.`,
      `Try independent practice and identify one next area to improve.`
    ],
    mode,
    parentTutorNotes: `This fallback lesson was generated without live AI because the AI service was unavailable. A tutor can still use it as a structured starting point and personalize examples during the session. Student note: ${studentQuestion || "No extra student question provided."}`,
    practiceQuestions: [
      `What is the most important idea to remember about ${topic}?`,
      `Solve one beginner-level ${topic} example and show each step.`,
      `Create one question about ${topic} that you still want to ask.`
    ],
    prerequisiteCheck: [
      `What do you already know about ${topic}?`,
      "Which step usually feels hardest: starting, solving, checking, or explaining?"
    ],
    quickAssessment: [
      `Explain ${topic} in one sentence.`,
      "Solve one similar question without looking at the guided example."
    ],
    recommendedNextSession: `Continue with targeted practice on ${topic}, using the student's mistakes from this session to choose the next examples.`,
    studentFit,
    timedExam: {
      durationMinutes: Math.min(20, Math.max(10, Math.round(durationMinutes / 3))),
      passingScore: 70,
      questions: [
        {
          answerIndex: 1,
          explanation: "A good first step is to identify what the question is asking before solving.",
          options: ["Guess quickly", "Identify the goal", "Skip the example", "Memorize only"],
          question: `What should you do first when solving a ${topic} problem?`
        },
        {
          answerIndex: 2,
          explanation: "Checking helps catch mistakes and improves confidence.",
          options: ["It wastes time", "It changes the topic", "It helps catch mistakes", "It removes all practice"],
          question: "Why is checking your answer useful?"
        },
        {
          answerIndex: 0,
          explanation: "Explaining steps shows whether the concept is understood.",
          options: ["Explain each step", "Hide your work", "Avoid questions", "Only copy answers"],
          question: "Which habit best supports learning?"
        },
        {
          answerIndex: 3,
          explanation: "Asking a focused question helps the tutor personalize support.",
          options: ["Say nothing", "Change subject", "Rush ahead", "Ask a focused question"],
          question: "What should you do if a step is confusing?"
        },
        {
          answerIndex: 1,
          explanation: "Short practice with feedback is usually better than passive reading only.",
          options: ["Only read notes", "Practice with feedback", "Avoid examples", "Skip review"],
          question: "Which method helps most after a guided example?"
        },
        {
          answerIndex: 0,
          explanation: "A next step should target the student's current weak spot.",
          options: ["Target the weak spot", "Repeat everything forever", "Stop practicing", "Ignore mistakes"],
          question: "What makes a next session useful?"
        }
      ]
    },
    title: `${topic} ${mode}`,
    warmUp: `In two minutes, write what you already know about ${topic} and one question you want answered today.`
  };
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), openAiLessonTimeoutMs);
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

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    return {
      payload: await readJsonResponse(response),
      response
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!isAiAccessAllowed(request)) {
    return NextResponse.json({ error: aiAccessError }, { status: 401 });
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

  if (!apiKey) {
    return NextResponse.json({
      lesson: fallbackLesson({ duration, goal, grade, level, mode, studentQuestion, subject, topic }),
      warning: "OPENAI_API_KEY is not configured for this deployment. A fallback lesson was generated instead."
    });
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
Make the output usable as independent student study material, not just a tutor plan.
Include essential vocabulary in the conceptExplanation when relevant.
Make guidedExample include clear steps and a final check.
Make practiceQuestions self-contained and include a short hint and answer/explanation in plain text, for example: "Try: ... Hint: ... Answer: ... Why: ..."
Make quickAssessment include answerable questions with brief answer/explanation text when possible.
Avoid teacher-only wording such as "whole-class", "tutor-guided move", "teacher should", or "ask the student to" in student-facing explanation fields.
Use ASCII arrows as "to" instead of "->".
Use plain text only. Avoid LaTeX backslashes, markdown, code fences, comments, or explanatory text outside the JSON.
Keep every field brief enough that the full response is complete.
Return only the JSON object. Do not include markdown, code fences, comments, or explanatory text outside the JSON.
Keep claims cautious. Do not promise grades, test scores, admissions results, diagnosis, therapy, or guaranteed mastery.
`;

  try {
    const { payload, response } = await requestOpenAiLesson({ apiKey, prompt });

    if (!response.ok) {
      return NextResponse.json({
        lesson: fallbackLesson({ duration, goal, grade, level, mode, studentQuestion, subject, topic }),
        warning:
          payload?.error?.message ??
          payload?.message ??
          `OpenAI returned ${response.status}. A fallback lesson was generated instead.`
      });
    }

    const outputText = extractOutputText(payload);
    const lesson = parseLessonJson(outputText);

    if (!lesson) {
      return NextResponse.json({
        lesson: fallbackLesson({ duration, goal, grade, level, mode, studentQuestion, subject, topic }),
        warning: "The AI response was incomplete, so a fallback lesson was generated instead."
      });
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json({
      lesson: fallbackLesson({ duration, goal, grade, level, mode, studentQuestion, subject, topic }),
      warning:
        timedOut
          ? "The AI lesson service took too long, so a fallback lesson was generated instead."
          : error instanceof Error
          ? `Could not reach the AI lesson service: ${error.message}. A fallback lesson was generated instead.`
          : "Could not reach the AI lesson service. A fallback lesson was generated instead."
    });
  }
}

import { NextResponse } from "next/server";

export const runtime = "nodejs";

type SlideAssetRequest = {
  context?: {
    grade?: string;
    subject?: string;
    topic?: string;
  };
  lesson?: {
    conceptExplanation?: string;
    guidedExample?: string;
    learningObjectives?: string[];
    practiceQuestions?: string[];
    quickAssessment?: string[];
    title?: string;
    warmUp?: string;
  };
  slideTitles?: string[];
};

const assetSchema = {
  name: "novasprout_slide_assets",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      assets: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            assetId: { type: "string" },
            alt: { type: "string" },
            aspectRatio: { type: "string" },
            caption: { type: "string" },
            educationalPurpose: { type: "string" },
            filename: { type: "string" },
            latex: { type: "string" },
            placement: { type: "string" },
            prompt: { type: "string" },
            type: { type: "string", enum: ["image", "latex"] }
          },
          required: [
            "assetId",
            "alt",
            "aspectRatio",
            "caption",
            "educationalPurpose",
            "filename",
            "latex",
            "placement",
            "prompt",
            "type"
          ]
        }
      }
    },
    required: ["assets"]
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

function parseJson(outputText: string) {
  try {
    return JSON.parse(outputText);
  } catch {
    const firstBrace = outputText.indexOf("{");
    const lastBrace = outputText.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }

    try {
      return JSON.parse(outputText.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
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

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const expectedAccessToken = process.env.AI_LESSON_ACCESS_TOKEN?.trim();
  const providedAccessToken = request.headers.get("x-ai-access-token")?.trim();

  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
  }

  if (!expectedAccessToken || providedAccessToken !== expectedAccessToken) {
    return NextResponse.json({ error: "Enter the NovaSprout AI access code to use this tool." }, { status: 401 });
  }

  let body: SlideAssetRequest;
  try {
    body = (await request.json()) as SlideAssetRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const grade = cleanText(body.context?.grade, 40);
  const subject = cleanText(body.context?.subject, 60);
  const topic = cleanText(body.context?.topic, 90);
  const title = cleanText(body.lesson?.title, 120);
  const slideTitles = (body.slideTitles ?? []).map((item) => cleanText(item, 80)).filter(Boolean).slice(0, 14);

  if (!grade || !subject || !topic || !title || !slideTitles.length) {
    return NextResponse.json({ error: "Missing lesson, context, or slide titles." }, { status: 400 });
  }

  const prompt = `
Create an asset plan for a NovaSprout Learning student lesson deck.

Context:
- Grade: ${grade}
- Subject: ${subject}
- Topic: ${topic}
- Lesson title: ${title}
- Slide titles:
${slideTitles.map((item, index) => `${index + 1}. ${item}`).join("\n")}

Lesson details:
- Objectives: ${(body.lesson?.learningObjectives ?? []).join(" | ")}
- Warm-up: ${body.lesson?.warmUp ?? ""}
- Concept: ${body.lesson?.conceptExplanation ?? ""}
- Example: ${body.lesson?.guidedExample ?? ""}
- Practice: ${(body.lesson?.practiceQuestions ?? []).slice(0, 4).join(" | ")}
- Quick checks: ${(body.lesson?.quickAssessment ?? []).join(" | ")}

Return a compact JSON object with 4 to 7 assets total.
Use two asset types:
- image: a kid-friendly educational diagram prompt, no text labels inside the image
- latex: a short formula, symbolic relationship, or structured notation when helpful

Every asset must include:
- assetId: short stable ID such as slide-4-ratio-bars
- placement: slide number plus position code
- filename: deterministic local filename for image assets, such as slide-4-ratio-bars.png; empty string for latex assets
- prompt: image prompt for image assets; empty string for latex assets
- latex: formula or notation for latex assets; empty string for image assets
- alt: concise meaningful alt text
- educationalPurpose: how this asset helps the student learn
- aspectRatio: expected shape such as 1:1, 4:3, or 16:9
- caption: short student-friendly caption, or empty string

Placement codes must be slide number plus position:
lt, ct, rt, lm, cm, rm, lb, cb, rb.
Example: 1lb means slide 1, left bottom.

Rules:
- Create at most 3 image assets.
- Do not put images on every slide.
- Do not create decorative images. Every image must clarify the lesson.
- Prefer images for concept, example, or practice slides.
- Prefer latex for math/science formulas and concise symbolic notation.
- If no latex is useful for a slide, do not create a latex asset for that slide.
- Use only slide numbers that exist in the slide-title list.
- Return only JSON.
`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: prompt,
        max_output_tokens: 1800,
        model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
        text: {
          format: {
            type: "json_schema",
            ...assetSchema
          }
        }
      })
    });

    const payload = await readJsonResponse(response);

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.error?.message ?? "Could not generate slide assets." },
        { status: response.status }
      );
    }

    const parsed = parseJson(extractOutputText(payload));
    if (!parsed?.assets?.length) {
      return NextResponse.json({ error: "The AI did not return a usable asset plan." }, { status: 502 });
    }

    return NextResponse.json({ assets: parsed.assets });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Could not reach the AI asset planner: ${error.message}`
            : "Could not reach the AI asset planner."
      },
      { status: 500 }
    );
  }
}

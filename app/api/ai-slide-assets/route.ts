import { NextResponse } from "next/server";
import { aiAccessError, isAiAccessAllowed } from "../../lib/aiAccess";

export const runtime = "nodejs";
export const maxDuration = 300;

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

function placementForSlide(slideTitles: string[], titlePattern: RegExp, fallbackSlide: number, position: string) {
  const slideIndex = slideTitles.findIndex((title) => titlePattern.test(title));
  return `${slideIndex >= 0 ? slideIndex + 1 : fallbackSlide}${position}`;
}

function deterministicAssetPlan({
  grade,
  slideTitles,
  subject,
  topic
}: {
  grade: string;
  slideTitles: string[];
  subject: string;
  topic: string;
}) {
  const normalizedTopic = topic.toLowerCase();
  const normalizedSubject = subject.toLowerCase();

  if (normalizedTopic.includes("digest")) {
    return [
      {
        assetId: "digestive-system-anatomy-image",
        alt: "Student-friendly digestive system anatomical illustration without text labels.",
        aspectRatio: "1:1",
        caption: "A visual overview of the digestive organs.",
        educationalPurpose: "Helps students recognize the organs before reading the labeled diagram.",
        filename: "digestive-system-anatomy.png",
        latex: "",
        placement: placementForSlide(slideTitles, /digestive system map/i, 8, "rb"),
        prompt:
          `${grade} friendly clean educational anatomical illustration of the human digestive system, showing mouth, esophagus, stomach, small intestine, large intestine, liver, pancreas, simplified for middle school science, colorful flat medical illustration, no text, no labels, white background`,
        type: "image"
      }
    ];
  }

  if (normalizedSubject.includes("science")) {
    return [
      {
        assetId: "science-concept-image",
        alt: `Student-friendly science diagram for ${topic}.`,
        aspectRatio: "1:1",
        caption: "A visual model for the science idea.",
        educationalPurpose: `Helps students visualize ${topic}.`,
        filename: "science-concept-image.png",
        latex: "",
        placement: placementForSlide(slideTitles, /visual|model|understand/i, 6, "rb"),
        prompt: `${grade} friendly clean educational science illustration for ${topic}, simple visual model, no words, no labels, white background`,
        type: "image"
      }
    ];
  }

  return [];
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
  if (!isAiAccessAllowed(request)) {
    return NextResponse.json({ error: aiAccessError }, { status: 401 });
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
  const slideTitles = (body.slideTitles ?? []).map((item) => cleanText(item, 80)).filter(Boolean).slice(0, 20);

  if (!grade || !subject || !topic || !title || !slideTitles.length) {
    return NextResponse.json({ error: "Missing lesson, context, or slide titles." }, { status: 400 });
  }

  const deterministicAssets = deterministicAssetPlan({ grade, slideTitles, subject, topic });
  if (deterministicAssets.length) {
    return NextResponse.json({ assets: deterministicAssets });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
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

Return a compact JSON object with 8 to 12 assets total.
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
- Create 3 to 4 image assets when the topic benefits from diagrams or models.
- Create latex/notation overlays for as many concept, example, and practice slides as useful.
- Do not put image assets on every slide, but most slides should have either an image or a latex overlay.
- Do not create decorative images. Every image must clarify the lesson.
- Prefer images for slides where a visual most improves understanding: concept, diagram, model, graph, experiment, worked example, or practice.
- For math, prefer visual models such as bars, number lines, coordinate grids, geometric sketches, or proportional tables.
- For science, prefer process diagrams, experiment setups, cause/effect models, or observation diagrams.
- For ELA/study skills, prefer organizing visuals such as flowcharts, annotation models, or planning maps.
- For coding/data, prefer flow diagrams, input-process-output models, table/chart concepts, or dashboard sketches.
- Prefer latex for math/science formulas and concise symbolic notation.
- Use varied indexed placements such as 2rb, 3lb, 4rm, 6cb, 7rt; avoid stacking multiple assets in the same place unless intentional.
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
        max_output_tokens: 3200,
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
      const fallbackAssets = deterministicAssetPlan({ grade, slideTitles, subject, topic });
      if (fallbackAssets.length) {
        return NextResponse.json({ assets: fallbackAssets });
      }

      return NextResponse.json({ error: payload?.error?.message ?? "Could not generate slide assets." }, { status: response.status });
    }

    const parsed = parseJson(extractOutputText(payload));
    if (!parsed?.assets?.length) {
      const fallbackAssets = deterministicAssetPlan({ grade, slideTitles, subject, topic });
      if (fallbackAssets.length) {
        return NextResponse.json({ assets: fallbackAssets });
      }

      return NextResponse.json({ error: "The AI did not return a usable asset plan." }, { status: 502 });
    }

    return NextResponse.json({ assets: parsed.assets });
  } catch (error) {
    const fallbackAssets = deterministicAssetPlan({ grade, slideTitles, subject, topic });
    if (fallbackAssets.length) {
      return NextResponse.json({ assets: fallbackAssets });
    }

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

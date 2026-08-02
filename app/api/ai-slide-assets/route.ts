import { NextResponse } from "next/server.js";
import { aiAccessError, isAiAccessAllowed } from "../../lib/aiAccess.ts";
import type { ConceptGraph } from "../../lib/lessonEngine.ts";
import { legacyLessonToSlidePlan, type AiVisualDirection } from "../../lib/lessonSlidePlan.ts";
import { assetsFromAiVisualPlan } from "../../lib/aiSlideAssets.ts";
import { deterministicAssetPlan, mergeFallbackImages } from "../../lib/deterministicSlideAssets.ts";
import { restoreVisualPlanFromLesson } from "../../lib/visualPlanBridge.ts";

export const runtime = "nodejs";
export const maxDuration = 300;

type SlideAssetRequest = {
  context?: {
    grade?: string;
    subject?: string;
    topic?: string;
  };
  lesson?: {
    conceptModel?: Partial<ConceptGraph>;
    conceptExplanation?: string;
    duration?: string;
    fullLessonSegments?: Array<{ activity?: string; time?: string; title?: string }>;
    guidedExample?: string;
    learningObjectives?: string[];
    practiceQuestions?: string[];
    prerequisiteCheck?: string[];
    quickAssessment?: string[];
    recommendedNextSession?: string;
    studentFit?: string;
    title?: string;
    visualPlan?: AiVisualDirection[];
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
  if (!(await isAiAccessAllowed(request))) {
    return NextResponse.json({ error: aiAccessError }, { status: 401 });
  }

  let body: SlideAssetRequest;
  try {
    body = (await request.json()) as SlideAssetRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.lesson) {
    body = { ...body, lesson: restoreVisualPlanFromLesson(body.lesson) };
  }

  const grade = cleanText(body.context?.grade, 40);
  const subject = cleanText(body.context?.subject, 60);
  const topic = cleanText(body.context?.topic, 90);
  const title = cleanText(body.lesson?.title, 120);
  const providedSlideTitles = (body.slideTitles ?? [])
    .map((item) => cleanText(item, 80))
    .filter(Boolean)
    .slice(0, 60);
  const visualPlan = body.lesson?.visualPlan ?? [];

  if (!grade || !subject || !topic || !title) {
    return NextResponse.json({ error: "Missing lesson or context." }, { status: 400 });
  }

  if (visualPlan.length) {
    const directSlideTitles = providedSlideTitles.length
      ? providedSlideTitles
      : [
          title,
          ...visualPlan.map((direction) => cleanText(direction.targetTitle, 80)).filter(Boolean)
        ].slice(0, 60);
    const directedAssets = assetsFromAiVisualPlan({ grade, slideTitles: directSlideTitles, subject, topic, visualPlan });
    const fallbackAssets = deterministicAssetPlan({ grade, slideTitles: directSlideTitles, subject, topic });
    return NextResponse.json({ assets: mergeFallbackImages(directedAssets, fallbackAssets) });
  }

  const slideTitles = providedSlideTitles.length
    ? providedSlideTitles
    : legacyLessonToSlidePlan({
        context: body.context,
        lesson: body.lesson
      }).slides.map((slide) => slide.title).slice(0, 60);

  if (!slideTitles.length) {
    return NextResponse.json({ error: "Missing lesson or context." }, { status: 400 });
  }

  const deterministicAssets = deterministicAssetPlan({ grade, slideTitles, subject, topic });
  const useAiAssetPlanner = process.env.ENABLE_AI_ASSET_PLANNER?.trim().toLowerCase() !== "false";
  if (!useAiAssetPlanner) {
    return NextResponse.json({ assets: deterministicAssets });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ assets: deterministicAssets });
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
- AI visual directions: ${JSON.stringify((body.lesson?.visualPlan ?? []).slice(0, 60))}
- Concept relationships: ${JSON.stringify((body.lesson?.conceptModel?.relationships ?? []).slice(0, 30))}

Return a compact JSON object containing only assets that materially improve this specific lesson. There is no required asset count and an empty assets array is valid when the built-in visual plan is already sufficient.
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
- Follow the lesson AI's visual directions and concept relationships instead of applying a fixed subject template.
- You may plan generated images for up to three slides where a realistic, spatial, anatomical, geographic, experimental, or object-based illustration adds meaning that the built-in diagrams cannot provide.
- The image prompt must specify the important parts, accurate spatial relationships, process cues, age level, view angle, visual hierarchy, and intended educational purpose. Ask for no embedded words or labels.
- Create latex/notation overlays for concept, example, and practice slides only when symbolic notation materially improves understanding.
- Every asset must be instructional. Decorative boxes, random icons, and generic labels do not count.
- Do not create decorative images. Every image must clarify the lesson.
- Prefer images for physical systems, maps, experiment setups, real objects, or spatial structures that cannot be represented faithfully by programmatic diagrams.
- For math, prefer visual models such as bars, number lines, coordinate grids, geometric sketches, or proportional tables.
- For science, prefer process diagrams, experiment setups, cause/effect models, or observation diagrams.
- For ELA/study skills, prefer organizing visuals such as flowcharts, annotation models, or planning maps.
- For coding/data, prefer flow diagrams, input-process-output models, table/chart concepts, or dashboard sketches.
- Prefer latex for math/science formulas and concise symbolic notation.
- Use indexed placement for the image and varied placements for notation, such as 2rb, 3lb, 4rm, 6cb, 7rt. Avoid stacking assets in the same place.
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
      }),
      signal: AbortSignal.timeout(22_000)
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
    if (!Array.isArray(parsed?.assets)) {
      return NextResponse.json({ assets: deterministicAssets });
    }

    const selectedAssets = parsed.assets.filter((asset: { placement?: unknown; type?: unknown }) =>
      typeof asset?.placement === "string" && ["image", "latex"].includes(String(asset?.type))
    );
    const imageAssets = selectedAssets.filter((asset: { type?: string }) => asset.type === "image").slice(0, 3);
    const latexAssets = selectedAssets.filter((asset: { type?: string }) => asset.type === "latex").slice(0, 16);
    return NextResponse.json({
      assets: mergeFallbackImages([...imageAssets, ...latexAssets], deterministicAssets)
    });
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

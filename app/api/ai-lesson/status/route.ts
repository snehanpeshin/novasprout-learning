import { NextResponse } from "next/server";
import { aiAccessError, isAiAccessAllowed } from "../../../lib/aiAccess";
import { extractAiLessonOutputText, parseAiLessonJson } from "../../../lib/aiLessonResponse";

export const runtime = "nodejs";
export const maxDuration = 30;

const validResponseId = /^resp_[A-Za-z0-9_-]{8,200}$/;

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text.slice(0, 500) } };
  }
}

export async function GET(request: Request) {
  if (!isAiAccessAllowed(request)) {
    return NextResponse.json({ error: aiAccessError }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured for this deployment." },
      { status: 503 }
    );
  }

  const responseId = new URL(request.url).searchParams.get("responseId")?.trim() ?? "";
  if (!validResponseId.test(responseId)) {
    return NextResponse.json({ error: "Invalid lesson response ID." }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);

  try {
    const response = await fetch(`https://api.openai.com/v1/responses/${encodeURIComponent(responseId)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      method: "GET",
      signal: controller.signal
    });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.error?.message ?? `OpenAI returned ${response.status}.` },
        { status: response.status === 404 ? 404 : 502 }
      );
    }

    const status = typeof payload?.status === "string" ? payload.status : "unknown";
    if (["queued", "in_progress"].includes(status)) {
      return NextResponse.json({ responseId, status }, { headers: { "Cache-Control": "no-store" } });
    }

    if (status === "completed") {
      const lesson = parseAiLessonJson(extractAiLessonOutputText(payload));
      if (!lesson) {
        return NextResponse.json(
          { error: "The AI lesson finished but returned incomplete content. Please generate it again." },
          { status: 422 }
        );
      }

      return NextResponse.json(
        { lesson, responseId, status },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const failureMessage =
      payload?.error?.message ??
      payload?.incomplete_details?.reason ??
      `Lesson generation ended with status: ${status}.`;
    return NextResponse.json({ error: failureMessage }, { status: 502 });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      {
        error: timedOut
          ? "The lesson status check took too long. NovaSprout will keep trying."
          : error instanceof Error
            ? `Could not check the AI lesson: ${error.message}.`
            : "Could not check the AI lesson."
      },
      { status: timedOut ? 504 : 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}

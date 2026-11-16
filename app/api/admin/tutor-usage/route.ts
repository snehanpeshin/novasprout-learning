import { NextResponse } from "next/server.js";
import { isAdminAllowed } from "../../../lib/adminAccess.ts";
import { readTutorUsage } from "../../../lib/tutorAnalytics.ts";
export const runtime = "nodejs";
export const maxDuration = 15;
const headers = { "Cache-Control": "private, no-store", "Vary": "x-admin-token" };
export async function GET(request: Request) {
  if (!isAdminAllowed(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  try {
    const usage = await readTutorUsage();
    return NextResponse.json({ usage, configuration: {
      generationConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
      model: process.env.OPENAI_MODEL || "gpt-6-sol",
      privateDemoConfigured: Boolean(process.env.AI_LESSON_ACCESS_TOKEN?.trim())
    } }, { headers });
  } catch {
    return NextResponse.json({ error: "Tutor activity could not be loaded. Check the AI usage ledger and refresh." }, { status: 503, headers });
  }
}

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const allowedSubjects = new Set(["Math", "Science & STEM", "Coding & Data Skills", "Study Skills", "Not sure yet"]);

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (clean(body.website, 100)) return NextResponse.json({ ok: true });

    const lead = {
      name: clean(body.name, 80),
      email: clean(body.email, 120).toLowerCase(),
      grade_level: clean(body.grade, 60),
      subject: clean(body.subject, 60),
      goal: clean(body.goal, 240),
      availability: clean(body.availability, 120),
      timezone: clean(body.timezone, 80),
      message: clean(body.message, 800)
    };

    if (
      !lead.name ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) ||
      !lead.grade_level ||
      !allowedSubjects.has(lead.subject) ||
      !lead.goal ||
      !lead.availability ||
      !lead.timezone
    ) {
      return NextResponse.json({ error: "Please complete the required fields." }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Request storage is not configured." }, { status: 503 });
    }

    const recent = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const duplicateCheck = await fetch(
      `${supabaseUrl}/rest/v1/demo_requests?email=eq.${encodeURIComponent(lead.email)}&created_at=gte.${encodeURIComponent(recent)}&select=id&limit=1`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" }
    );
    if (duplicateCheck.ok && ((await duplicateCheck.json()) as unknown[]).length > 0) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const saved = await fetch(`${supabaseUrl}/rest/v1/demo_requests`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(lead)
    });
    if (!saved.ok) throw new Error("Could not save demo request");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to save the request." }, { status: 500 });
  }
}

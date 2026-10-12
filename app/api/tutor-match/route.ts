import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cleanTutorMatchRequest, createTutorMatch, getTutorMatch, tutorPortalCookie } from "../../lib/tutorMatch";

export const runtime = "nodejs";

export async function GET() {
  try {
    const accessToken = (await cookies()).get(tutorPortalCookie)?.value;
    return NextResponse.json({ match: await getTutorMatch(accessToken) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Your family portal is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true });
    const matchRequest = cleanTutorMatchRequest(body);
    if (!matchRequest) return NextResponse.json({ error: "Please complete each matching detail." }, { status: 400 });
    const { accessToken, id } = await createTutorMatch(matchRequest);
    const response = NextResponse.json({ id, ok: true });
    response.cookies.set(tutorPortalCookie, accessToken, { httpOnly: true, maxAge: 60 * 60 * 24 * 90, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    return response;
  } catch {
    return NextResponse.json({ error: "We could not open the family portal. Please try again shortly." }, { status: 503 });
  }
}

import crypto from "node:crypto";
import { supabaseFetch } from "./supabase";

export const tutorSubjects = ["Math", "Science & STEM", "Coding & Data Skills", "Study Skills"] as const;
export const tutorPlans = ["demo", "single", "monthly"] as const;
export type TutorSubject = typeof tutorSubjects[number];
export type TutorPlan = typeof tutorPlans[number];
type TutorMatchStatus = "requested" | "reviewing" | "matched" | "demo_scheduled" | "paid" | "active" | "closed";

export type TutorMatchSummary = {
  id: string; status: TutorMatchStatus; subject: TutorSubject; studentLevel: string;
  requestedPlan: TutorPlan; tutorLabel: string | null; nextStep: string | null; updatedAt: string;
};
export type TutorMatchRequest = {
  availability: string; email: string; goal: string; name: string; plan: TutorPlan;
  studentLevel: string; subject: TutorSubject; timezone: string;
};
export const tutorPortalCookie = "novasprout_tutor_portal";

export function hashPortalAccess(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function cleanTutorMatchRequest(input: Record<string, unknown>): TutorMatchRequest | null {
  const clean = (value: unknown, maximum: number) => typeof value === "string" ? value.trim().slice(0, maximum) : "";
  const subject = clean(input.subject, 60) as TutorSubject;
  const plan = clean(input.plan, 20) as TutorPlan;
  const match = {
    availability: clean(input.availability, 120), email: clean(input.email, 120).toLowerCase(),
    goal: clean(input.goal, 500), name: clean(input.name, 80), plan,
    studentLevel: clean(input.studentLevel, 60), subject, timezone: clean(input.timezone, 80)
  };
  if (!match.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(match.email) || !match.studentLevel || !match.goal || !match.availability || !match.timezone || !tutorSubjects.includes(subject) || !tutorPlans.includes(plan)) return null;
  return match;
}

export async function createTutorMatch(request: TutorMatchRequest) {
  const accessToken = crypto.randomBytes(32).toString("base64url");
  const id = crypto.randomUUID();
  await supabaseFetch("tutor_match_requests", {
    body: JSON.stringify({
      id, parent_email: request.email, parent_name: request.name, portal_access_hash: hashPortalAccess(accessToken),
      requested_plan: request.plan, student_level: request.studentLevel, subject: request.subject,
      availability: request.availability, goal: request.goal, timezone: request.timezone
    }),
    headers: { Prefer: "return=minimal" }, method: "POST"
  });
  return { accessToken, id };
}

export async function getTutorMatch(accessToken: string | undefined): Promise<TutorMatchSummary | null> {
  if (!accessToken || accessToken.length < 40 || accessToken.length > 100) return null;
  const response = await supabaseFetch(
    `tutor_match_requests?portal_access_hash=eq.${encodeURIComponent(hashPortalAccess(accessToken))}&select=id,status,subject,student_level,requested_plan,tutor_label,next_step,updated_at&limit=1`
  );
  const rows = await response.json() as Array<{
    id: string; status: TutorMatchStatus; subject: TutorSubject; student_level: string; requested_plan: TutorPlan;
    tutor_label: string | null; next_step: string | null; updated_at: string;
  }>;
  const row = rows[0];
  return row ? {
    id: row.id, nextStep: row.next_step, requestedPlan: row.requested_plan, status: row.status,
    studentLevel: row.student_level, subject: row.subject, tutorLabel: row.tutor_label, updatedAt: row.updated_at
  } : null;
}

export async function markTutorMatchPaid(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await supabaseFetch(`tutor_match_requests?id=eq.${encodeURIComponent(id)}`, {
    body: JSON.stringify({ status: "paid" }), headers: { Prefer: "return=minimal" }, method: "PATCH"
  });
}

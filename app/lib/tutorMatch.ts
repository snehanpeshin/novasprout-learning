import crypto from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const database = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AI_USAGE_REGION || "us-east-1", maxAttempts: 3 }), {
  marshallOptions: { removeUndefinedValues: true }
});

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

function table() {
  const name = process.env.AI_USAGE_TABLE;
  if (!name) throw new Error("The family portal is temporarily unavailable.");
  return name;
}

function recordId(accessToken: string) {
  return "tutor:match:v1:" + hashPortalAccess(accessToken);
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
  const id = recordId(accessToken);
  const now = new Date().toISOString();
  await database.send(new PutCommand({
    TableName: table(),
    Item: {
      id,
      type: "tutor-match",
      status: "requested",
      parentEmail: request.email,
      parentName: request.name,
      requestedPlan: request.plan,
      studentLevel: request.studentLevel,
      subject: request.subject,
      availability: request.availability,
      goal: request.goal,
      timezone: request.timezone,
      createdAt: now,
      updatedAt: now
    },
    ConditionExpression: "attribute_not_exists(id)"
  }));
  return { accessToken, id };
}

export async function getTutorMatch(accessToken: string | undefined): Promise<TutorMatchSummary | null> {
  if (!accessToken || accessToken.length < 40 || accessToken.length > 100) return null;
  const result = await database.send(new GetCommand({ TableName: table(), Key: { id: recordId(accessToken) }, ConsistentRead: true }));
  const item = result.Item;
  if (!item || item.type !== "tutor-match" || !tutorSubjects.includes(item.subject as TutorSubject) || !tutorPlans.includes(item.requestedPlan as TutorPlan)) return null;
  return {
    id: item.id,
    nextStep: typeof item.nextStep === "string" ? item.nextStep : null,
    requestedPlan: item.requestedPlan as TutorPlan,
    status: item.status as TutorMatchStatus,
    studentLevel: String(item.studentLevel || ""),
    subject: item.subject as TutorSubject,
    tutorLabel: typeof item.tutorLabel === "string" ? item.tutorLabel : null,
    updatedAt: String(item.updatedAt || "")
  };
}

export async function markTutorMatchPaid(id: string) {
  if (!id.startsWith("tutor:match:v1:")) return;
  await database.send(new UpdateCommand({
    TableName: table(),
    Key: { id },
    UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
    ExpressionAttributeNames: { "#status": "status", "#updatedAt": "updatedAt" },
    ExpressionAttributeValues: { ":status": "paid", ":updatedAt": new Date().toISOString() }
  }));
}

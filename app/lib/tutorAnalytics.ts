import crypto from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

export const tutorEvents = ["lessons", "replies", "videos", "illustrations", "narrations"] as const;
export type TutorEvent = typeof tutorEvents[number];
export type TutorCounts = Record<TutorEvent, number>;
export type TutorUsageReport = {
  days: Array<TutorCounts & { date: string }>;
  totals: TutorCounts;
  trackingSince: string | null;
  generatedAt: string;
  timeZone: "UTC";
};
const database = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: process.env.AI_USAGE_REGION || "us-east-1", maxAttempts: 2
}));
const emptyCounts = (): TutorCounts => ({ lessons: 0, replies: 0, videos: 0, illustrations: 0, narrations: 0 });
function table() {
  const name = process.env.AI_USAGE_TABLE?.trim();
  if (!name) throw new Error("Tutor activity reporting is not configured.");
  return name;
}

// Only counts and hashed deduplication keys are stored, never learner text or identities.
// Reporting failures must not prevent delivery of a completed lesson.
export async function recordTutorActivity(event: TutorEvent, eventId: string, now = new Date()) {
  if (!tutorEvents.includes(event) || !eventId) return false;
  try {
    const date = now.toISOString().slice(0, 10);
    const marker = crypto.createHash("sha256").update(event + ":" + eventId).digest("hex");
    const expiresAt = Math.floor(now.getTime() / 1000) + 35 * 86400;
    await database.send(new TransactWriteCommand({ TransactItems: [
      { Put: { TableName: table(), Item: { id: "tutor:event:" + marker, expiresAt }, ConditionExpression: "attribute_not_exists(id)" } },
      { Update: { TableName: table(), Key: { id: "tutor:day:" + date },
        UpdateExpression: "SET #ttl = :ttl ADD #event :one",
        ExpressionAttributeNames: { "#ttl": "expiresAt", "#event": event },
        ExpressionAttributeValues: { ":ttl": expiresAt, ":one": 1 } } },
      { Update: { TableName: table(), Key: { id: "tutor:tracking" },
        UpdateExpression: "SET startedAt = if_not_exists(startedAt, :now)",
        ExpressionAttributeValues: { ":now": now.toISOString() } } }
    ] }), { abortSignal: AbortSignal.timeout(2000) });
    return true;
  } catch (error) {
    if (!(error instanceof Error && error.name === "TransactionCanceledException")) {
      console.error("[tutor-activity] Reporting write unavailable.");
    }
    return false;
  }
}

export async function readTutorUsage(now = new Date()): Promise<TutorUsageReport> {
  const tableName = table();
  const dates = Array.from({ length: 14 }, (_, index) =>
    new Date(now.getTime() - (13 - index) * 86400000).toISOString().slice(0, 10));
  const signal = AbortSignal.timeout(5000);
  const [tracking, ...records] = await Promise.all(["tutor:tracking", ...dates.map(date => "tutor:day:" + date)]
    .map(id => database.send(new GetCommand({ TableName: tableName, Key: { id }, ConsistentRead: true }), { abortSignal: signal })));
  const days = dates.map((date, index) => {
    const counts = emptyCounts();
    for (const event of tutorEvents) {
      const value: unknown = records[index].Item?.[event];
      counts[event] = typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0;
    }
    return { date, ...counts };
  });
  const totals = emptyCounts();
  for (const day of days) for (const event of tutorEvents) totals[event] += day[event];
  const started = tracking.Item?.startedAt;
  return { days, totals, trackingSince: typeof started === "string" && Number.isFinite(Date.parse(started)) ? started : null,
    generatedAt: now.toISOString(), timeZone: "UTC" };
}

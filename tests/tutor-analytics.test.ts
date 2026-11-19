import { GET as tutorUsageRoute } from "../app/api/admin/tutor-usage/route.ts";
import assert from "node:assert/strict";
import test from "node:test";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { isAdminAllowed } from "../app/lib/adminAccess.ts";
import { recordTutorActivity, readTutorUsage } from "../app/lib/tutorAnalytics.ts";
process.env.AI_USAGE_TABLE = "test-tutor-ledger";

test("polling a completed lesson repeatedly, even after UTC midnight, counts once", async () => {
  const original = DynamoDBDocumentClient.prototype.send;
  const items = new Map<string, any>();
  DynamoDBDocumentClient.prototype.send = (async (command: any) => {
    if (command instanceof GetCommand) return { Item: items.get(command.input.Key!.id) };
    const [marker, counter, tracking] = command.input.TransactItems;
    if (items.has(marker.Put.Item.id)) throw Object.assign(new Error("duplicate"), { name: "TransactionCanceledException" });
    items.set(marker.Put.Item.id, marker.Put.Item);
    const key = counter.Update.Key.id, event = counter.Update.ExpressionAttributeNames["#event"];
    const day = items.get(key) || {};
    items.set(key, { ...day, [event]: (day[event] || 0) + 1 });
    if (!items.has("tutor:tracking")) items.set("tutor:tracking", { startedAt: tracking.Update.ExpressionAttributeValues[":now"] });
    return {};
  }) as any;
  try {
    const date = new Date("2026-11-16T23:59:00Z");
    assert.equal(await recordTutorActivity("lessons", "response-private-id", date), true);
    assert.equal(await recordTutorActivity("lessons", "response-private-id", new Date("2026-11-17T00:01:00Z")), false);
    await recordTutorActivity("replies", "reply-private-id", date);
    const report = await readTutorUsage(new Date("2026-11-17T12:00:00Z"));
    assert.equal(report.days.length, 14);
    assert.equal(report.days[13].date, "2026-11-17");
    assert.equal(report.totals.lessons, 1);
    assert.equal(report.totals.replies, 1);
    assert.equal(report.days[12].lessons, 1);
    assert.equal(report.days[13].lessons, 0);
    assert.equal(report.trackingSince, date.toISOString());
    assert.doesNotMatch(JSON.stringify([...items]), /response-private-id|reply-private-id/);
    assert.doesNotMatch(JSON.stringify(report), /tutor:event/);
  } finally { DynamoDBDocumentClient.prototype.send = original; }
});

test("an unavailable ledger does not reject a successful learner response", async () => {
  const original = DynamoDBDocumentClient.prototype.send;
  DynamoDBDocumentClient.prototype.send = (async () => { throw new Error("offline"); }) as any;
  try {
    assert.equal(await recordTutorActivity("lessons", "response"), false);
    await assert.rejects(readTutorUsage(), /offline/);
  } finally { DynamoDBDocumentClient.prototype.send = original; }
});

test("a fresh ledger reports zero use and no invented tracking date", async () => {
  const original = DynamoDBDocumentClient.prototype.send;
  DynamoDBDocumentClient.prototype.send = (async () => ({})) as any;
  try {
    const report = await readTutorUsage(new Date("2026-11-16T12:00:00Z"));
    assert.equal(report.trackingSince, null);
    assert.deepEqual(report.totals, { lessons: 0, replies: 0, videos: 0, illustrations: 0, narrations: 0 });
    assert.equal(report.timeZone, "UTC");
  } finally { DynamoDBDocumentClient.prototype.send = original; }
});

test("malformed stored values cannot become negative, NaN, or text in the report", async () => {
  const original = DynamoDBDocumentClient.prototype.send;
  DynamoDBDocumentClient.prototype.send = (async () => ({ Item: { lessons: -1, replies: "7", videos: NaN, illustrations: 1.5, narrations: 2 } })) as any;
  try {
    const report = await readTutorUsage();
    assert.deepEqual(report.totals, { lessons: 0, replies: 0, videos: 0, illustrations: 0, narrations: 28 });
  } finally { DynamoDBDocumentClient.prototype.send = original; }
});

test("admin access denies missing, wrong, and unequal UTF-8 tokens", () => {
  const previous = process.env.ADMIN_DASHBOARD_TOKEN;
  process.env.ADMIN_DASHBOARD_TOKEN = "test-admin-secret";
  const request = (token?: string) => new Request("https://example.test/admin", { headers: token ? { "x-admin-token": token } : {} });
  try {
    assert.equal(isAdminAllowed(request()), false);
    assert.equal(isAdminAllowed(request("wrong")), false);
    assert.equal(isAdminAllowed(request("test-admin-secrex")), false);
    assert.equal(isAdminAllowed(request(" test-admin-secret ")), true);
    process.env.ADMIN_DASHBOARD_TOKEN = "";
    assert.equal(isAdminAllowed(request()), false);
  } finally {
    if (previous === undefined) delete process.env.ADMIN_DASHBOARD_TOKEN;
    else process.env.ADMIN_DASHBOARD_TOKEN = previous;
  }
});

test("unauthenticated usage requests never read the ledger", async () => {
  const original = DynamoDBDocumentClient.prototype.send;
  let reads = 0;
  DynamoDBDocumentClient.prototype.send = (async () => { reads++; throw new Error("offline"); }) as any;
  try {
    const response = await tutorUsageRoute(new Request("https://example.test/api/admin/tutor-usage"));
    assert.equal(response.status, 401);
    assert.equal(reads, 0);
    assert.match(response.headers.get("cache-control") || "", /private, no-store/);
  } finally { DynamoDBDocumentClient.prototype.send = original; }
});

test("an authenticated storage outage is reported as unavailable rather than zero usage", async () => {
  const original = DynamoDBDocumentClient.prototype.send;
  const previous = process.env.ADMIN_DASHBOARD_TOKEN;
  process.env.ADMIN_DASHBOARD_TOKEN = "test-admin-secret";
  DynamoDBDocumentClient.prototype.send = (async () => { throw new Error("offline"); }) as any;
  try {
    const response = await tutorUsageRoute(new Request("https://example.test/api/admin/tutor-usage", { headers: { "x-admin-token": "test-admin-secret" } }));
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.usage, undefined);
  } finally {
    DynamoDBDocumentClient.prototype.send = original;
    if (previous === undefined) delete process.env.ADMIN_DASHBOARD_TOKEN; else process.env.ADMIN_DASHBOARD_TOKEN = previous;
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  authorizeVerifiedAppleAccess
} from "../app/lib/appleAccessAuthorization.ts";
import type {
  AppleAccessStore
} from "../app/lib/appleAccessAuthorization.ts";
import type { VerifiedAppleAccess } from "../app/lib/appleIap.ts";

const subscription: VerifiedAppleAccess = {
  expiresDate: Date.now() + 3_600_000,
  kind: "subscription",
  originalTransactionId: "original-subscription",
  productId: "com.karigarihome.novasprout.subscription.monthly",
  transactionId: "renewal-transaction"
};

const singleLesson: VerifiedAppleAccess = {
  expiresDate: null,
  kind: "single_lesson",
  originalTransactionId: "single-transaction",
  productId: "com.karigarihome.novasprout.lesson.single",
  transactionId: "single-transaction"
};

function accessStore(overrides: Partial<AppleAccessStore> = {}): AppleAccessStore {
  return {
    claimLessonPurchase: async () => true,
    claimSubscriptionLesson: async () => true,
    hasActiveLessonPurchase: async () => true,
    ...overrides
  };
}

test("allows a verified subscription without consuming quota", async () => {
  assert.equal(
    await authorizeVerifiedAppleAccess(subscription, false, accessStore()),
    true
  );
});

test("enforces the monthly lesson limit when the quota store responds", async () => {
  assert.equal(
    await authorizeVerifiedAppleAccess(
      subscription,
      true,
      accessStore({ claimSubscriptionLesson: async () => false })
    ),
    false
  );
});

test("keeps a verified subscription usable during a quota-store outage", async () => {
  assert.equal(
    await authorizeVerifiedAppleAccess(
      subscription,
      true,
      accessStore({
        claimSubscriptionLesson: async () => {
          throw new Error("database unavailable");
        }
      })
    ),
    true
  );
});

test("keeps consumable lesson purchases fail-closed during a store outage", async () => {
  assert.equal(
    await authorizeVerifiedAppleAccess(
      singleLesson,
      true,
      accessStore({
        claimLessonPurchase: async () => {
          throw new Error("database unavailable");
        }
      })
    ),
    false
  );
});

test("prevents an already claimed consumable transaction from being reused", async () => {
  assert.equal(
    await authorizeVerifiedAppleAccess(
      singleLesson,
      true,
      accessStore({
        claimLessonPurchase: async () => false,
        hasActiveLessonPurchase: async () => false
      })
    ),
    false
  );
});

test("allows a claimed consumable transaction to retry during its active window", async () => {
  assert.equal(
    await authorizeVerifiedAppleAccess(
      singleLesson,
      true,
      accessStore({
        claimLessonPurchase: async () => false,
        hasActiveLessonPurchase: async () => true
      })
    ),
    true
  );
});

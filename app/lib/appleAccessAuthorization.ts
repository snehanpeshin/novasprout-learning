import type { VerifiedAppleAccess } from "./appleIap.ts";
import {
  claimAppleLessonPurchase,
  claimAppleSubscriptionLesson,
  hasActiveAppleLessonPurchase
} from "./supabase.ts";

export type AppleAccessStore = {
  claimLessonPurchase: typeof claimAppleLessonPurchase;
  claimSubscriptionLesson: typeof claimAppleSubscriptionLesson;
  hasActiveLessonPurchase: typeof hasActiveAppleLessonPurchase;
};

const appleAccessStore: AppleAccessStore = {
  claimLessonPurchase: claimAppleLessonPurchase,
  claimSubscriptionLesson: claimAppleSubscriptionLesson,
  hasActiveLessonPurchase: hasActiveAppleLessonPurchase
};

export async function authorizeVerifiedAppleAccess(
  appleAccess: VerifiedAppleAccess,
  consumeSingleLesson: boolean,
  store: AppleAccessStore = appleAccessStore
) {
  if (appleAccess.kind === "subscription") {
    if (!consumeSingleLesson) return true;
    try {
      return await store.claimSubscriptionLesson({
        expiresDate: appleAccess.expiresDate ?? 0,
        productId: appleAccess.productId,
        transactionId: appleAccess.transactionId
      });
    } catch {
      // Apple has already cryptographically verified an active subscription.
      // Keep paid access available during a temporary quota-store outage.
      console.error("[apple-iap] Subscription quota store is unavailable.");
      return true;
    }
  }

  try {
    return consumeSingleLesson
      ? await store.claimLessonPurchase({
          productId: appleAccess.productId,
          transactionId: appleAccess.transactionId
        })
      : await store.hasActiveLessonPurchase(appleAccess.transactionId);
  } catch {
    // Consumables must remain fail-closed so one transaction cannot be replayed.
    console.error("[apple-iap] Consumable purchase store is unavailable.");
    return false;
  }
}

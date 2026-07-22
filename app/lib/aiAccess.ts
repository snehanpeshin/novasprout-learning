import { verifyAppleTransactionJws } from "./appleIap";
import {
  claimAppleLessonPurchase,
  claimAppleSubscriptionLesson,
  hasActiveAppleLessonPurchase
} from "./supabase";

export async function isAiAccessAllowed(
  request: Request,
  { consumeSingleLesson = false }: { consumeSingleLesson?: boolean } = {}
) {
  const providedAccess = request.headers.get("x-ai-access-token")?.trim() ?? "";
  const expectedToken = process.env.AI_LESSON_ACCESS_TOKEN?.trim() ?? "";
  const allowedEmails = new Set(
    (process.env.AI_LESSON_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );

  if (expectedToken && providedAccess === expectedToken) {
    return true;
  }

  if (providedAccess.includes("@") && allowedEmails.has(providedAccess.toLowerCase())) {
    return true;
  }

  const appleJws = request.headers.get("x-apple-transaction-jws")?.trim() ?? "";
  const appleAccess = await verifyAppleTransactionJws(appleJws);
  if (!appleAccess) return false;

  if (appleAccess.kind === "subscription") {
    if (!consumeSingleLesson) return true;
    try {
      return await claimAppleSubscriptionLesson({
        expiresDate: appleAccess.expiresDate ?? 0,
        productId: appleAccess.productId,
        transactionId: appleAccess.transactionId
      });
    } catch {
      return false;
    }
  }

  try {
    return consumeSingleLesson
      ? await claimAppleLessonPurchase({
          productId: appleAccess.productId,
          transactionId: appleAccess.transactionId
        })
      : await hasActiveAppleLessonPurchase(appleAccess.transactionId);
  } catch {
    return false;
  }

}

export const aiAccessError =
  "Start with the free sample, purchase one AI lesson, subscribe, or enter a NovaSprout beta access code.";

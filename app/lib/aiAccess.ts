import { authorizeVerifiedAppleAccess } from "./appleAccessAuthorization.ts";
import { verifyAppleTransactionJws } from "./appleIap.ts";

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

  return authorizeVerifiedAppleAccess(appleAccess, consumeSingleLesson);
}

export const aiAccessError =
  "Start with the free sample, purchase one AI lesson, subscribe, or enter a NovaSprout beta access code.";

import crypto from "node:crypto";
import { getWebAccess } from "./webAiAccess.ts";
export async function isAiAccessAllowed(
  request: Request,
  { consumeSingleLesson = false }: { consumeSingleLesson?: boolean } = {}
) {
  const providedAccess = request.headers.get("x-ai-access-token")?.trim() ?? "";
  const expectedToken = process.env.AI_LESSON_ACCESS_TOKEN?.trim() ?? "";

  if (expectedToken && Buffer.byteLength(providedAccess) === Buffer.byteLength(expectedToken) && crypto.timingSafeEqual(Buffer.from(providedAccess), Buffer.from(expectedToken))) {
    return true;
  }

  if (await getWebAccess(request)) return true;

  const appleJws = request.headers.get("x-apple-transaction-jws")?.trim() ?? "";
  if (!appleJws) return false;

  const [{ authorizeVerifiedAppleAccess }, { verifyAppleTransactionJws }] = await Promise.all([
    import("./appleAccessAuthorization.ts"),
    import("./appleIap.ts")
  ]);
  const appleAccess = await verifyAppleTransactionJws(appleJws);
  if (!appleAccess) return false;

  return authorizeVerifiedAppleAccess(appleAccess, consumeSingleLesson);
}

export const aiAccessError =
  "Start with the free sample, purchase one AI lesson, subscribe on the website, or enter a private NovaSprout access code.";

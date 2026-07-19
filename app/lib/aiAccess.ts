export function isAiAccessAllowed(request: Request) {
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

  return false;
}

export const aiAccessError =
  "Enter the NovaSprout AI access code or an approved paid-user email to use this tool.";

type CurriculumCheck =
  | { allowed: true }
  | { allowed: false; error: string };

const clearlyUnsafePatterns = [
  /\b(porn|pornographic|explicit sex|sexual roleplay|nude photo|nudes)\b/i,
  /\b(how to (?:make|build|buy|hide) (?:a )?(?:bomb|weapon|gun|poison|illegal drug))\b/i,
  /\b(suicide method|how to die|kill myself|self[- ]harm instructions)\b/i,
  /\b(how to hack|steal a password|credit card fraud|identity theft)\b/i,
  /\b(bet real money|online casino|sports betting)\b/i
];

export function checkCurriculumTopic({
  studentQuestion,
  topic
}: {
  grade: string;
  studentQuestion?: string;
  subject: string;
  topic: string;
}): CurriculumCheck {
  const normalizedTopic = topic.trim().replace(/\s+/g, " ");
  const fullRequest = `${normalizedTopic} ${studentQuestion ?? ""}`.trim();

  if (normalizedTopic.length < 3 || normalizedTopic.length > 180) {
    return { allowed: false, error: "Enter a learning topic between 3 and 180 characters." };
  }

  if (clearlyUnsafePatterns.some((pattern) => pattern.test(fullRequest))) {
    return {
      allowed: false,
      error: "That request is not suitable for NovaSprout. Choose a safe learning topic."
    };
  }

  // Subject and grade guide how the lesson is taught; they are not topic gates.
  // This keeps niche, advanced, enrichment, and interdisciplinary learning available.
  return { allowed: true };
}

export async function checkKidSafeContent({
  apiKey,
  studentQuestion,
  topic
}: {
  apiKey: string;
  studentQuestion?: string;
  topic: string;
}): Promise<CurriculumCheck> {
  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      body: JSON.stringify({
        input: `${topic}\n${studentQuestion ?? ""}`,
        model: "omni-moderation-latest"
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      method: "POST",
      signal: AbortSignal.timeout(12_000)
    });
    if (!response.ok) {
      return { allowed: false, error: "NovaSprout could not check this topic safely. Please try again." };
    }
    const payload = (await response.json()) as { results?: Array<{ flagged?: boolean }> };
    if (payload.results?.[0]?.flagged) {
      return {
        allowed: false,
        error: "That request is not suitable for NovaSprout. Choose a safe learning topic."
      };
    }
    return { allowed: true };
  } catch {
    return { allowed: false, error: "NovaSprout could not check this topic safely. Please try again." };
  }
}

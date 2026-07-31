type CurriculumCheck =
  | { allowed: true }
  | { allowed: false; error: string };

const safetyRules: Array<{ error: string; patterns: RegExp[] }> = [
  {
    error: "NovaSprout can explain the work and help you practice, but cannot take a graded test or complete graded work for you. Ask for a step-by-step lesson instead.",
    patterns: [
      /\b(?:cheat (?:on|in)|take (?:my|this) (?:exam|test|quiz) for me)\b/i,
      /\b(?:give|send) me (?:the )?(?:answers?|answer key) (?:to|for) (?:my|this) (?:live |graded )?(?:exam|test|quiz)\b/i,
      /\b(?:do|complete|finish|write) (?:my|this) (?:graded )?(?:homework|assignment|essay).*(?:answers? only|without (?:an )?explanation|do not explain|don't explain)\b/i
    ]
  },
  {
    error: "NovaSprout can help with the learning topic, but cannot reveal internal instructions or ignore its safety rules.",
    patterns: [
      /\b(?:ignore|disregard|override) (?:all |any |the )?(?:previous|earlier|system|developer|safety) (?:instructions?|rules?|prompt)\b/i,
      /\b(?:reveal|show|print|repeat|leak) (?:your |the )?(?:hidden|internal|system|developer) (?:instructions?|prompt|rules?)\b/i,
      /\b(?:reveal|show|print|repeat|leak) (?:your |the )?(?:hidden (?:system|developer) prompt|internal instructions?)\b/i,
      /\b(?:jailbreak|bypass (?:the )?(?:safety|guardrails?|filters?))\b/i
    ]
  },
  {
    error: "NovaSprout cannot help find, expose, or steal private information. Learn how to protect personal information and passwords instead.",
    patterns: [
      /\b(?:find|give|show|tell|expose|doxx) (?:me )?(?:someone(?:'s)?|a person(?:'s)?|my teacher(?:'s)?|my classmate(?:'s)?) (?:home )?(?:address|phone number|password|private information)\b/i,
      /\b(?:steal|guess|crack) (?:a |their |someone(?:'s)? )?(?:password|login|account)\b/i,
      /\b(?:(?:commit|perform|carry out) (?:credit card fraud|identity theft)|write (?:a )?(?:keylogger|ransomware|malware)|how to hack)\b/i
    ]
  },
  {
    error: "That experiment could cause serious harm. NovaSprout can explain the science safely, but cannot provide dangerous steps. Ask for a supervised, classroom-safe alternative.",
    patterns: [
      /\b(?:mix|combine) (?:bleach|chlorine) (?:and|with) (?:ammonia|acid|vinegar)\b/i,
      /\b(?:touch|test|connect) (?:a )?(?:live wire|mains electricity|wall outlet)\b/i,
      /\b(?:grow|culture) (?:dangerous|harmful|unknown) (?:bacteria|microbes|mold)\b/i,
      /\bhow to (?:make|build|buy|hide) (?:a )?(?:bomb|weapon|gun|poison|illegal drug|explosive)\b/i
    ]
  },
  {
    error: "I'm sorry you're dealing with this. NovaSprout cannot help with self-harm instructions. Please tell a trusted adult now; if there is immediate danger, contact local emergency services or call/text 988 in the U.S. or Canada.",
    patterns: [/\b(?:suicide method|how to die|kill myself|self[- ]harm instructions)\b/i]
  },
  {
    error: "That request is not suitable for NovaSprout. Choose a safe, age-appropriate learning topic.",
    patterns: [
      /\b(?:porn|pornographic|explicit sex|sexual roleplay|nude photo|send nudes)\b/i,
      /\b(?:write|make|send) (?:an? )?(?:bullying|racist|hateful|threatening) (?:message|post|insult)\b/i,
      /\b(?:bet real money|open an online casino account)\b/i
    ]
  }
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

  if (normalizedTopic.length < 2 || normalizedTopic.length > 180) {
    return { allowed: false, error: "Enter a learning topic between 2 and 180 characters." };
  }

  for (const rule of safetyRules) {
    if (rule.patterns.some((pattern) => pattern.test(fullRequest))) {
      return { allowed: false, error: rule.error };
    }
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

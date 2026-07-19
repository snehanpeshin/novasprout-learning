export function extractAiLessonOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";

  const outputText = (payload as { output_text?: unknown }).output_text;
  if (typeof outputText === "string") return outputText;

  const output = (payload as { output?: Array<{ content?: Array<{ text?: string }> }> }).output;
  return output?.flatMap((item) => item.content ?? []).map((content) => content.text).filter(Boolean).join("\n") ?? "";
}

export function parseAiLessonJson(outputText: string) {
  const trimmed = outputText.trim();
  const markdownMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const unwrappedText = markdownMatch?.[1]?.trim() ?? trimmed;
  const firstBrace = unwrappedText.indexOf("{");
  const lastBrace = unwrappedText.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace <= firstBrace) return null;

  try {
    return JSON.parse(unwrappedText.slice(firstBrace, lastBrace + 1));
  } catch {
    return null;
  }
}

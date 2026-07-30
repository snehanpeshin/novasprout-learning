import type { TextFitRequest, TextFitResult } from "./types.ts";

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sentenceParts(value: string) {
  return normalize(value).split(/(?<=[.!?])\s+/).filter(Boolean);
}

const danglingEndingPattern =
  /(?:,\s*|(?:\b(?:and|or|but|because|for|with|using|solve for a|with every|with correct|for two)\b)\.?)$/i;

function balancedParentheses(value: string) {
  return [...value].reduce((balance, character) => {
    if (character === "(") return balance + 1;
    if (character === ")") return balance - 1;
    return balance;
  }, 0) === 0;
}

export function isCompleteSentence(value: string) {
  const text = normalize(value);
  if (!text || !/[.!?]$/.test(text)) return false;
  if (/[,;:]\s*[.!?]$/.test(text)) return false;
  if (danglingEndingPattern.test(text)) return false;
  if (!balancedParentheses(text)) return false;
  if (/[:;]\s*$/.test(text)) return false;
  return true;
}

function repairDanglingEnding(value: string) {
  let repaired = normalize(value)
    .replace(/[,;:]+\s*([.!?])$/, "$1")
    .replace(/\bsolve for a\.?$/i, "solve for the requested quantity")
    .replace(/\bwith every\.?$/i, "with every substituted value")
    .replace(/\bwith correct\.?$/i, "with correct units")
    .replace(/\bfor two\.?$/i, "")
    .replace(/\b(?:and|or|but|because|for|with|using)\.?$/i, "")
    .replace(/[,;:]+$/, "")
    .trim();
  while (repaired.includes("(") && !balancedParentheses(repaired)) {
    repaired = repaired.replace(/\s*\([^()]*$/, "").trim();
  }
  return repaired;
}

export function rewriteToFit(value: string, targetWords: number) {
  const text = normalize(value);
  if (!text) return "";
  const sentences = sentenceParts(text);
  const selected: string[] = [];
  let count = 0;
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).filter(Boolean);
    if (selected.length && count + words.length > targetWords) break;
    if (!selected.length && words.length > targetWords) break;
    selected.push(sentence);
    count += words.length;
  }
  if (selected.length) {
    const complete = selected.join(" ");
    if (isCompleteSentence(complete)) return complete;
    const repaired = repairDanglingEnding(complete);
    return `${repaired}${/[.!?]$/.test(repaired) ? "" : "."}`;
  }

  const words = text.split(/\s+/).filter(Boolean);
  const conciseClause = text.split(/\b(?:using|with|for|so that|because)\b/i)[0]?.replace(/[,;:]+$/, "").trim();
  if (conciseClause) {
    const clauseWords = conciseClause.split(/\s+/).filter(Boolean);
    if (clauseWords.length >= 4 && clauseWords.length <= Math.max(4, targetWords)) {
      return `${conciseClause}${/[.!?]$/.test(conciseClause) ? "" : "."}`;
    }
  }
  const selectedWords: string[] = [];
  for (const word of words) {
    if (selectedWords.length >= Math.max(4, targetWords)) break;
    selectedWords.push(word);
  }
  const repaired = repairDanglingEnding(selectedWords.join(" "));
  return repaired ? `${repaired}${/[.!?]$/.test(repaired) ? "" : "."}` : "";
}

function wrapLineCount(text: string, charactersPerLine: number) {
  if (!text) return 0;
  let lines = 1;
  let lineLength = 0;
  for (const word of text.split(/\s+/)) {
    const nextLength = lineLength ? lineLength + 1 + word.length : word.length;
    if (nextLength > charactersPerLine && lineLength > 0) {
      lines += 1;
      lineLength = word.length;
    } else {
      lineLength = nextLength;
    }
  }
  return lines;
}

function capacityAtFont(request: TextFitRequest, fontSize: number) {
  const widthPoints = request.boxWidth * 72;
  const heightPoints = request.boxHeight * 72;
  const charactersPerLine = Math.max(12, Math.floor(widthPoints / (fontSize * 0.52)));
  const physicalLines = Math.max(1, Math.floor(heightPoints / (fontSize * 1.28)));
  return {
    charactersPerLine,
    maxLines: Math.max(1, Math.min(request.maxLines, physicalLines))
  };
}

function sentenceBoundaryFit(text: string, characterCapacity: number) {
  const sentences = sentenceParts(text);
  let fitted = "";
  for (const sentence of sentences) {
    const candidate = fitted ? `${fitted} ${sentence}` : sentence;
    if (candidate.length > characterCapacity) break;
    fitted = candidate;
  }
  if (fitted) return fitted;

  return rewriteToFit(text, Math.max(4, Math.floor(characterCapacity / 7)));
}

export function fitTextToBox(request: TextFitRequest): TextFitResult {
  const source = normalize(request.text);
  const preferred = Math.max(request.minimumFontSize, request.preferredFontSize);
  const preferredCapacity = capacityAtFont(request, preferred);
  if (wrapLineCount(source, preferredCapacity.charactersPerLine) <= preferredCapacity.maxLines) {
    return { didShorten: false, fits: true, fontSize: preferred, lineCount: wrapLineCount(source, preferredCapacity.charactersPerLine), text: source };
  }

  const preferredCharacterCapacity = preferredCapacity.charactersPerLine * preferredCapacity.maxLines;
  const shortened = sentenceBoundaryFit(source, preferredCharacterCapacity);
  const shortenedWordCount = shortened.split(/\s+/).filter(Boolean).length;
  const remainingText = normalize(source.split(/\s+/).filter(Boolean).slice(shortenedWordCount).join(" "));
  if (shortened && wrapLineCount(shortened, preferredCapacity.charactersPerLine) <= preferredCapacity.maxLines) {
    return {
      didShorten: shortened !== source,
      fits: true,
      fontSize: preferred,
      lineCount: wrapLineCount(shortened, preferredCapacity.charactersPerLine),
      remainingText: remainingText || undefined,
      text: shortened
    };
  }

  for (let fontSize = preferred - 1; fontSize >= request.minimumFontSize; fontSize -= 1) {
    const capacity = capacityAtFont(request, fontSize);
    if (wrapLineCount(source, capacity.charactersPerLine) <= capacity.maxLines) {
      return { didShorten: false, fits: true, fontSize, lineCount: wrapLineCount(source, capacity.charactersPerLine), text: source };
    }
  }

  const minimumCapacity = capacityAtFont(request, request.minimumFontSize);
  const fitted = sentenceBoundaryFit(source, minimumCapacity.charactersPerLine * minimumCapacity.maxLines);
  const fittedWordCount = fitted.split(/\s+/).filter(Boolean).length;
  const remainder = normalize(source.split(/\s+/).filter(Boolean).slice(fittedWordCount).join(" "));
  return {
    didShorten: fitted !== source,
    fits: !remainder,
    fontSize: request.minimumFontSize,
    lineCount: wrapLineCount(fitted, minimumCapacity.charactersPerLine),
    remainingText: remainder || undefined,
    text: fitted
  };
}

export function shortenTitle(value: string, maxCharacters = 52) {
  const title = normalize(value);
  if (title.length <= maxCharacters) return title;
  const withoutPrefix = title.replace(/^(?:learn|understanding|introduction to|lesson on)\s+/i, "");
  if (withoutPrefix.length <= maxCharacters) return withoutPrefix;
  const words = withoutPrefix.split(/\s+/);
  let result = "";
  for (const word of words) {
    const candidate = result ? `${result} ${word}` : word;
    if (candidate.length > maxCharacters) break;
    result = candidate;
  }
  return result.replace(/[,:;/-]+$/, "") || rewriteToFit(withoutPrefix, 6).replace(/[.!?]$/, "");
}

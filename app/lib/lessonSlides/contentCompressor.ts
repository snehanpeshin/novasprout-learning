import type { TextFitRequest, TextFitResult } from "./types.ts";

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sentenceParts(value: string) {
  return normalize(value).split(/(?<=[.!?])\s+/).filter(Boolean);
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

  const words = normalize(text).split(/\s+/);
  let result = "";
  for (const word of words) {
    const candidate = result ? `${result} ${word}` : word;
    if (candidate.length > characterCapacity) break;
    result = candidate;
  }
  return result.replace(/[,;:]$/, "") + (/[.!?]$/.test(result) ? "" : ".");
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
  const remainingText = normalize(source.slice(shortened.length));
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
  const remainder = normalize(source.slice(fitted.length));
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
  return result.replace(/[,:;/-]+$/, "") || withoutPrefix.slice(0, maxCharacters).trim();
}

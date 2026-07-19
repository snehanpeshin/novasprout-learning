import { execFile } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";
import { NextResponse } from "next/server";
import { aiAccessError, isAiAccessAllowed } from "../../lib/aiAccess";

export const runtime = "nodejs";
export const maxDuration = 60;

const execFileAsync = promisify(execFile);
const remoteCompilerTimeoutMs = 25000;
const maxEmbeddedImageAssets = 2;
const maxEmbeddedImageBytes = 1_400_000;
const maxRemoteAssetPayloadBytes = 4_200_000;

type DeckAsset = {
  assetId?: string;
  alt?: string;
  aspectRatio?: string;
  caption?: string;
  dataUrl?: string;
  educationalPurpose?: string;
  filename?: string;
  latex?: string;
  placement?: string;
  prompt?: string;
  type?: "image" | "latex";
};

type LessonDeckRequest = {
  assets?: DeckAsset[];
  context?: {
    grade?: string;
    subject?: string;
    topic?: string;
  };
  lesson?: {
    conceptExplanation?: string;
    fullLessonSegments?: Array<{
      activity?: string;
      time?: string;
      title?: string;
    }>;
    guidedExample?: string;
    learningObjectives?: string[];
    practiceQuestions?: string[];
    quickAssessment?: string[];
    recommendedNextSession?: string;
    studentFit?: string;
    title?: string;
    warmUp?: string;
  };
  slideTitles?: string[];
};

const validPlacementPositions = ["lt", "ct", "rt", "lm", "cm", "rm", "lb", "cb", "rb"] as const;
const positions: Record<(typeof validPlacementPositions)[number], { anchor: string; x: string; y: string }> = {
  cb: { anchor: "\\centering", x: "4.7cm", y: "7.05cm" },
  cm: { anchor: "\\centering", x: "4.7cm", y: "3.45cm" },
  ct: { anchor: "\\centering", x: "4.7cm", y: "1.1cm" },
  lb: { anchor: "", x: "0.55cm", y: "7.05cm" },
  lm: { anchor: "", x: "0.55cm", y: "3.45cm" },
  lt: { anchor: "", x: "0.55cm", y: "1.1cm" },
  rb: { anchor: "\\raggedleft", x: "8.65cm", y: "7.05cm" },
  rm: { anchor: "\\raggedleft", x: "8.65cm", y: "3.45cm" },
  rt: { anchor: "\\raggedleft", x: "8.65cm", y: "1.1cm" }
};

const subjectTemplates = {
  coding: {
    accent: "Code",
    color: "7C3AED",
    icon: "\\texttt{</>}"
  },
  ela: {
    accent: "Read",
    color: "D95D39",
    icon: "\\Large\\textbf{Aa}"
  },
  math: {
    accent: "Solve",
    color: "1976D2",
    icon: "$\\Sigma$"
  },
  science: {
    accent: "Explore",
    color: "0F9B78",
    icon: "$\\Delta$"
  }
};

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeLatex(value?: string) {
  return (value ?? "")
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function latexItems(items?: string[]) {
  const safeItems = items?.filter(Boolean).slice(0, 6);
  if (!safeItems?.length) {
    return "\\item Review the topic with your tutor.";
  }

  return safeItems.map((item) => `\\item ${escapeLatex(item)}`).join("\n");
}

function getSubjectTemplate(subject?: string) {
  const normalized = cleanText(subject, 80).toLowerCase();
  if (normalized.includes("science")) {
    return subjectTemplates.science;
  }
  if (normalized.includes("ela") || normalized.includes("english") || normalized.includes("study")) {
    return subjectTemplates.ela;
  }
  if (normalized.includes("coding") || normalized.includes("data")) {
    return subjectTemplates.coding;
  }
  return subjectTemplates.math;
}

function assetSlideNumber(placement?: string) {
  const match = cleanText(placement, 8).toLowerCase().match(/^(\d+)/);
  return match ? Number(match[1]) : 0;
}

function assetPosition(placement?: string): keyof typeof positions | "" {
  const position = cleanText(placement, 8).toLowerCase().replace(/^\d+/, "");
  return validPlacementPositions.includes(position as keyof typeof positions) ? (position as keyof typeof positions) : "";
}

function assetFilename(asset: DeckAsset, index: number) {
  const slideNumber = assetSlideNumber(asset.placement);
  return cleanText(asset.filename, 80) || `slide-${slideNumber}-asset-${index + 1}.png`;
}

function normalizeAssets(assets: DeckAsset[], slideCount: number) {
  const errors: string[] = [];
  const normalized = assets.slice(0, 10).map((asset, index) => {
    const slideNumber = assetSlideNumber(asset.placement);
    const position = assetPosition(asset.placement);
    const placement = `${slideNumber}${position}`;
    const filename = asset.type === "image" ? assetFilename(asset, index).replace(/[^a-zA-Z0-9._-]/g, "-") : "";

    if (!slideNumber || slideNumber > slideCount) {
      errors.push(`Invalid slide number in placement "${asset.placement}".`);
    }
    if (!position) {
      errors.push(`Invalid placement code "${asset.placement}". Use slide number plus lt, ct, rt, lm, cm, rm, lb, cb, or rb.`);
    }
    if (asset.type === "image" && !cleanText(asset.educationalPurpose, 220) && !cleanText(asset.alt, 180)) {
      errors.push(`Image asset ${index + 1} needs an educational purpose or meaningful alt text.`);
    }

    return {
      ...asset,
      alt: cleanText(asset.alt, 180),
      assetId: cleanText(asset.assetId, 40) || `asset-${index + 1}`,
      aspectRatio: cleanText(asset.aspectRatio, 20) || "1:1",
      caption: cleanText(asset.caption, 140),
      educationalPurpose: cleanText(asset.educationalPurpose, 240),
      filename,
      latex: cleanText(asset.latex, 240),
      placement,
      prompt: cleanText(asset.prompt, 900)
    };
  });

  return { errors, normalized };
}

function estimatedDataUrlBytes(dataUrl?: string) {
  if (!dataUrl?.startsWith("data:image/png;base64,")) {
    return 0;
  }

  return Math.ceil(dataUrl.replace("data:image/png;base64,", "").length * 0.75);
}

function selectAssetsForCompilation(assets: DeckAsset[]) {
  const warnings: string[] = [];
  let embeddedImageCount = 0;
  let remotePayloadBytes = 0;

  const selected = assets.filter((asset) => {
    if (asset.type !== "image") {
      return true;
    }

    const imageBytes = estimatedDataUrlBytes(asset.dataUrl);
    if (!asset.dataUrl || !asset.filename || !imageBytes) {
      warnings.push(`Image asset ${asset.assetId || asset.placement} was planned but not generated.`);
      return false;
    }

    if (embeddedImageCount >= maxEmbeddedImageAssets) {
      warnings.push(`Image asset ${asset.assetId || asset.placement} was omitted to keep the PDF compile lightweight.`);
      return false;
    }

    if (imageBytes > maxEmbeddedImageBytes || remotePayloadBytes + imageBytes > maxRemoteAssetPayloadBytes) {
      warnings.push(`Image asset ${asset.assetId || asset.placement} was omitted because it was too large for the compiler payload.`);
      return false;
    }

    embeddedImageCount += 1;
    remotePayloadBytes += imageBytes;
    return true;
  });

  return { embeddedImageCount, remotePayloadBytes, selected, warnings };
}

function compilerImageAssets(assets: DeckAsset[]) {
  return assets
    .filter((asset) => asset.type === "image" && asset.dataUrl?.startsWith("data:image/png;base64,") && asset.filename)
    .map((asset) => ({
      dataUrl: asset.dataUrl,
      filename: asset.filename,
      placement: asset.placement
    }));
}

function frameBody(title: string, body: string, assets: DeckAsset[], slideNumber: number) {
  const assetTex = assets
    .map((asset, index) => {
      if (assetSlideNumber(asset.placement) !== slideNumber) {
        return "";
      }

      const assetPos = assetPosition(asset.placement);
      if (!assetPos) {
        return "";
      }

      const position = positions[assetPos];
      const filename = asset.type === "image" && asset.dataUrl ? asset.filename : "";

      if (asset.type === "image" && filename) {
        return String.raw`\begin{textblock*}{3.2cm}(${position.x},${position.y})
${position.anchor}
\includegraphics[width=2.8cm]{${filename}}
${asset.caption ? `\\\\{\\scriptsize ${escapeLatex(asset.caption)}}` : ""}
\end{textblock*}`;
      }

      if (asset.type === "latex" && asset.latex) {
        return String.raw`\begin{textblock*}{4cm}(${position.x},${position.y})
${position.anchor}
\fcolorbox{NovaBlue!35}{white}{\parbox{3.45cm}{\centering\small\texttt{${escapeLatex(asset.latex)}}}}
\end{textblock*}`;
      }

      return "";
    })
    .filter(Boolean)
    .join("\n");

  return String.raw`\begin{frame}{${escapeLatex(title)}}
${body}
${assetTex}
\end{frame}`;
}

function subjectVisualSlides(request: LessonDeckRequest) {
  const subject = cleanText(request.context?.subject, 80).toLowerCase();
  const topic = escapeLatex(request.context?.topic ?? "this topic");

  if (subject.includes("science")) {
    return [
      {
        body: String.raw`\begin{columns}[T]
\begin{column}{0.32\textwidth}
\begin{block}{Claim}
What do we think is true about ${topic}?
\end{block}
\end{column}
\begin{column}{0.32\textwidth}
\begin{block}{Evidence}
What observation, data, or example supports it?
\end{block}
\end{column}
\begin{column}{0.32\textwidth}
\begin{block}{Reasoning}
Why does the evidence support the claim?
\end{block}
\end{column}
\end{columns}
\vspace{0.5em}
\begin{center}
\begin{tikzpicture}[scale=0.85]
\draw[thick,SubjectAccent] (0,0) circle (0.55);
\draw[thick,SubjectAccent,->] (0.65,0) -- (2.2,0);
\draw[thick,SubjectAccent] (2.8,0) circle (0.55);
\draw[thick,SubjectAccent,->] (3.45,0) -- (5,0);
\draw[thick,SubjectAccent] (5.6,0) circle (0.55);
\node at (0,-1.05) {\small Observe};
\node at (2.8,-1.05) {\small Explain};
\node at (5.6,-1.05) {\small Apply};
\end{tikzpicture}
\end{center}`,
        title: "Visual Reasoning Model"
      }
    ];
  }

  if (subject.includes("ela") || subject.includes("english") || subject.includes("study")) {
    return [
      {
        body: String.raw`\begin{columns}[T]
\begin{column}{0.45\textwidth}
\begin{block}{Read}
Find the key sentence, question, or instruction.
\end{block}
\begin{block}{Think}
Ask: What is the main idea? What evidence matters?
\end{block}
\end{column}
\begin{column}{0.45\textwidth}
\begin{block}{Explain}
Answer in your own words with one clear reason.
\end{block}
\begin{center}
\Large Main Idea $\rightarrow$ Evidence $\rightarrow$ Explanation
\end{center}
\end{column}
\end{columns}`,
        title: "Study Strategy Map"
      }
    ];
  }

  if (subject.includes("coding") || subject.includes("data")) {
    return [
      {
        body: String.raw`\begin{center}
\begin{tikzpicture}[node distance=1.1cm, every node/.style={draw, rounded corners, thick, minimum width=2.4cm, minimum height=0.8cm}]
\node[fill=SubjectAccent!12] (input) {Input};
\node[fill=SubjectAccent!12, right=of input] (process) {Process};
\node[fill=SubjectAccent!12, right=of process] (output) {Output};
\draw[->, thick, SubjectAccent] (input) -- (process);
\draw[->, thick, SubjectAccent] (process) -- (output);
\end{tikzpicture}
\end{center}
\begin{block}{Debugging question}
If the output is wrong, check one step at a time: input, rule, then result.
\end{block}`,
        title: "Input Process Output"
      }
    ];
  }

  return [
    {
      body: String.raw`\begin{columns}[T]
\begin{column}{0.45\textwidth}
\begin{block}{Ratio}
\[
a:b = \frac{a}{b}
\]
A ratio compares two quantities.
\end{block}
\begin{block}{Proportion}
\[
\frac{a}{b}=\frac{c}{d} \quad \Rightarrow \quad ad=bc
\]
Equivalent ratios keep the same relationship.
\end{block}
\end{column}
\begin{column}{0.48\textwidth}
\begin{center}
\begin{tikzpicture}[scale=0.72]
\foreach \x in {0,1} {\fill[SubjectAccent!75] (\x,2.2) rectangle +(0.85,0.45);}
\foreach \x in {0,1,2} {\fill[NovaMint!75] (\x,1.6) rectangle +(0.85,0.45);}
\foreach \x in {0,1,2,3} {\fill[SubjectAccent!75] (\x,0.65) rectangle +(0.85,0.45);}
\foreach \x in {0,1,2,3,4,5} {\fill[NovaMint!75] (\x,0.05) rectangle +(0.85,0.45);}
\node[left] at (-0.2,2.42) {\small 2};
\node[left] at (-0.2,1.82) {\small 3};
\node[left] at (-0.2,0.87) {\small 4};
\node[left] at (-0.2,0.27) {\small 6};
\node at (2.5,-0.55) {\small $2:3$ scales to $4:6$};
\end{tikzpicture}
\end{center}
\end{column}
\end{columns}`,
      title: "Visual Model"
    },
    {
      body: String.raw`\begin{block}{Worked proportion}
\[
\frac{2}{3}=\frac{x}{9}
\]
\[
x = 9\cdot\frac{2}{3}=6
\]
\end{block}
\begin{center}
\Large Check: $3 \rightarrow 9$ is $\times 3$, so $2 \rightarrow 6$ is also $\times 3$.
\end{center}`,
      title: "Equation Walkthrough"
    }
  ];
}

function textChunks(value?: string, maxLength = 380, maxChunks = 4) {
  const text = cleanText(value, 3000).replace(/\s+/g, " ");
  if (!text) {
    return [];
  }

  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  sentences.forEach((sentence) => {
    if (chunks.length >= maxChunks) {
      return;
    }

    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > maxLength && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = next;
    }
  });

  if (current && chunks.length < maxChunks) {
    chunks.push(current);
  }

  if (!chunks.length) {
    chunks.push(text.slice(0, maxLength));
  }

  return chunks;
}

function itemChunks(items?: string[], size = 3, maxChunks = 4) {
  const cleaned = (items ?? []).map((item) => cleanText(item, 260)).filter(Boolean);
  const chunks: string[][] = [];
  for (let index = 0; index < cleaned.length && chunks.length < maxChunks; index += size) {
    chunks.push(cleaned.slice(index, index + size));
  }
  return chunks;
}

function textSlide(title: string, body?: string) {
  return {
    body: String.raw`\small ${escapeLatex(body)}`,
    title
  };
}

function listSlide(title: string, items: string[], ordered = false) {
  return {
    body: String.raw`${ordered ? "\\begin{enumerate}" : "\\begin{itemize}"}
\small
${latexItems(items)}
${ordered ? "\\end{enumerate}" : "\\end{itemize}"}`,
    title
  };
}

function buildSlideBodies(request: LessonDeckRequest) {
  const lesson = request.lesson ?? {};
  const conceptSlides = textChunks(lesson.conceptExplanation, 360, 4).map((chunk, index) =>
    textSlide(index === 0 ? "Core Idea" : `Core Idea ${index + 1}`, chunk)
  );
  const exampleSlides = textChunks(lesson.guidedExample, 360, 4).map((chunk, index) =>
    textSlide(index === 0 ? "Worked Example" : `Worked Example ${index + 1}`, chunk)
  );
  const practiceSlides = itemChunks(lesson.practiceQuestions, 3, 4).map((items, index) =>
    listSlide(index === 0 ? "Practice Set" : `Practice Set ${index + 1}`, items, true)
  );
  const quickCheckSlides = itemChunks(lesson.quickAssessment, 3, 2).map((items, index) =>
    listSlide(index === 0 ? "Quick Check" : `Quick Check ${index + 1}`, items, true)
  );
  const guidedActivitySlides = (lesson.fullLessonSegments ?? [])
    .map((segment) => cleanText(segment.activity, 420))
    .filter(Boolean)
    .slice(0, 2)
    .map((activity, index) => textSlide(index === 0 ? "Guided Activity" : `Guided Activity ${index + 1}`, activity));
  const slides = [
    {
      body: String.raw`\Large ${escapeLatex(request.context?.topic ?? lesson.title ?? "NovaSprout Lesson")}
\vspace{0.8em}

\small ${escapeLatex(lesson.studentFit)}
\vspace{0.8em}

\begin{block}{Focus}
\begin{itemize}
${latexItems((lesson.learningObjectives ?? []).slice(0, 3))}
\end{itemize}
\end{block}
\vfill
\small NovaSprout Learning`,
      title: lesson.title ?? "NovaSprout Lesson"
    },
    ...(lesson.warmUp ? [textSlide("Warm-Up", lesson.warmUp)] : []),
    ...conceptSlides.slice(0, 2),
    ...subjectVisualSlides(request),
    ...conceptSlides.slice(2),
    ...exampleSlides,
    ...guidedActivitySlides,
    ...practiceSlides,
    ...quickCheckSlides,
    ...(lesson.recommendedNextSession ? [textSlide("Next Practice", lesson.recommendedNextSession)] : [])
  ];

  return slides;
}

async function writeImageAssets(workDir: string, assets: DeckAsset[]) {
  const written: Array<{ filename: string; placement: string }> = [];

  await Promise.all(
    assets.map(async (asset) => {
      if (asset.type !== "image" || !asset.dataUrl?.startsWith("data:image/png;base64,")) {
        return;
      }

      const filename = asset.filename;
      if (!filename) {
        return;
      }

      const base64 = asset.dataUrl.replace(/^data:image\/png;base64,/, "");
      await writeFile(path.join(workDir, filename), Buffer.from(base64, "base64"));
      written.push({ filename, placement: cleanText(asset.placement, 8) });
    })
  );

  return written;
}

function buildBeamerTex(request: LessonDeckRequest) {
  const lesson = request.lesson ?? {};
  const context = request.context ?? {};
  const assets = request.assets ?? [];
  const template = getSubjectTemplate(context.subject);
  const slideBodies = buildSlideBodies(request);
  const frames = slideBodies
    .map((slide, index) => frameBody(slide.title, slide.body, assets, index + 1))
    .join("\n\n");

  return String.raw`\documentclass[aspectratio=169]{beamer}
\usetheme{Madrid}
\usepackage[absolute,overlay]{textpos}
\usepackage{graphicx}
\usepackage{xcolor}
\usepackage{tikz}
\usetikzlibrary{positioning}
\definecolor{NovaBlue}{HTML}{1976D2}
\definecolor{NovaMint}{HTML}{0F9B78}
\definecolor{NovaInk}{HTML}{10263F}
\definecolor{SubjectAccent}{HTML}{${template.color}}
\setbeamercolor{structure}{fg=NovaBlue}
\setbeamercolor{frametitle}{fg=white,bg=NovaInk}
\setbeamercolor{title}{fg=white,bg=NovaInk}
\setbeamercolor{block title}{fg=white,bg=SubjectAccent}
\setbeamercolor{block body}{fg=NovaInk,bg=SubjectAccent!8}
\setbeamertemplate{navigation symbols}{}
\setbeamertemplate{frametitle}{
  \nointerlineskip
  \begin{beamercolorbox}[wd=\paperwidth,ht=0.95cm,dp=0.25cm,leftskip=0.45cm,rightskip=0.45cm]{frametitle}
    \usebeamerfont{frametitle}\insertframetitle\hfill{\small ${template.icon}\hspace{0.2cm}${template.accent}}
  \end{beamercolorbox}
}
\title{${escapeLatex(lesson.title ?? "NovaSprout Lesson")}}
\subtitle{${escapeLatex(`${context.grade ?? ""} · ${context.subject ?? ""} · ${context.topic ?? ""}`)}}
\author{NovaSprout Learning}
\date{\today}

\begin{document}
${frames}
\end{document}
`;
}

function getCompilerCommand() {
  const configured = process.env.LATEX_COMPILER_PATH?.trim();
  if (configured) {
    const isTectonic = configured.toLowerCase().includes("tectonic");
    return {
      args: isTectonic ? ["--keep-logs", "--keep-intermediates", "lesson.tex"] : ["-interaction=nonstopmode", "lesson.tex"],
      command: configured,
      name: configured,
      passes: isTectonic ? 1 : 2
    };
  }

  return { args: ["-interaction=nonstopmode", "lesson.tex"], command: "pdflatex", name: "pdflatex", passes: 2 };
}

function countPdfPagesFromBuffer(pdf: Buffer) {
  const latin = pdf.toString("latin1");
  return (latin.match(/\/Type\s*\/Page\b/g) ?? []).length;
}

async function countPdfPages(workDir: string, pdf: Buffer) {
  const configuredPdfInfo = process.env.PDFINFO_PATH?.trim() || "pdfinfo";

  try {
    const { stdout } = await execFileAsync(configuredPdfInfo, ["lesson.pdf"], {
      cwd: workDir,
      timeout: 10000
    });
    const match = stdout.match(/^Pages:\s+(\d+)/m);
    if (match) {
      return { method: configuredPdfInfo, pages: Number(match[1]) };
    }
  } catch {
    // Fall back to a lightweight PDF token scan when pdfinfo is not available in the runtime.
  }

  return { method: "pdf-token-scan", pages: countPdfPagesFromBuffer(pdf) };
}

function getDensityWarnings(slides: Array<{ body: string; title: string }>) {
  return slides
    .map((slide, index) => {
      const plainLength = slide.body.replace(/\\[a-zA-Z]+/g, "").replace(/[{}]/g, "").trim().length;
      return plainLength > 900 ? `Slide ${index + 1} "${slide.title}" may be too text-heavy.` : "";
    })
    .filter(Boolean);
}

function sanitizeCompilerError(message?: string) {
  const cleaned = String(message || "").replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "The LaTeX compiler could not create the PDF deck. Please retry after checking the compiler service.";
  }

  if (/tcss\d+|Font .* not found|mktexpk|jknappen\/ec/i.test(cleaned)) {
    return "The PDF compiler is missing a TeX font package. Rebuild the Lambda compiler image with the latest Dockerfile, then update the Lambda function code.";
  }

  if (/timed out|AbortError/i.test(cleaned)) {
    return "The PDF compiler timed out. Try a shorter lesson or increase the Lambda timeout and memory.";
  }

  if (/Unauthorized compiler request/i.test(cleaned)) {
    return "The PDF compiler rejected the request. Check that LATEX_COMPILE_SERVICE_TOKEN matches in Amplify and Lambda.";
  }

  return cleaned.length > 280
    ? "The PDF compiler returned an error while creating the deck. Check the Lambda logs for details, then retry."
    : cleaned;
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 1200) };
  }
}

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

async function compileWithRemoteService({
  assets,
  expectedPageCount,
  tex
}: {
  assets: DeckAsset[];
  expectedPageCount: number;
  tex: string;
}) {
  const compileUrl = process.env.LATEX_COMPILE_SERVICE_URL?.trim();
  if (!compileUrl) {
    return null;
  }

  const serviceToken = process.env.LATEX_COMPILE_SERVICE_TOKEN?.trim();
  let response: Response;
  try {
    response = await fetchWithTimeout(
      compileUrl,
      {
        body: JSON.stringify({
          assets: compilerImageAssets(assets),
          expectedPageCount,
          tex
        }),
        headers: {
          ...(serviceToken ? { Authorization: `Bearer ${serviceToken}` } : {}),
          "Content-Type": "application/json"
        },
        method: "POST"
      },
      remoteCompilerTimeoutMs
    );
  } catch (error) {
    return {
      compilerStatus: "compile_failed",
      error:
        error instanceof Error && error.name === "AbortError"
          ? "The external LaTeX compiler timed out. Increase the Lambda timeout/memory or try a shorter lesson."
          : `Could not reach the external LaTeX compiler service: ${
              error instanceof Error ? error.message : "network request failed"
            }`,
      ok: false
    };
  }

  const payload = await readJsonResponse(response);

  if (!response.ok) {
    if (payload?.error) {
      console.error("NovaSprout LaTeX compiler failed:", payload.error);
    }

    return {
      compilerStatus: "compile_failed",
      error: sanitizeCompilerError(payload?.error ?? "The external LaTeX compiler service could not compile this deck."),
      ok: false
    };
  }

  const hasPdfDataUrl = typeof payload?.pdfDataUrl === "string" && payload.pdfDataUrl.startsWith("data:application/pdf;base64,");
  const hasPdfUrl = typeof payload?.pdfUrl === "string" && payload.pdfUrl.startsWith("https://");
  if (!hasPdfDataUrl && !hasPdfUrl) {
    return {
      compilerStatus: "compile_failed",
      error: "The external LaTeX compiler service did not return a compiled PDF URL.",
      ok: false
    };
  }

  return {
    compilerName: payload?.compilerName ?? "external-latex-service",
    compilerStatus: "compiled",
    ok: true,
    pageCount: Number(payload?.pageCount ?? 0),
    pdfDataUrl: payload?.pdfDataUrl,
    pdfUrl: payload?.pdfUrl,
    pdfSize: Number(payload?.pdfSize ?? 0),
    warnings: Array.isArray(payload?.warnings) ? payload.warnings : []
  };
}

async function compileDeckRequest(request: Request) {
  if (!isAiAccessAllowed(request)) {
    return NextResponse.json({ error: aiAccessError }, { status: 401 });
  }

  let body: LessonDeckRequest;
  try {
    body = (await request.json()) as LessonDeckRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.lesson?.title || !body.context?.grade || !body.context?.subject || !body.context?.topic) {
    return NextResponse.json({ error: "Missing lesson or student context." }, { status: 400 });
  }

  const slideBodies = buildSlideBodies(body);
  const { errors: assetErrors, normalized: assets } = normalizeAssets(body.assets ?? [], slideBodies.length);
  if (assetErrors.length) {
    return NextResponse.json(
      {
        compilerStatus: "validation_failed",
        error: "One or more visual assets had invalid slide placement metadata.",
        validationErrors: assetErrors
      },
      { status: 400 }
    );
  }

  const {
    embeddedImageCount,
    remotePayloadBytes,
    selected: compileAssets,
    warnings: assetWarnings
  } = selectAssetsForCompilation(assets);
  const tex = buildBeamerTex({ ...body, assets: compileAssets });
  const densityWarnings = getDensityWarnings(slideBodies);
  const plannedImageAssetCount = assets.filter((asset) => asset.type === "image").length;
  const qualityChecks = [
    `${slideBodies.length} Beamer slides generated.`,
    `${plannedImageAssetCount} image asset${plannedImageAssetCount === 1 ? "" : "s"} planned for indexed placement.`,
    `${embeddedImageCount} generated image asset${embeddedImageCount === 1 ? "" : "s"} embedded in the compiled PDF.`,
    `${compileAssets.filter((asset) => asset.type === "latex").length} LaTeX overlay asset${
      compileAssets.filter((asset) => asset.type === "latex").length === 1 ? "" : "s"
    } included.`,
    `Remote visual payload: ${Math.round(remotePayloadBytes / 1024)} KB.`,
    "Placement codes validated against lt, ct, rt, lm, cm, rm, lb, cb, rb."
  ];

  const remoteCompile = await compileWithRemoteService({ assets: compileAssets, expectedPageCount: slideBodies.length, tex });
  if (remoteCompile) {
    if (!remoteCompile.ok) {
      return NextResponse.json(
        {
          assetManifest: compileAssets.map((asset) => ({
            alt: asset.alt,
            assetId: asset.assetId,
            aspectRatio: asset.aspectRatio,
            educationalPurpose: asset.educationalPurpose,
            filename: asset.filename,
            placement: asset.placement,
            type: asset.type
          })),
          compilerStatus: remoteCompile.compilerStatus,
          error: remoteCompile.error,
          qualityChecks,
          qualityWarnings: [...densityWarnings, ...assetWarnings],
          tex: process.env.NODE_ENV === "development" ? tex : undefined
        },
        { status: 422 }
      );
    }

    const pageCount = remoteCompile.pageCount;
    const pdfSize = remoteCompile.pdfSize ?? 0;
    const warnings = [
      ...densityWarnings,
      ...assetWarnings,
      ...remoteCompile.warnings,
      ...(pageCount === slideBodies.length
        ? []
        : [`Expected ${slideBodies.length} pages but remote compiler reported ${pageCount}.`]),
      ...(pdfSize > 1000 ? [] : ["Compiled PDF is unexpectedly small."])
    ];

    return NextResponse.json({
      assetManifest: compileAssets.map((asset) => ({
        alt: asset.alt,
        assetId: asset.assetId,
        aspectRatio: asset.aspectRatio,
        educationalPurpose: asset.educationalPurpose,
        filename: asset.filename,
        placement: asset.placement,
        type: asset.type
      })),
      compilerStatus: "compiled",
      pageCount,
      pdfDataUrl: remoteCompile.pdfDataUrl,
      pdfUrl: remoteCompile.pdfUrl,
      qualityChecks: [
        ...qualityChecks,
        `Compiled successfully with ${remoteCompile.compilerName}.`,
        `PDF page count checked by remote compiler: ${pageCount}.`,
        `PDF size: ${pdfSize} bytes.`
      ],
      qualityWarnings: warnings,
      tex: process.env.NODE_ENV === "development" ? tex : undefined
    });
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "novasprout-deck-"));
  const compiler = getCompilerCommand();
  const writtenAssets = await writeImageAssets(workDir, compileAssets);
  const localQualityChecks = [...qualityChecks, "Temporary compile directory isolated under the OS temp folder."];

  await writeFile(path.join(workDir, "lesson.tex"), tex, "utf8");

  try {
    for (let pass = 0; pass < compiler.passes; pass += 1) {
      await execFileAsync(compiler.command, compiler.args, {
        cwd: workDir,
        timeout: 30000
      });
    }

    const pdf = await readFile(path.join(workDir, "lesson.pdf"));
    const pageCheck = await countPdfPages(workDir, pdf);
    const pageCount = pageCheck.pages;
    const warnings = [
      ...densityWarnings,
      ...assetWarnings,
      ...(pageCount === slideBodies.length
        ? []
        : [`Expected ${slideBodies.length} pages but detected ${pageCount} using ${pageCheck.method}.`]),
      ...(pdf.length > 1000 ? [] : ["Compiled PDF is unexpectedly small."])
    ];

    return NextResponse.json({
      assetManifest: compileAssets.map((asset) => ({
        alt: asset.alt,
        assetId: asset.assetId,
        aspectRatio: asset.aspectRatio,
        educationalPurpose: asset.educationalPurpose,
        filename: asset.filename,
        placement: asset.placement,
        type: asset.type
      })),
      compilerStatus: "compiled",
      pageCount,
      pdfDataUrl: `data:application/pdf;base64,${pdf.toString("base64")}`,
      qualityChecks: [
        ...localQualityChecks,
        `Compiled successfully with ${compiler.name}.`,
        `PDF page count checked with ${pageCheck.method}: ${pageCount}.`,
        `PDF size: ${pdf.length} bytes.`
      ],
      qualityWarnings: warnings,
      tex
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "LaTeX compiler failed.";
    const missingCompiler = message.includes("ENOENT") || message.includes("not found");

    return NextResponse.json(
      {
        assetManifest: writtenAssets,
        compilerStatus: missingCompiler ? "compiler_missing" : "compile_failed",
        error: missingCompiler
          ? "LaTeX compiler is not installed in this deployment. Use a TeX-enabled AWS Lambda/container or install pdflatex/tectonic and set LATEX_COMPILER_PATH."
          : sanitizeCompilerError(message),
        qualityChecks: localQualityChecks,
        qualityWarnings: [...densityWarnings, ...assetWarnings],
        tex: process.env.NODE_ENV === "development" ? tex : undefined
      },
      { status: missingCompiler ? 501 : 422 }
    );
  } finally {
    await rm(workDir, { force: true, recursive: true });
  }
}

export async function POST(request: Request) {
  try {
    return await compileDeckRequest(request);
  } catch (error) {
    return NextResponse.json(
      {
        compilerStatus: "compile_failed",
        error:
          error instanceof Error
            ? `The lesson compiler route failed before it could finish: ${error.message}`
            : "The lesson compiler route failed before it could finish."
      },
      { status: 500 }
    );
  }
}

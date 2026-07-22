import { execFile } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";
import { NextResponse } from "next/server";
import { aiAccessError, isAiAccessAllowed } from "../../lib/aiAccess";
import { legacyLessonToSlidePlan, type LessonPlanSlide, type VisualSpec } from "../../lib/lessonSlidePlan";

export const runtime = "nodejs";
export const maxDuration = 300;

const execFileAsync = promisify(execFile);
const remoteCompilerTimeoutMs = 285000;
const maxEmbeddedImageAssets = 4;
const maxEmbeddedImageBytes = 2_800_000;
const maxRemoteAssetPayloadBytes = 3_600_000;

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
  cb: { anchor: "\\centering", x: "4.7cm", y: "5.45cm" },
  cm: { anchor: "\\centering", x: "4.7cm", y: "3.15cm" },
  ct: { anchor: "\\centering", x: "4.7cm", y: "1.1cm" },
  lb: { anchor: "", x: "0.55cm", y: "5.45cm" },
  lm: { anchor: "", x: "0.55cm", y: "3.15cm" },
  lt: { anchor: "", x: "0.55cm", y: "1.1cm" },
  rb: { anchor: "\\raggedleft", x: "8.65cm", y: "5.45cm" },
  rm: { anchor: "\\raggedleft", x: "8.65cm", y: "3.15cm" },
  rt: { anchor: "\\raggedleft", x: "8.65cm", y: "1.1cm" }
};

const subjectTemplates = {
  coding: {
    accent: "Code",
    color: "123047",
    icon: "\\texttt{</>}"
  },
  ela: {
    accent: "Read",
    color: "EF6F61",
    icon: "\\Large\\textbf{Aa}"
  },
  math: {
    accent: "Solve",
    color: "4A90E2",
    icon: "$\\Sigma$"
  },
  science: {
    accent: "Explore",
    color: "18A67A",
    icon: "$\\Delta$"
  }
};

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeLessonText(value?: string) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u00A0\u2007\u202F]/g, " ")
    .replace(/-\s*[>¿]/g, " to ")
    .replace(/[→⇒]/g, " to ")
    .replace(/[×✕]/g, " x ")
    .replace(/[÷∕⁄]/g, "/")
    .replace(/[−–—‑]/g, "-")
    .replace(/[≤≦]/g, " <= ")
    .replace(/[≥≧]/g, " >= ")
    .replace(/[≠]/g, " != ")
    .replace(/[≈≅]/g, " approximately ")
    .replace(/[±]/g, " +/- ")
    .replace(/[∞]/g, " infinity ")
    .replace(/[√]/g, " sqrt ")
    .replace(/[πΠ]/g, " pi ")
    .replace(/[Δ∆]/g, " delta ")
    .replace(/[θΘ]/g, " theta ")
    .replace(/[αΑ]/g, " alpha ")
    .replace(/[βΒ]/g, " beta ")
    .replace(/[γΓ]/g, " gamma ")
    .replace(/[μΜ]/g, " micro ")
    .replace(/[°]/g, " degrees ")
    .replace(/[•●▪◦]/g, " - ")
    .replace(/[✓✔]/g, " correct ")
    .replace(/[✗✘]/g, " incorrect ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeLatex(value?: string) {
  return normalizeLessonText(value)
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

function safeInlineLatex(value?: string) {
  return cleanText(value, 240)
    .replace(/\\(?:input|include|write|read|openout|openin|usepackage|documentclass|begin|end)\b/gi, "")
    .replace(/[{}]/g, "")
    .replace(/[^a-zA-Z0-9\\+\-*/=().,:;_\^\s<>|[\]]/g, "")
    .trim();
}

function latexItems(items?: string[]) {
  const safeItems = items?.filter(Boolean).slice(0, 6);
  if (!safeItems?.length) {
    return "\\item Review the topic with your tutor.";
  }

  return safeItems
    .map((item) => item.replace(/^\s*(?:\d+[\).:-]\s*|Q\d+[\).:-]\s*)/i, ""))
    .map((item) => `\\item ${escapeLatex(item)}`)
    .join("\n");
}

function frameTitle(title: string) {
  const normalized = normalizeLessonText(title);
  return normalized.length > 54 ? `${normalized.slice(0, 51).trim()}...` : normalized;
}

function getSubjectTemplate(subject?: string, topic?: string) {
  const normalizedTopic = cleanText(topic, 120).toLowerCase();
  if (/\b(digest|biology|cell|organ|organism|ecosystem|photosynthesis|respiration|force|motion|energy|matter|atom|chemical|electric|circuit|current|voltage|charge|resistance)\b/.test(normalizedTopic)) {
    return subjectTemplates.science;
  }
  if (/\b(ratio|proportion|fraction|equation|algebra|geometry|graph|linear|percent|integer)\b/.test(normalizedTopic)) {
    return subjectTemplates.math;
  }

  const normalized = cleanText(subject, 80).toLowerCase();
  if (/\b(science|biology|chemistry|physics|health|environmental)\b/.test(normalized)) {
    return subjectTemplates.science;
  }
  if (/\b(ela|english|language|reading|writing|social|history|geography|civics|economics)\b/.test(normalized)) {
    return subjectTemplates.ela;
  }
  if (/\b(coding|computer|data|robotics|engineering|programming)\b/.test(normalized)) {
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
  const normalized = assets.slice(0, 18).map((asset, index) => {
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
  const slideAssets = assets.filter((asset) => assetSlideNumber(asset.placement) === slideNumber);
  const primaryImage = slideAssets.find(
    (asset) => asset.type === "image" && asset.dataUrl?.startsWith("data:image/png;base64,") && asset.filename
  );
  const assetTex = (primaryImage ? [] : slideAssets)
    .map((asset, index) => {
      const assetPos = assetPosition(asset.placement);
      if (!assetPos) {
        return "";
      }

      const position = positions[assetPos];
      const filename = asset.type === "image" && asset.dataUrl ? asset.filename : "";

      if (asset.type === "image" && filename) {
        return String.raw`\begin{textblock*}{4.3cm}(${position.x},${position.y})
${position.anchor}
\includegraphics[width=3.9cm,height=2.95cm,keepaspectratio]{${filename}}
${asset.caption ? `\\\\{\\scriptsize ${escapeLatex(asset.caption)}}` : ""}
\end{textblock*}`;
      }

      if (asset.type === "latex" && asset.latex) {
        const latex = safeInlineLatex(asset.latex);
        if (!latex) {
          return "";
        }
        return String.raw`\begin{textblock*}{4cm}(${position.x},${position.y})
${position.anchor}
\fcolorbox{NovaBlue!35}{white}{\parbox{3.45cm}{\centering\Large $${latex}$}}
\end{textblock*}`;
      }

      return "";
    })
    .filter(Boolean)
    .join("\n");

  const slideBody = primaryImage
    ? String.raw`\begin{columns}[T,onlytextwidth]
\begin{column}{0.38\textwidth}
${body}
\end{column}
\begin{column}{0.59\textwidth}
\vspace{0.08cm}
\begin{center}
\setlength{\fboxsep}{3pt}
\fcolorbox{NovaSky!35}{white}{\includegraphics[width=0.96\linewidth,height=5.25cm,keepaspectratio]{${primaryImage.filename}}}
${primaryImage.caption ? `\\\\[0.12cm]{\\scriptsize\\color{NovaInk!75}${escapeLatex(primaryImage.caption)}}` : ""}
\end{center}
\end{column}
\end{columns}`
    : body;

  return String.raw`\begin{frame}{${escapeLatex(frameTitle(title))}}
${slideBody}
${assetTex}
\end{frame}`;
}

function subjectVisualSlides(request: LessonDeckRequest) {
  const subject = cleanText(request.context?.subject, 80).toLowerCase();
  const topic = escapeLatex(request.context?.topic ?? "this topic");

  if (subject.includes("science")) {
    if (topic.toLowerCase().includes("digestive")) {
      return [
        {
          body: String.raw`\begin{columns}[T]
\begin{column}{0.54\textwidth}
\begin{center}
\begin{tikzpicture}[scale=0.72, every node/.style={font=\scriptsize}]
\node[draw, rounded corners, fill=SubjectAccent!12, minimum width=1.9cm, minimum height=0.55cm] (mouth) at (0,4.8) {Mouth};
\node[draw, rounded corners, fill=SubjectAccent!12, minimum width=1.9cm, minimum height=0.55cm] (eso) at (0,3.9) {Esophagus};
\node[draw, rounded corners, fill=SubjectAccent!20, minimum width=2.1cm, minimum height=0.75cm] (stomach) at (0,2.85) {Stomach};
\node[draw, rounded corners, fill=NovaMint!16, minimum width=2.4cm, minimum height=0.75cm] (small) at (0,1.75) {Small intestine};
\node[draw, rounded corners, fill=NovaMint!10, minimum width=2.4cm, minimum height=0.75cm] (large) at (0,0.65) {Large intestine};
\node[draw, rounded corners, fill=SubjectAccent!10, minimum width=1.5cm, minimum height=0.5cm] (pancreas) at (3.0,2.0) {Pancreas};
\node[draw, rounded corners, fill=SubjectAccent!10, minimum width=1.5cm, minimum height=0.5cm] (liver) at (3.0,3.2) {Liver};
\draw[->, thick, SubjectAccent] (mouth) -- (eso);
\draw[->, thick, SubjectAccent] (eso) -- (stomach);
\draw[->, thick, SubjectAccent] (stomach) -- (small);
\draw[->, thick, SubjectAccent] (small) -- (large);
\draw[->, thick, NovaMint] (pancreas) -- (small);
\draw[->, thick, NovaMint] (liver) -- (small);
\end{tikzpicture}
\end{center}
\end{column}
\begin{column}{0.42\textwidth}
\begin{block}{Trace the path}
Food moves through organs in order. Accessory organs add chemicals but food does not pass through them.
\end{block}
\begin{block}{Key idea}
Mechanical digestion breaks food physically; chemical digestion breaks molecules.
\end{block}
\end{column}
\end{columns}`,
          title: "Digestive System Map"
        },
        {
          body: String.raw`\begin{columns}[T]
\begin{column}{0.48\textwidth}
\begin{block}{Mechanical digestion}
Chewing and stomach mixing make food pieces smaller.
\end{block}
\begin{center}
\begin{tikzpicture}[scale=0.8]
\foreach \x in {0,0.45,0.9} {\fill[SubjectAccent!45] (\x,0) circle (0.18);}
\draw[->, thick, SubjectAccent] (1.35,0) -- (2.15,0);
\foreach \x in {2.55,2.85,3.15,3.45,3.75} {\fill[SubjectAccent!45] (\x,0) circle (0.09);}
\end{tikzpicture}
\end{center}
\end{column}
\begin{column}{0.48\textwidth}
\begin{block}{Chemical digestion}
Enzymes and acid break large molecules into nutrients that can be absorbed.
\end{block}
\begin{center}
\begin{tikzpicture}[scale=0.8]
\node[draw, rounded corners, fill=NovaMint!12] (large) at (0,0) {large molecule};
\draw[->, thick, NovaMint] (1.55,0) -- (2.35,0);
\node[draw, rounded corners, fill=NovaMint!12] at (3.25,0.35) {nutrient};
\node[draw, rounded corners, fill=NovaMint!12] at (3.25,-0.35) {nutrient};
\end{tikzpicture}
\end{center}
\end{column}
\end{columns}`,
          title: "Mechanical vs Chemical Digestion"
        }
      ];
    }

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

function teachingTitle(prefix: string, text: string, index: number) {
  const words = cleanText(text, 120)
    .replace(/[^\w\s:+\-/%]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 7)
    .join(" ");
  return words ? `${prefix}: ${words}` : `${prefix} ${index + 1}`;
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
    body: String.raw`\begin{block}{Student explanation}
\small ${escapeLatex(body)}
\end{block}
\vfill
\begin{center}
\begin{tikzpicture}[scale=0.92]
\draw[very thick, SubjectAccent, rounded corners] (0,0) rectangle (8.6,0.75);
\fill[SubjectAccent!18, rounded corners] (0,0) rectangle (2.8,0.75);
\node at (1.4,0.38) {\scriptsize Notice};
\node at (4.3,0.38) {\scriptsize Connect};
\node at (7.1,0.38) {\scriptsize Apply};
\end{tikzpicture}
\end{center}`,
    title
  };
}

function listSlide(title: string, items: string[], ordered = false) {
  return {
    body: String.raw`\begin{block}{Work through these}
${ordered ? "\\begin{enumerate}" : "\\begin{itemize}"}
\small
${latexItems(items)}
${ordered ? "\\end{enumerate}" : "\\end{itemize}"}
\end{block}`,
    title
  };
}

function latexBullets(items?: string[], maxItems = 5) {
  const cleanItems = (items ?? []).map((item) => cleanText(item, 260)).filter(Boolean).slice(0, maxItems);
  if (!cleanItems.length) {
    return "";
  }

  return String.raw`\begin{itemize}
\small
${latexItems(cleanItems)}
\end{itemize}`;
}

function latexSteps(items?: string[], maxItems = 5) {
  const cleanItems = (items ?? []).map((item) => cleanText(item, 220)).filter(Boolean).slice(0, maxItems);
  if (!cleanItems.length) {
    return "";
  }

  return String.raw`\begin{enumerate}
\small
${latexItems(cleanItems)}
\end{enumerate}`;
}

function visualLabels(visual: VisualSpec, fallback: string[]) {
  return (visual.labels?.length ? visual.labels : fallback).map((item) => cleanText(item, 60)).filter(Boolean).slice(0, 8);
}

function renderDigestiveSystemVisual(visual: VisualSpec) {
  const labels = visualLabels(visual, [
    "Mouth",
    "Esophagus",
    "Stomach",
    "Small intestine",
    "Large intestine",
    "Liver",
    "Pancreas"
  ]);
  const [mouth, esophagus, stomach, smallIntestine, largeIntestine, liver, pancreas] = labels;

  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.82, every node/.style={font=\scriptsize}]
% Simplified anatomical map: physical position is meaningful, labels sit outside the body.
\draw[gray!38, line width=0.8pt] (0,5.45) circle (0.42);
\draw[gray!32, line width=0.8pt, rounded corners=14pt] (-0.22,5.02) -- (-1.12,4.55) -- (-0.92,1.02) -- (0.92,1.02) -- (1.12,4.55) -- (0.22,5.02);
\fill[NovaCoral] (0,5.34) circle (0.075);
\draw[NovaCoral, line width=2.2pt] (0,5.27) -- (0,3.75);
\path[draw=NovaCoral, fill=NovaCoral!28, line width=1pt]
  (0,3.76) .. controls (1.02,3.72) and (1.14,2.92) .. (0.46,2.66)
  .. controls (-0.06,2.47) and (-0.28,3.15) .. (0,3.76) -- cycle;
\path[draw=NovaYellow!75!black, fill=NovaYellow!58, line width=0.9pt]
  (-1.04,3.86) .. controls (-0.28,4.12) and (0.46,3.86) .. (0.55,3.36)
  .. controls (-0.15,3.18) and (-0.78,3.22) .. (-1.04,3.86) -- cycle;
\draw[NovaCoral!80!black, fill=NovaCoral!35, line width=0.8pt] (0.32,2.48) ellipse (0.72 and 0.13);
\draw[NovaGrowth, line width=2.6pt, rounded corners=8pt] (-0.76,2.46) rectangle (0.78,1.16);
\draw[NovaSky, line width=1.05pt]
  (-0.55,2.24) .. controls (0.55,2.23) and (0.55,1.96) .. (-0.5,1.94)
  .. controls (-0.82,1.76) and (0.72,1.74) .. (0.46,1.52)
  .. controls (0.12,1.34) and (-0.45,1.35) .. (-0.48,1.25);
\draw[->, NovaCoral, line width=1.1pt] (0.12,4.55) -- (0.12,4.06);
\draw[->, NovaCoral, line width=1.1pt] (0.57,2.55) -- (0.52,2.18);
\draw[->, NovaGrowth, line width=1.1pt] (0.82,1.45) -- (0.82,1.08);

\coordinate (mouthPoint) at (0,5.34);
\coordinate (esoPoint) at (0,4.5);
\coordinate (stomachPoint) at (0.62,3.05);
\coordinate (smallPoint) at (0.05,1.75);
\coordinate (largePoint) at (-0.76,1.65);
\coordinate (liverPoint) at (-0.66,3.58);
\coordinate (pancreasPoint) at (0.45,2.48);
\draw[gray!65] (mouthPoint) -- (-1.55,5.34) node[left]{${escapeLatex(mouth)}};
\draw[gray!65] (esoPoint) -- (-1.55,4.68) node[left]{${escapeLatex(esophagus)}};
\draw[gray!65] (liverPoint) -- (-1.55,3.72) node[left]{${escapeLatex(liver)}};
\draw[gray!65] (stomachPoint) -- (1.58,3.28) node[right]{${escapeLatex(stomach)}};
\draw[gray!65] (pancreasPoint) -- (1.58,2.58) node[right]{${escapeLatex(pancreas)}};
\draw[gray!65] (smallPoint) -- (1.58,1.85) node[right,align=left]{${escapeLatex(smallIntestine)}};
\draw[gray!65] (largePoint) -- (-1.55,1.45) node[left,align=right]{${escapeLatex(largeIntestine)}};
\node[font=\scriptsize\bfseries, text=NovaGrowth, align=center] at (0,0.55) {Main tract: food passes through it\\Helper organs: add digestive chemicals};
\end{tikzpicture}
\end{center}`;
}

function renderCircuitVisual(visual: VisualSpec) {
  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.92, every node/.style={font=\scriptsize}]
\draw[line width=1.4pt, NovaInk] (-2.8,-1.35) -- (-2.8,1.35) -- (2.8,1.35) -- (2.8,-1.35) -- (-2.8,-1.35);
\draw[line width=1.2pt] (-3.08,-0.35) -- (-2.52,-0.35);
\draw[line width=2.2pt] (-2.95,0.28) -- (-2.65,0.28);
\node[left, text=NovaInk] at (-3.1,-0.03) {Battery};
\draw[line width=1.2pt] (-0.85,1.35) -- (-0.2,1.35);
\draw[line width=1.2pt] (0.2,1.35) -- (0.85,1.35);
\draw[line width=1.2pt, NovaCoral] (-0.2,1.35) -- (0.46,1.78);
\fill[NovaInk] (-0.2,1.35) circle (0.055);
\fill[NovaInk] (0.2,1.35) circle (0.055);
\node[above] at (0,1.86) {Switch};
\draw[line width=1.2pt, NovaYellow!70!black, fill=NovaYellow!35] (1.32,-1.35) circle (0.42);
\draw[NovaYellow!70!black, line width=1pt] (1.03,-1.64) -- (1.61,-1.06) (1.03,-1.06) -- (1.61,-1.64);
\foreach \a in {0,45,...,315} {\draw[NovaYellow!70!black] (1.32,-1.35) ++(\a:0.52) -- ++(\a:0.18);}
\node[below] at (1.32,-2.02) {Bulb: energy output};
\draw[-{Stealth[length=3mm]}, line width=1.2pt, NovaSky] (-1.75,1.35) -- (-1.05,1.35);
\draw[-{Stealth[length=3mm]}, line width=1.2pt, NovaSky] (2.8,0.55) -- (2.8,-0.2);
\draw[-{Stealth[length=3mm]}, line width=1.2pt, NovaSky] (0.25,-1.35) -- (-0.5,-1.35);
\node[fill=NovaSky!12, draw=NovaSky, rounded corners=3pt, align=center] at (0,0) {Closed path\\current can flow};
\node[font=\scriptsize\bfseries, text=NovaCoral] at (0,-2.45) {Opening the switch breaks the path, so the bulb turns off.};
\end{tikzpicture}
\end{center}`;
}

function renderCellVisual(visual: VisualSpec) {
  const labels = visualLabels(visual, ["Cell membrane", "Cytoplasm", "Nucleus", "Mitochondrion", "Vacuole"]);
  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.92, every node/.style={font=\scriptsize}]
\path[draw=NovaGrowth, fill=NovaGrowth!8, line width=1.3pt]
  (0,0) ellipse (2.65 and 1.75);
\path[draw=NovaSky, fill=NovaSky!22, line width=1pt] (-0.45,0.18) circle (0.62);
\fill[NovaInk!70] (-0.28,0.3) circle (0.12);
\path[draw=NovaCoral, fill=NovaCoral!18, line width=0.9pt]
  (1.1,0.72) .. controls (1.75,1.05) and (1.83,0.28) .. (1.18,0.18)
  .. controls (0.72,0.1) and (0.63,0.55) .. (1.1,0.72) -- cycle;
\path[draw=NovaCoral, fill=NovaCoral!18, line width=0.9pt]
  (-1.45,-0.72) .. controls (-0.83,-0.4) and (-0.75,-1.12) .. (-1.38,-1.2)
  .. controls (-1.84,-1.25) and (-1.92,-0.85) .. (-1.45,-0.72) -- cycle;
\path[draw=NovaYellow!70!black, fill=NovaYellow!22, line width=0.9pt] (1.15,-0.62) ellipse (0.72 and 0.42);
\fill[NovaInk!24] (0.38,1.08) circle (0.07) (-0.8,1.02) circle (0.07) (0.12,-1.08) circle (0.07);
\draw[gray!65] (-2.38,1.15) -- (-3.15,1.55) node[left]{${escapeLatex(labels[0])}};
\draw[gray!65] (-0.88,1.05) -- (-2.85,0.65) node[left]{${escapeLatex(labels[1])}};
\draw[gray!65] (-0.45,0.18) -- (-2.85,-0.05) node[left]{${escapeLatex(labels[2])}};
\draw[gray!65] (1.38,0.58) -- (3.05,1.1) node[right]{${escapeLatex(labels[3])}};
\draw[gray!65] (1.35,-0.62) -- (3.05,-0.72) node[right]{${escapeLatex(labels[4])}};
\node[font=\scriptsize\bfseries, text=NovaGrowth] at (0,-2.18) {Structure supports each organelle's function.};
\end{tikzpicture}
\end{center}`;
}

function renderVilliVisual() {
  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.88, every node/.style={font=\scriptsize}]
% One enlarged villus: its shape, thin wall, capillaries, and transport direction all carry meaning.
\path[draw=NovaGrowth, fill=NovaGrowth!9, line width=1.2pt]
  (-1.0,-1.7) .. controls (-1.15,-0.55) and (-0.92,1.72) .. (0,2.15)
  .. controls (0.92,1.72) and (1.15,-0.55) .. (1.0,-1.7) -- cycle;
\path[draw=NovaCoral, line width=1.35pt]
  (-0.45,-1.55) .. controls (-0.55,-0.2) and (-0.35,1.25) .. (0,1.55)
  .. controls (0.35,1.25) and (0.55,-0.2) .. (0.45,-1.55);
\draw[NovaSky, line width=1.15pt] (0,-1.5) -- (0,1.25);
\foreach \y in {-1.05,-0.45,0.15,0.75} {
  \draw[-{Stealth[length=2mm]}, NovaYellow!70!black, line width=1.05pt] (-1.62,\y) -- (-0.62,\y);
}
\node[draw=NovaYellow!75!black, fill=NovaYellow!24, rounded corners=3pt, align=center] at (-2.25,0.15) {Digested\\nutrients};
\draw[NovaInk!72] (0.88,1.1) -- (2.15,1.55) node[right,align=left,text=NovaInk!82]{Thin surface\\one cell thick};
\draw[NovaInk!72] (0.38,0.25) -- (2.15,0.48) node[right,align=left,text=NovaInk!82]{Capillary network\\collects nutrients};
\draw[NovaInk!72] (0,-0.65) -- (2.15,-0.58) node[right,align=left,text=NovaInk!82]{Blood carries\\nutrients away};
\draw[decorate, decoration={brace, amplitude=5pt}, thick, NovaGrowth] (-1.15,-1.95) -- (1.15,-1.95);
\node[below, align=center, font=\scriptsize\bfseries, text=NovaGrowth!75!black] at (0,-2.12) {Finger-like shape creates more surface area};
\end{tikzpicture}
\end{center}`;
}

function renderAnnotatedSystemVisual(visual: VisualSpec) {
  const labels = visualLabels(visual, ["Part 1", "Part 2", "Part 3", "Part 4", "Part 5"]).slice(0, 5);
  const title = cleanText(visual.title, 48) || "System";
  const nodes = labels.map((label, index) => {
    const angle = 90 - index * (360 / labels.length);
    const x = (Math.cos((angle * Math.PI) / 180) * 3).toFixed(2);
    const y = (Math.sin((angle * Math.PI) / 180) * 1.75).toFixed(2);
    return `\\node[draw, rounded corners=3pt, fill=${index % 2 ? "NovaGrowth" : "NovaSky"}!12, minimum width=1.65cm, align=center] (p${index}) at (${x},${y}) {\\scriptsize ${escapeLatex(label)}};\\draw[-{Stealth[length=2mm]}, gray!65] (p${index}) -- (core);`;
  }).join("\n");

  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.92]
\node[draw=NovaInk, fill=NovaYellow!24, very thick, rounded corners=8pt, minimum width=2.2cm, minimum height=1.0cm, align=center] (core) at (0,0) {\bfseries ${escapeLatex(title)}};
${nodes}
\end{tikzpicture}
\end{center}`;
}

function renderProcessVisual(visual: VisualSpec) {
  const steps = (visual.steps?.length ? visual.steps : visualLabels(visual, ["Observe", "Model", "Explain", "Apply"]))
    .map((step) => cleanText(step, 52))
    .filter(Boolean)
    .slice(0, 4);
  const nodes = steps
    .map(
      (step, index) =>
        `\\node[draw, rounded corners=5pt, thick, fill=${index % 2 ? "NovaGrowth" : "SubjectAccent"}!12, text width=1.75cm, minimum height=1.05cm, align=center] (n${index}) at (${index * 2.25},0) {\\scriptsize\\bfseries ${index + 1}\\par\\scriptsize ${escapeLatex(step)}};`
    )
    .join("\n");
  const arrows = steps
    .slice(0, -1)
    .map((_, index) => `\\draw[-{Stealth[length=2.6mm]}, line width=1.1pt, SubjectAccent] (n${index}.east) -- (n${index + 1}.west);`)
    .join("\n");

  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.87]
${nodes}
${arrows}
\node[font=\scriptsize, text=NovaInk!70] at (${Math.max(0, steps.length - 1) * 1.125},-1.05) {Trace the sequence from left to right.};
\end{tikzpicture}
\end{center}`;
}

function renderComparisonVisual(visual: VisualSpec) {
  const columns =
    visual.columns?.length === 2
      ? visual.columns
      : [
          { title: "Side A", items: ["Key detail", "Example"] },
          { title: "Side B", items: ["Key detail", "Example"] }
        ];
  const renderPanelText = (column: { items: string[]; title: string }) =>
    [
      String.raw`\textbf{${escapeLatex(cleanText(column.title, 44))}}`,
      ...column.items
        .slice(0, 4)
        .map((item) => String.raw`\(\bullet\) ${escapeLatex(cleanText(item, 58))}`)
    ].join(String.raw`\\[0.13cm]`);

  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.82]
\node[draw=NovaSky, fill=NovaSky!10, very thick, rounded corners=8pt, text width=2.2cm, minimum height=3.0cm, align=left, inner sep=0.22cm] (left) at (-1.65,0) {\scriptsize ${renderPanelText(columns[0])}};
\node[draw=NovaGrowth, fill=NovaGrowth!10, very thick, rounded corners=8pt, text width=2.2cm, minimum height=3.0cm, align=left, inner sep=0.22cm] (right) at (1.65,0) {\scriptsize ${renderPanelText(columns[1])}};
\node[circle, draw=NovaCoral, fill=NovaCoral!12, text=NovaCoral, font=\scriptsize\bfseries, inner sep=2.5pt] (compare) at (0,0) {VS};
\draw[-{Stealth[length=2mm]}, line width=0.9pt, NovaCoral] (compare) -- (left.east);
\draw[-{Stealth[length=2mm]}, line width=0.9pt, NovaCoral] (compare) -- (right.west);
\node[below=0.18cm of left, text width=2.55cm, align=center, font=\tiny, text=NovaSky!75!black] {defining features};
\node[below=0.18cm of right, text width=2.55cm, align=center, font=\tiny, text=NovaGrowth!75!black] {example and effect};
\end{tikzpicture}
\end{center}`;
}

function renderRatioTable(visual: VisualSpec) {
  const headers = visual.tableHeaders?.length ? visual.tableHeaders.slice(0, 6) : ["Quantity", "x1", "x2", "x3", "x4"];
  const rows = visual.rows?.length
    ? visual.rows.slice(0, 4)
    : [
        ["A", "2", "4", "6", "8"],
        ["B", "3", "6", "9", "12"]
      ];
  const columnSpec = `|${headers.map(() => "c").join("|")}|`;
  const bodyRows = rows.map((row) => `${row.slice(0, headers.length).map((cell) => escapeLatex(cell)).join(" & ")} \\\\`).join("\n\\hline\n");

  return String.raw`\begin{center}
\renewcommand{\arraystretch}{1.35}
\begin{tabular}{${columnSpec}}
\hline
${headers.map((header) => `\\textbf{${escapeLatex(header)}}`).join(" & ")} \\
\hline
${bodyRows}
\hline
\end{tabular}
\end{center}`;
}

function renderDoubleNumberLine(visual: VisualSpec) {
  const rows = visual.rows?.length
    ? visual.rows
    : [
        ["A", "0", "2", "4", "6", "8"],
        ["B", "0", "3", "6", "9", "12"]
      ];
  const top = rows[0] ?? [];
  const bottom = rows[1] ?? [];
  const values = top.slice(1, 6);
  const span = 5.2;
  const spacing = values.length > 1 ? span / (values.length - 1) : span;
  const ticks = values
    .map((value, index) => {
      const x = index * spacing;
      return String.raw`\draw (${x},0.08) -- (${x},-0.08);
\draw (${x},-0.92) -- (${x},-1.08);
\node[above] at (${x},0.1) {\scriptsize ${escapeLatex(value)}};
\node[below] at (${x},-1.1) {\scriptsize ${escapeLatex(bottom[index + 1] ?? "")}};`;
    })
    .join("\n");
  const matchIndex = Math.max(1, Math.floor((values.length - 1) / 2));
  const matchX = matchIndex * spacing;

  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.88]
\draw[very thick, SubjectAccent] (0,0) -- (${span},0);
\draw[very thick, NovaMint] (0,-1) -- (${span},-1);
${ticks}
\draw[dashed, line width=1pt, NovaCoral] (${matchX},0.42) -- (${matchX},-1.42);
\node[draw=NovaCoral, fill=NovaCoral!10, rounded corners=3pt, font=\tiny] at (${matchX + 0.82},-0.5) {same location};
\node[left] at (-0.25,0) {\scriptsize ${escapeLatex(top[0] ?? "A")}};
\node[left] at (-0.25,-1) {\scriptsize ${escapeLatex(bottom[0] ?? "B")}};
\end{tikzpicture}
\end{center}`;
}

function renderCoordinateGraph(visual: VisualSpec) {
  const points = visual.points?.length ? visual.points.slice(0, 6) : [{ x: 0, y: 0 }, { x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }];
  const maxX = Math.max(4, ...points.map((point) => point.x));
  const maxY = Math.max(6, ...points.map((point) => point.y));
  const caption =
    cleanText(visual.caption, 90) ||
    (/proportion|ratio/i.test(`${visual.title ?? ""} ${visual.accessibilityLabel}`)
      ? "A straight line through the origin shows a constant ratio."
      : "Read the line from left to right and describe how the rate changes.");
  const scaledPoints = points.map((point) => `(${(point.x / maxX) * 5.2},${(point.y / maxY) * 3.4})`).join(" -- ");
  const dots = points
    .map((point) => `\\fill[SubjectAccent] (${(point.x / maxX) * 5.2},${(point.y / maxY) * 3.4}) circle (0.07);`)
    .join("\n");

  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.85]
\draw[step=0.85cm, gray!28, very thin] (0,0) grid (5.2,3.4);
\draw[->, thick] (0,0) -- (5.55,0) node[right]{\scriptsize x};
\draw[->, thick] (0,0) -- (0,3.75) node[above]{\scriptsize y};
\draw[very thick, SubjectAccent] ${scaledPoints};
${dots}
\node[below, text width=5.5cm, align=center] at (2.6,-0.35) {\scriptsize ${escapeLatex(caption)}};
\end{tikzpicture}
\end{center}`;
}

function renderCoordinateSpace3D(visual: VisualSpec) {
  const source = visual.points?.[0] ?? { x: 3, y: 2, z: 4 };
  const point = {
    x: Math.max(0, Math.min(5, Number.isFinite(source.x) ? source.x : 3)),
    y: Math.max(0, Math.min(5, Number.isFinite(source.y) ? source.y : 2)),
    z: Math.max(0, Math.min(5, Number.isFinite(source.z) ? source.z ?? 4 : 4))
  };
  const px = (point.x * 0.78 - point.y * 0.42).toFixed(2);
  const py = (point.z * 0.68 - point.y * 0.22).toFixed(2);
  const floorX = (point.x * 0.78 - point.y * 0.42).toFixed(2);
  const floorY = (-point.y * 0.22).toFixed(2);
  const xOnly = (point.x * 0.78).toFixed(2);
  const yOnlyX = (-point.y * 0.42).toFixed(2);
  const yOnlyY = (-point.y * 0.22).toFixed(2);

  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.92, line cap=round, line join=round]
\fill[NovaSky!8] (0,0) -- (4.35,0) -- (2.45,-1.0) -- (-1.9,-1.0) -- cycle;
\fill[NovaGrowth!7] (0,0) -- (-1.9,-1.0) -- (-1.9,2.45) -- (0,3.45) -- cycle;
\draw[->, very thick, NovaSky] (0,0) -- (4.75,0) node[right]{\bfseries\scriptsize x};
\draw[->, very thick, NovaCoral] (0,0) -- (-2.2,-1.15) node[below left]{\bfseries\scriptsize y};
\draw[->, very thick, NovaGrowth] (0,0) -- (0,3.85) node[above]{\bfseries\scriptsize z};
\draw[dashed, gray!58] (${px},${py}) -- (${floorX},${floorY});
\draw[dashed, gray!58] (${floorX},${floorY}) -- (${xOnly},0);
\draw[dashed, gray!58] (${floorX},${floorY}) -- (${yOnlyX},${yOnlyY});
\draw[dashed, gray!45] (${px},${py}) -- (${px},0);
\filldraw[fill=NovaYellow, draw=NovaInk, very thick] (${px},${py}) circle (0.10);
\node[draw=NovaInk, fill=white, rounded corners=3pt, above right=0.08cm] at (${px},${py}) {\scriptsize\bfseries P(${point.x}, ${point.y}, ${point.z})};
\node[below, NovaSky] at (${xOnly},0) {\tiny ${point.x}};
\node[below left, NovaCoral] at (${yOnlyX},${yOnlyY}) {\tiny ${point.y}};
\node[left, NovaGrowth] at (0,${(point.z * 0.68).toFixed(2)}) {\tiny ${point.z}};
\node[below, text width=6.0cm, align=center] at (1.0,-1.45) {\scriptsize Move along x, then y, then z; dashed lines show the point's projections.};
\end{tikzpicture}
\end{center}`;
}

function renderSolidGeometry(visual: VisualSpec) {
  const title = `${visual.title ?? ""} ${visual.accessibilityLabel}`.toLowerCase();
  if (/sphere/.test(title)) {
    return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.95]
\shade[ball color=NovaSky!45, opacity=0.78] (0,0) circle (1.75);
\draw[very thick, NovaInk] (0,0) circle (1.75);
\draw[dashed, NovaInk!65] (0,0) ellipse (1.75 and 0.48);
\draw[very thick, NovaCoral, -{Stealth[length=2mm]}] (0,0) -- (1.55,0) node[midway, above]{\scriptsize radius $r$};
\fill[NovaInk] (0,0) circle (0.06);
\node[below] at (0,-2.05) {\scriptsize Every surface point is distance $r$ from the center.};
\end{tikzpicture}
\end{center}`;
  }

  if (/cylinder|cone/.test(title)) {
    const cone = /cone/.test(title);
    return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.95]
${cone
  ? String.raw`\coordinate (A) at (0,2.35);
\draw[very thick, NovaInk] (A) -- (-1.65,0) (A) -- (1.65,0);
\fill[NovaCoral!16] (-1.65,0) arc[start angle=180,end angle=360,x radius=1.65,y radius=0.42] -- (A) -- cycle;`
  : String.raw`\fill[NovaSky!15] (-1.65,0) rectangle (1.65,2.2);
\draw[very thick, NovaInk] (-1.65,0) -- (-1.65,2.2) (1.65,0) -- (1.65,2.2);
\draw[very thick, NovaInk] (0,2.2) ellipse (1.65 and 0.42);`}
\draw[very thick, NovaInk] (0,0) ellipse (1.65 and 0.42);
\draw[dashed, NovaInk!60] (-1.65,0) arc[start angle=180,end angle=360,x radius=1.65,y radius=0.42];
\draw[<->, NovaGrowth, thick] (2.0,0) -- (2.0,${cone ? "2.35" : "2.2"}) node[midway,right]{\scriptsize $h$};
\draw[<->, NovaCoral, thick] (0,-0.62) -- (1.65,-0.62) node[midway,below]{\scriptsize $r$};
\node[below] at (0,-1.05) {\scriptsize ${cone ? "one circular base + one curved surface" : "two congruent circular bases + one curved surface"}};
\end{tikzpicture}
\end{center}`;
  }

  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.86, line cap=round, line join=round]
\coordinate (A) at (0,0); \coordinate (B) at (3.8,0); \coordinate (C) at (3.8,2.25); \coordinate (D) at (0,2.25);
\coordinate (E) at (1.05,0.72); \coordinate (F) at (4.85,0.72); \coordinate (G) at (4.85,2.97); \coordinate (H) at (1.05,2.97);
\fill[NovaSky!13] (B)--(C)--(G)--(F)--cycle;
\fill[NovaGrowth!11] (D)--(C)--(G)--(H)--cycle;
\draw[very thick, NovaInk] (A)--(B)--(C)--(D)--cycle (B)--(F)--(G)--(C) (D)--(H)--(G);
\draw[dashed, thick, NovaInk!55] (A)--(E)--(F) (E)--(H);
\draw[<->, NovaSky, thick] (0,-0.38)--(3.8,-0.38) node[midway,below]{\scriptsize length $l$};
\draw[<->, NovaCoral, thick] (4.05,-0.15)--(5.08,0.55) node[midway,below right]{\scriptsize width $w$};
\draw[<->, NovaGrowth, thick] (5.18,0.72)--(5.18,2.97) node[midway,right]{\scriptsize height $h$};
\filldraw[fill=NovaYellow, draw=NovaInk] (C) circle (0.08);
\node[draw=NovaInk, fill=white, rounded corners=2pt, right=0.13cm of C] {\tiny vertex};
\node[fill=white, rounded corners=2pt] at (4.33,1.58) {\tiny face};
\node[above, NovaInk] at (2.0,2.25) {\tiny edge};
\node[below, text width=6.2cm, align=center] at (2.45,-0.95) {\scriptsize Solid structure: 6 faces, 12 edges, 8 vertices. Dashed lines are hidden edges.};
\end{tikzpicture}
\end{center}`;
}

function renderShapeClassification() {
  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.78, line cap=round, line join=round]
% Prism
\draw[thick] (0,0)--(1.0,0)--(1.0,1.05)--(0,1.05)--cycle;
\draw[thick] (0.35,0.28)--(1.35,0.28)--(1.35,1.33)--(0.35,1.33)--cycle;
\draw[thick] (0,0)--(0.35,0.28) (1,0)--(1.35,0.28) (1,1.05)--(1.35,1.33) (0,1.05)--(0.35,1.33);
\node[below] at (0.68,-0.22){\tiny prism};
% Pyramid
\draw[thick] (2.0,0)--(3.35,0)--(3.65,0.35)--(2.3,0.35)--cycle;
\draw[thick] (2.8,1.45)--(2.0,0) (2.8,1.45)--(3.35,0) (2.8,1.45)--(3.65,0.35) (2.8,1.45)--(2.3,0.35);
\node[below] at (2.8,-0.22){\tiny pyramid};
% Cylinder
\draw[thick] (4.35,0) -- (4.35,1.08) (5.55,0)--(5.55,1.08);
\draw[thick] (4.95,0) ellipse (0.6 and 0.18); \draw[thick] (4.95,1.08) ellipse (0.6 and 0.18);
\node[below] at (4.95,-0.3){\tiny cylinder};
% Cone
\draw[thick] (6.25,0)--(6.95,1.4)--(7.65,0); \draw[thick] (6.95,0) ellipse (0.7 and 0.2);
\node[below] at (6.95,-0.3){\tiny cone};
% Sphere
\shade[ball color=NovaSky!45] (8.75,0.65) circle (0.68); \draw[thick] (8.75,0.65) circle (0.68); \draw[dashed] (8.75,0.65) ellipse (0.68 and 0.18);
\node[below] at (8.75,-0.3){\tiny sphere};
\node[draw=NovaGrowth, fill=NovaGrowth!10, rounded corners=4pt, below, text width=8.0cm, align=center] at (4.45,-0.78) {\scriptsize Compare bases, flat faces, curved surfaces, edges, vertices, and possible cross-sections.};
\end{tikzpicture}
\end{center}`;
}

function renderSolidNet() {
  const squares = [
    [0, 0], [1, 0], [2, 0], [3, 0], [1, 1], [1, -1]
  ].map(([x, y], index) => `\\draw[fill=NovaPaper, very thick, draw=${index % 2 ? "NovaSky" : "NovaGrowth"}] (${x},${y}) rectangle (${x + 1},${y + 1});`).join("\n");

  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.77, line cap=round, line join=round]
${squares}
\draw[dashed, NovaCoral, thick] (1,0)--(1,1) (2,0)--(2,1) (3,0)--(3,1) (1,1)--(2,1) (1,0)--(2,0);
\draw[-{Stealth[length=3mm]}, very thick, SubjectAccent] (4.35,0.55)--(5.35,0.55) node[midway,above]{\scriptsize fold};
\coordinate (A) at (5.8,0); \coordinate (B) at (7.3,0); \coordinate (C) at (7.3,1.5); \coordinate (D) at (5.8,1.5);
\coordinate (E) at (6.35,0.45); \coordinate (F) at (7.85,0.45); \coordinate (G) at (7.85,1.95); \coordinate (H) at (6.35,1.95);
\draw[very thick] (A)--(B)--(C)--(D)--cycle (B)--(F)--(G)--(C) (D)--(H)--(G);
\draw[dashed, thick] (A)--(E)--(F) (E)--(H);
\node[below, text width=7.5cm, align=center] at (3.8,-1.35) {\scriptsize A valid cube net has six faces and matching edges that meet without overlap.};
\end{tikzpicture}
\end{center}`;
}

function renderEquationSteps(visual: VisualSpec) {
  const steps = visual.steps?.length ? visual.steps : visual.equation ? [visual.equation] : [];
  if (!steps.length) {
    return "";
  }

  const safeSteps = steps.slice(0, 4).map((step) => safeInlineLatex(step) || escapeLatex(step));
  const nodes = safeSteps
    .map((step, index) => `\\node[draw, rounded corners=5pt, line width=${index === safeSteps.length - 1 ? "1.4pt" : "0.9pt"}, draw=${index === safeSteps.length - 1 ? "NovaGrowth" : "NovaSky"}, fill=${index === safeSteps.length - 1 ? "NovaGrowth" : "NovaSky"}!10, minimum width=4.7cm, minimum height=0.72cm] (s${index}) at (0,${-index * 1.0}) {\\Large $${step}$};`).join("\n");
  const arrows = safeSteps.slice(0, -1).map((_, index) => `\\draw[-{Stealth[length=2.5mm]}, thick, NovaInk!60] (s${index}.south) -- (s${index + 1}.north);`).join("\n");

  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.92]
${nodes}
${arrows}
\end{tikzpicture}
\end{center}`;
}

function renderCardsVisual(visual: VisualSpec) {
  const labels = visualLabels(visual, ["Key idea", "Example", "Evidence", "Application"]).slice(0, 6);
  const columns = labels
    .map((label, index) => {
      const color = index % 2 ? "NovaGrowth" : "SubjectAccent";
      const x = (index % 2) * 2.85;
      const y = 1.2 - Math.floor(index / 2) * 1.05;
      const fontSize = label.length > 20 ? "\\tiny" : "\\scriptsize";
      return `\\node[draw, rounded corners=5pt, thick, fill=${color}!12, text width=2.3cm, minimum height=0.78cm, align=center] at (${x},${y}) {${fontSize}\\bfseries ${escapeLatex(label)}};`;
    })
    .join("\n");

  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.88]
${columns}
\end{tikzpicture}
\end{center}`;
}

function renderConceptMap(visual: VisualSpec) {
  const labels = visualLabels(visual, ["Definition", "Example", "Evidence", "Connection", "Application"]).slice(0, 5);
  const center = cleanText(visual.title, 52) || labels.shift() || "Big idea";
  const nodes = labels.map((label, index) => {
    const coordinates = [[-2.5, 1.25], [2.5, 1.25], [-2.5, -1.25], [2.5, -1.25], [0, -2.0]][index] ?? [0, -2];
    return `\\node[draw, rounded corners=5pt, line width=0.9pt, fill=${index % 2 ? "NovaGrowth" : "NovaSky"}!11, text width=1.75cm, minimum height=0.72cm, align=center] (c${index}) at (${coordinates[0]},${coordinates[1]}) {\\scriptsize ${escapeLatex(label)}};\\draw[-{Stealth[length=2mm]}, line width=0.9pt, gray!65] (core) -- (c${index});`;
  }).join("\n");

  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.92]
\node[draw=NovaInk, fill=NovaYellow!25, very thick, rounded corners=8pt, text width=2.05cm, minimum height=1.0cm, align=center] (core) at (0,0) {\bfseries ${escapeLatex(center)}};
${nodes}
\end{tikzpicture}
\end{center}`;
}

function renderTapeDiagram(visual: VisualSpec) {
  const labels = visualLabels(visual, ["Known quantity", "Matching quantity", "Scale factor", "Unknown"]);
  const parseFraction = (value?: string) => {
    const match = value?.match(/(\d+)\s*\/\s*(\d+)/);
    return match ? { denominator: Number(match[2]), numerator: Number(match[1]) } : null;
  };
  const topFraction = parseFraction(labels[0]);
  const bottomFraction = parseFraction(labels[1]);
  const topParts = Math.max(2, Math.min(8, topFraction?.denominator || visual.rows?.[0]?.length || 3));
  const bottomParts = Math.max(2, Math.min(8, bottomFraction?.denominator || visual.rows?.[1]?.length || 4));
  const topShaded = Math.max(1, Math.min(topParts, topFraction?.numerator || topParts));
  const bottomShaded = Math.max(1, Math.min(bottomParts, bottomFraction?.numerator || bottomParts));
  const width = 5.8;
  const topCells = Array.from({ length: topParts }, (_, index) => {
    const cellWidth = width / topParts;
    const fill = index < topShaded ? "NovaSky!35" : "white";
    return `\\draw[fill=${fill}, draw=NovaSky, thick] (${(index * cellWidth).toFixed(2)},1.0) rectangle (${((index + 1) * cellWidth).toFixed(2)},1.68);`;
  }).join("\n");
  const bottomCells = Array.from({ length: bottomParts }, (_, index) => {
    const cellWidth = width / bottomParts;
    const fill = index < bottomShaded ? "NovaGrowth!32" : "white";
    return `\\draw[fill=${fill}, draw=NovaGrowth, thick] (${(index * cellWidth).toFixed(2)},-0.05) rectangle (${((index + 1) * cellWidth).toFixed(2)},0.63);`;
  }).join("\n");

  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.9]
${topCells}
${bottomCells}
\node[left, align=right, font=\scriptsize\bfseries] at (-0.15,1.34) {${escapeLatex(labels[0])}};
\node[left, align=right, font=\scriptsize\bfseries] at (-0.15,0.29) {${escapeLatex(labels[1])}};
\draw[decorate, decoration={brace, amplitude=5pt}, thick, NovaCoral] (0,-0.32) -- (5.8,-0.32);
\node[below, font=\scriptsize] at (2.9,-0.56) {${escapeLatex(labels.slice(2, 4).join(" | "))}};
\end{tikzpicture}
\end{center}`;
}

function renderIconGrid(visual: VisualSpec) {
  const labels = visualLabels(visual, ["Idea", "Model", "Example", "Check"]).slice(0, 6);
  const nodes = labels.map((label, index) => {
    const x = (index % 3) * 2.05;
    const y = index < 3 ? 0.95 : -0.45;
    const color = ["NovaSky", "NovaGrowth", "NovaYellow", "NovaCoral", "NovaSky", "NovaGrowth"][index];
    return `\\node[fill=${color}!22, draw=${color}!85!black, circle, minimum size=0.72cm, font=\\bfseries] (i${index}) at (${x},${y}) {${index + 1}};\\node[below=0.12cm of i${index}, text width=1.55cm, align=center, font=\\scriptsize] {${escapeLatex(label)}};`;
  }).join("\n");

  return String.raw`\begin{center}
\begin{tikzpicture}[scale=0.9]
${nodes}
\end{tikzpicture}
\end{center}`;
}

function renderVisualSpec(visual: VisualSpec) {
  switch (visual.type) {
    case "labeled_system":
    case "annotated_image":
      if ((visual.labels ?? []).some((label) => /stomach|esophagus|intestine/i.test(label))) {
        return renderDigestiveSystemVisual(visual);
      }
      if ((visual.labels ?? []).some((label) => /battery|switch|bulb|circuit/i.test(label))) {
        return renderCircuitVisual(visual);
      }
      if ((visual.labels ?? []).some((label) => /nucleus|cytoplasm|mitochond|vacuole/i.test(label))) {
        return renderCellVisual(visual);
      }
      return renderAnnotatedSystemVisual(visual);
    case "comparison_table":
      return renderComparisonVisual(visual);
    case "structure_function":
      return /villi|villus|absorp|surface area/i.test(JSON.stringify(visual))
        ? renderVilliVisual()
        : renderComparisonVisual(visual);
    case "coordinate_graph":
      return renderCoordinateGraph(visual);
    case "coordinate_space_3d":
      return renderCoordinateSpace3D(visual);
    case "double_number_line":
      return renderDoubleNumberLine(visual);
    case "equation_steps":
      return renderEquationSteps(visual);
    case "flowchart":
    case "process_sequence":
      return renderProcessVisual(visual);
    case "ratio_table":
    case "data_table":
      return renderRatioTable(visual);
    case "callout":
      return renderConceptMap(visual);
    case "concept_map":
      return renderConceptMap(visual);
    case "icon_grid":
      return renderIconGrid(visual);
    case "labeled_cards":
      return renderCardsVisual(visual);
    case "shape_classification":
      return renderShapeClassification();
    case "solid_geometry":
      return renderSolidGeometry(visual);
    case "solid_net":
      return renderSolidNet();
    case "tape_diagram":
      return renderTapeDiagram(visual);
    default:
      return renderCardsVisual(visual);
  }
}

function renderPlanSlideBody(slide: LessonPlanSlide, hasImageAsset = false) {
  const content = slide.studentContent;
  const keyIdea = content.keyIdea
    ? normalizeLessonText(content.keyIdea).length > 150
      ? `${normalizeLessonText(content.keyIdea).slice(0, 147).trim()}...`
      : normalizeLessonText(content.keyIdea)
    : "";
  const textParts = [
    keyIdea ? String.raw`\begin{alertblock}{Key idea}
\small ${escapeLatex(keyIdea)}
\end{alertblock}` : "",
    content.explanation ? String.raw`\small ${escapeLatex(normalizeLessonText(content.explanation).slice(0, 300))}` : "",
    content.question ? String.raw`\begin{block}{Question}
\small ${escapeLatex(content.question)}
\end{block}` : "",
    latexBullets(content.bullets, 3),
    latexSteps(content.steps, 3),
    content.hint ? String.raw`\begin{block}{Hint}
\small ${escapeLatex(content.hint)}
\end{block}` : "",
    content.answer ? String.raw`\begin{block}{Answer check}
\small ${escapeLatex(content.answer)}
\end{block}` : ""
  ].filter(Boolean);
  const visualTex = hasImageAsset ? "" : slide.visuals.slice(0, 1).map(renderVisualSpec).filter(Boolean).join("\n");

  if (visualTex && textParts.length) {
    return String.raw`\begin{columns}[T]
\begin{column}{0.39\textwidth}
${textParts.join("\n\n")}
\end{column}
\begin{column}{0.57\textwidth}
${visualTex}
\end{column}
\end{columns}`;
  }

  if (visualTex) {
    return visualTex;
  }

  return textParts.join("\n\n") || String.raw`\begin{block}{Learn}
\small Review this idea, try one example, and explain your thinking.
\end{block}`;
}

function buildSlideBodies(request: LessonDeckRequest) {
  const plan = legacyLessonToSlidePlan({ context: request.context, lesson: request.lesson });
  const imageSlideNumbers = new Set(
    (request.assets ?? [])
      .filter((asset) => asset.type === "image")
      .map((asset) => assetSlideNumber(asset.placement))
      .filter(Boolean)
  );

  return plan.slides.map((slide, index) => ({
    body: renderPlanSlideBody(slide, imageSlideNumbers.has(index + 1)),
    title: slide.title
  }));
}

async function writeImageAssets(workDir: string, assets: DeckAsset[]) {
  const written: Array<{ assetId?: string; filename: string; placement: string; type: "image" }> = [];

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
      written.push({ assetId: asset.assetId, filename, placement: cleanText(asset.placement, 8), type: "image" });
    })
  );

  return written;
}

function buildBeamerTex(request: LessonDeckRequest) {
  const lesson = request.lesson ?? {};
  const context = request.context ?? {};
  const assets = request.assets ?? [];
  const template = getSubjectTemplate(context.subject, context.topic);
  const slideBodies = buildSlideBodies(request);
  const frames = slideBodies
    .map((slide, index) => frameBody(slide.title, slide.body, assets, index + 1))
    .join("\n\n");

  return String.raw`\documentclass[aspectratio=169]{beamer}
\usetheme{default}
\usepackage[absolute,overlay]{textpos}
\usepackage{amsmath}
\usepackage{booktabs}
\usepackage{graphicx}
\usepackage{tabularx}
\usepackage{xcolor}
\usepackage{tikz}
\usetikzlibrary{arrows.meta,backgrounds,calc,decorations.pathreplacing,fit,positioning,shapes.geometric}
\definecolor{NovaNavy}{HTML}{123047}
\definecolor{NovaGrowth}{HTML}{18A67A}
\definecolor{NovaSky}{HTML}{4A90E2}
\definecolor{NovaYellow}{HTML}{F4C95D}
\definecolor{NovaCoral}{HTML}{EF6F61}
\definecolor{NovaPaper}{HTML}{F8FAF7}
\definecolor{NovaInk}{HTML}{20323F}
\colorlet{NovaBlue}{NovaSky}
\colorlet{NovaMint}{NovaGrowth}
\definecolor{SubjectAccent}{HTML}{${template.color}}
\usefonttheme{professionalfonts}
\renewcommand{\familydefault}{\sfdefault}
\setbeamercolor{background canvas}{bg=NovaPaper}
\setbeamercolor{normal text}{fg=NovaInk,bg=NovaPaper}
\setbeamercolor{structure}{fg=NovaBlue}
\setbeamercolor{frametitle}{fg=white,bg=NovaNavy}
\setbeamercolor{title}{fg=white,bg=NovaNavy}
\setbeamercolor{block title}{fg=white,bg=SubjectAccent}
\setbeamercolor{block body}{fg=NovaInk,bg=SubjectAccent!7}
\setbeamercolor{block title alerted}{fg=white,bg=NovaCoral}
\setbeamercolor{block body alerted}{fg=NovaInk,bg=NovaCoral!8}
\setbeamertemplate{blocks}[rounded][shadow=false]
\setbeamerfont{frametitle}{size=\Large,series=\bfseries}
\setbeamerfont{block title}{size=\normalsize,series=\bfseries}
\setbeamertemplate{navigation symbols}{}
\setbeamertemplate{frametitle}{
  \nointerlineskip
  \begin{beamercolorbox}[wd=\paperwidth,ht=0.88cm,dp=0.22cm,leftskip=0.45cm,rightskip=0.45cm]{frametitle}
    \usebeamerfont{frametitle}\insertframetitle\hfill{\small ${template.icon}\hspace{0.2cm}${template.accent}}
  \end{beamercolorbox}
}
\setbeamertemplate{footline}{
  \leavevmode
  \hbox{
    \begin{beamercolorbox}[wd=.82\paperwidth,ht=0.24cm,dp=0.14cm,leftskip=0.45cm]{author in head/foot}
      \scriptsize\color{NovaInk!65}NovaSprout Learning
    \end{beamercolorbox}
    \begin{beamercolorbox}[wd=.18\paperwidth,ht=0.24cm,dp=0.14cm,rightskip=0.45cm plus1fil]{date in head/foot}
      \hfill\scriptsize\color{NovaInk!65}\insertframenumber
    \end{beamercolorbox}
  }
}
\newcommand{\NovaQuestion}[1]{\begin{block}{Think about it}#1\end{block}}
\newcommand{\NovaMisconception}[1]{\begin{alertblock}{Check the model}#1\end{alertblock}}
\title{${escapeLatex(lesson.title ?? "NovaSprout Lesson")}}
\subtitle{${escapeLatex(`${context.grade ?? ""} · ${context.subject ?? ""} · ${context.topic ?? ""}`)}}
\author{NovaSprout Learning}
\date{}

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
      const readableBody = slide.body
        .replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, "")
        .replace(/\\begin\{tabular\}[\s\S]*?\\end\{tabular\}/g, "")
        .replace(/\\draw\b[^;]*;/g, "")
        .replace(/\\node\b[^;]*;/g, "")
        .replace(/\\[a-zA-Z]+(?:\[[^\]]*\])?(?:\{[^}]*\})?/g, " ")
        .replace(/[{}\\]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return readableBody.length > 780 ? `Slide ${index + 1} "${slide.title}" may be too text-heavy.` : "";
    })
    .filter(Boolean);
}

function hasProgrammaticVisual(body: string) {
  return /\\begin\{tikzpicture\}|\\begin\{tabularx?\}/.test(body);
}

function getVisualCoverage(slides: Array<{ body: string; title: string }>, assets: DeckAsset[]) {
  const imageSlideNumbers = new Set(
    assets
      .filter((asset) => asset.type === "image" && asset.dataUrl?.startsWith("data:image/png;base64,"))
      .map((asset) => assetSlideNumber(asset.placement))
      .filter(Boolean)
  );
  const visualSlideNumbers = slides
    .map((slide, index) => (hasProgrammaticVisual(slide.body) || imageSlideNumbers.has(index + 1) ? index + 1 : 0))
    .filter(Boolean);
  const warnings = slides
    .map((slide, index) =>
      visualSlideNumbers.includes(index + 1)
        ? ""
        : `Slide ${index + 1} "${slide.title}" has no dominant instructional visual.`
    )
    .filter(Boolean);

  return {
    percent: slides.length ? Math.round((visualSlideNumbers.length / slides.length) * 100) : 0,
    visualSlideCount: visualSlideNumbers.length,
    warnings
  };
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
  if (!(await isAiAccessAllowed(request))) {
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

  const missingImageAssets = assets.filter((asset) => asset.type === "image" && !asset.dataUrl?.startsWith("data:image/png;base64,"));
  if (missingImageAssets.length) {
    return NextResponse.json(
      {
        compilerStatus: "validation_failed",
        error: `${missingImageAssets.length} planned image asset${missingImageAssets.length === 1 ? "" : "s"} did not include generated PNG data. The deck was not compiled because real visuals are required for these slides.`,
        validationErrors: missingImageAssets.map((asset) => `${asset.assetId || asset.placement}: missing generated image data`)
      },
      { status: 422 }
    );
  }

  const {
    embeddedImageCount,
    remotePayloadBytes,
    selected: compileAssets,
    warnings: assetWarnings
  } = selectAssetsForCompilation(assets);
  const compiledSlideBodies = buildSlideBodies({ ...body, assets: compileAssets });
  const tex = buildBeamerTex({ ...body, assets: compileAssets });
  const densityWarnings = getDensityWarnings(compiledSlideBodies);
  const visualCoverage = getVisualCoverage(compiledSlideBodies, compileAssets);
  const plannedImageAssetCount = assets.filter((asset) => asset.type === "image").length;
  const programmaticVisualCount = compiledSlideBodies.filter((slide) => hasProgrammaticVisual(slide.body)).length;
  const qualityChecks = [
    "Structured LessonSlidePlan v1 renderer active.",
    `${compiledSlideBodies.length} Beamer slides generated.`,
    `${programmaticVisualCount} built-in diagram/table visual${programmaticVisualCount === 1 ? "" : "s"} rendered from the lesson plan.`,
    `${visualCoverage.visualSlideCount} of ${compiledSlideBodies.length} slides (${visualCoverage.percent}%) contain a topic-specific diagram, model, data display, or generated image.`,
    "Generated images use a dominant visual column instead of a small overlay.",
    "Compact NovaSprout footer preserves space for lesson content.",
    `${plannedImageAssetCount} image asset${plannedImageAssetCount === 1 ? "" : "s"} planned for indexed placement.`,
    `${embeddedImageCount} generated image asset${embeddedImageCount === 1 ? "" : "s"} embedded in the compiled PDF.`,
    `${compileAssets.filter((asset) => asset.type === "latex").length} LaTeX overlay asset${
      compileAssets.filter((asset) => asset.type === "latex").length === 1 ? "" : "s"
    } included.`,
    `Remote visual payload: ${Math.round(remotePayloadBytes / 1024)} KB.`,
    "Placement codes validated against lt, ct, rt, lm, cm, rm, lb, cb, rb."
  ];

  let remoteAssets = compileAssets;
  let remoteQualityChecks = qualityChecks;
  let remoteTex = tex;
  const remoteRetryWarnings: string[] = [];
  let remoteCompile = await compileWithRemoteService({ assets: compileAssets, expectedPageCount: slideBodies.length, tex });

  if (remoteCompile && !remoteCompile.ok && compileAssets.length > 0) {
    // Optional generated images and formula overlays must never make the core
    // lesson unavailable. Rebuild solely from the validated lesson plan, whose
    // programmatic diagrams and equations are generated by this renderer.
    const fallbackAssets: DeckAsset[] = [];
    const fallbackSlideBodies = buildSlideBodies({ ...body, assets: fallbackAssets });
    const fallbackTex = buildBeamerTex({ ...body, assets: fallbackAssets });
    const fallbackCompile = await compileWithRemoteService({
      assets: fallbackAssets,
      expectedPageCount: fallbackSlideBodies.length,
      tex: fallbackTex
    });

    if (fallbackCompile?.ok) {
      const fallbackCoverage = getVisualCoverage(fallbackSlideBodies, fallbackAssets);
      const fallbackProgrammaticVisualCount = fallbackSlideBodies.filter((slide) => hasProgrammaticVisual(slide.body)).length;
      remoteAssets = fallbackAssets;
      remoteCompile = fallbackCompile;
      remoteTex = fallbackTex;
      remoteQualityChecks = [
        "Structured LessonSlidePlan v1 renderer active.",
        `${fallbackSlideBodies.length} Beamer slides generated.`,
        `${fallbackProgrammaticVisualCount} built-in diagram/table visual${fallbackProgrammaticVisualCount === 1 ? "" : "s"} rendered from the lesson plan.`,
        `${fallbackCoverage.visualSlideCount} of ${fallbackSlideBodies.length} slides (${fallbackCoverage.percent}%) contain a topic-specific diagram, model, or data display.`,
        "Optional generated assets were replaced with built-in instructional visuals after a safe compiler retry.",
        "Compact NovaSprout footer preserves space for lesson content.",
        `${plannedImageAssetCount} image asset${plannedImageAssetCount === 1 ? "" : "s"} planned for indexed placement.`,
        "0 generated image assets embedded after the safe compiler retry.",
        "0 optional LaTeX overlay assets included after the safe compiler retry.",
        "Remote visual payload after retry: 0 KB.",
        "Placement codes validated against lt, ct, rt, lm, cm, rm, lb, cb, rb."
      ];
      remoteRetryWarnings.push(
        "An optional generated asset could not be compiled, so the lesson used its topic-specific built-in visuals instead."
      );
    }
  }

  if (remoteCompile) {
    if (!remoteCompile.ok) {
      return NextResponse.json(
        {
          assetManifest: remoteAssets.map((asset) => ({
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
          qualityChecks: remoteQualityChecks,
          qualityWarnings: [...densityWarnings, ...visualCoverage.warnings, ...assetWarnings, ...remoteRetryWarnings],
          tex: process.env.NODE_ENV === "development" ? remoteTex : undefined
        },
        { status: 422 }
      );
    }

    const pageCount = remoteCompile.pageCount;
    const pdfSize = remoteCompile.pdfSize ?? 0;
    const warnings = [
      ...densityWarnings,
      ...visualCoverage.warnings,
      ...assetWarnings,
      ...remoteRetryWarnings,
      ...remoteCompile.warnings,
      ...(pageCount === slideBodies.length
        ? []
        : [`Expected ${slideBodies.length} pages but remote compiler reported ${pageCount}.`]),
      ...(pdfSize > 1000 ? [] : ["Compiled PDF is unexpectedly small."])
    ];

    return NextResponse.json({
      assetManifest: remoteAssets.map((asset) => ({
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
        ...remoteQualityChecks,
        `Compiled successfully with ${remoteCompile.compilerName}.`,
        `PDF page count checked by remote compiler: ${pageCount}.`,
        `PDF size: ${pdfSize} bytes.`
      ],
      qualityWarnings: warnings,
      tex: process.env.NODE_ENV === "development" ? remoteTex : undefined
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
        timeout: 180000
      });
    }

    const pdf = await readFile(path.join(workDir, "lesson.pdf"));
    const pageCheck = await countPdfPages(workDir, pdf);
    const pageCount = pageCheck.pages;
    const warnings = [
      ...densityWarnings,
      ...visualCoverage.warnings,
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
        qualityWarnings: [...densityWarnings, ...visualCoverage.warnings, ...assetWarnings],
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

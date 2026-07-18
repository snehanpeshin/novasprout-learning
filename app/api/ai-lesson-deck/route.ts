import { execFile } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

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

function buildSlideBodies(request: LessonDeckRequest) {
  const lesson = request.lesson ?? {};
  const slides = [
    {
      body: String.raw`\Large ${escapeLatex(lesson.studentFit)}
\vfill
\small NovaSprout Learning`,
      title: lesson.title ?? "NovaSprout Lesson"
    },
    {
      body: String.raw`\begin{itemize}
${latexItems(lesson.learningObjectives)}
\end{itemize}`,
      title: "What You Will Learn"
    },
    {
      body: escapeLatex(lesson.warmUp),
      title: "Warm-Up"
    },
    {
      body: escapeLatex(lesson.conceptExplanation),
      title: "Big Idea"
    },
    {
      body: escapeLatex(lesson.guidedExample),
      title: "Worked Example"
    },
    {
      body: String.raw`\begin{enumerate}
${latexItems(lesson.practiceQuestions)}
\end{enumerate}`,
      title: "Practice"
    },
    {
      body: String.raw`\begin{enumerate}
${latexItems(lesson.quickAssessment)}
\end{enumerate}`,
      title: "Quick Check"
    },
    {
      body: escapeLatex(lesson.recommendedNextSession),
      title: "Next Session"
    }
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

export async function POST(request: Request) {
  const expectedAccessToken = process.env.AI_LESSON_ACCESS_TOKEN?.trim();
  const providedAccessToken = request.headers.get("x-ai-access-token")?.trim();

  if (!expectedAccessToken || providedAccessToken !== expectedAccessToken) {
    return NextResponse.json({ error: "Enter the NovaSprout AI access code to compile lesson decks." }, { status: 401 });
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

  const tex = buildBeamerTex({ ...body, assets });
  const workDir = await mkdtemp(path.join(tmpdir(), "novasprout-deck-"));
  const compiler = getCompilerCommand();
  const writtenAssets = await writeImageAssets(workDir, assets);
  const densityWarnings = getDensityWarnings(slideBodies);
  const qualityChecks = [
    `${slideBodies.length} Beamer slides generated.`,
    `${writtenAssets.length} image asset${writtenAssets.length === 1 ? "" : "s"} written for indexed placement.`,
    `${assets.filter((asset) => asset.type === "latex").length} LaTeX overlay asset${
      assets.filter((asset) => asset.type === "latex").length === 1 ? "" : "s"
    } included.`,
    "Placement codes validated against lt, ct, rt, lm, cm, rm, lb, cb, rb.",
    "Temporary compile directory isolated under the OS temp folder."
  ];

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
      ...(pageCount === slideBodies.length
        ? []
        : [`Expected ${slideBodies.length} pages but detected ${pageCount} using ${pageCheck.method}.`]),
      ...(pdf.length > 1000 ? [] : ["Compiled PDF is unexpectedly small."])
    ];

    return NextResponse.json({
      assetManifest: assets.map((asset) => ({
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
        ...qualityChecks,
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
          : message.slice(0, 1200),
        qualityChecks,
        qualityWarnings: densityWarnings,
        tex
      },
      { status: missingCompiler ? 501 : 422 }
    );
  } finally {
    await rm(workDir, { force: true, recursive: true });
  }
}

import { execFile } from "child_process";
import { mkdtemp, readFile, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

type DeckAsset = {
  alt?: string;
  dataUrl?: string;
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

const positions: Record<string, { anchor: string; x: string; y: string }> = {
  cb: { anchor: "\\centering", x: "4.3cm", y: "7.1cm" },
  cm: { anchor: "\\centering", x: "4.3cm", y: "3.4cm" },
  ct: { anchor: "\\centering", x: "4.3cm", y: "1.1cm" },
  lb: { anchor: "", x: "0.55cm", y: "7.1cm" },
  lm: { anchor: "", x: "0.55cm", y: "3.4cm" },
  lt: { anchor: "", x: "0.55cm", y: "1.1cm" },
  rb: { anchor: "\\raggedleft", x: "8.2cm", y: "7.1cm" },
  rm: { anchor: "\\raggedleft", x: "8.2cm", y: "3.4cm" },
  rt: { anchor: "\\raggedleft", x: "8.2cm", y: "1.1cm" }
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

function assetSlideNumber(placement?: string) {
  const match = cleanText(placement, 8).toLowerCase().match(/^(\d+)/);
  return match ? Number(match[1]) : 0;
}

function assetPosition(placement?: string) {
  const position = cleanText(placement, 8).toLowerCase().replace(/^\d+/, "");
  return positions[position] ? position : "rb";
}

function frameBody(title: string, body: string, assets: DeckAsset[], slideNumber: number) {
  const assetTex = assets
    .map((asset, index) => {
      if (assetSlideNumber(asset.placement) !== slideNumber) {
        return "";
      }

      const position = positions[assetPosition(asset.placement)];
      const filename = asset.type === "image" && asset.dataUrl ? `asset-${slideNumber}-${index + 1}.png` : "";

      if (asset.type === "image" && filename) {
        return String.raw`\begin{textblock*}{3.2cm}(${position.x},${position.y})
${position.anchor}
\includegraphics[width=2.8cm]{${filename}}
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
    assets.map(async (asset, index) => {
      if (asset.type !== "image" || !asset.dataUrl?.startsWith("data:image/png;base64,")) {
        return;
      }

      const slideNumber = assetSlideNumber(asset.placement);
      const filename = `asset-${slideNumber}-${index + 1}.png`;
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
  const slideBodies = buildSlideBodies(request);
  const frames = slideBodies
    .map((slide, index) => frameBody(slide.title, slide.body, assets, index + 1))
    .join("\n\n");

  return String.raw`\documentclass[aspectratio=169]{beamer}
\usetheme{Madrid}
\usepackage[absolute,overlay]{textpos}
\usepackage{graphicx}
\usepackage{xcolor}
\definecolor{NovaBlue}{HTML}{1976D2}
\definecolor{NovaMint}{HTML}{0F9B78}
\definecolor{NovaInk}{HTML}{10263F}
\setbeamercolor{structure}{fg=NovaBlue}
\setbeamercolor{frametitle}{fg=white,bg=NovaInk}
\setbeamercolor{title}{fg=white,bg=NovaInk}
\setbeamertemplate{navigation symbols}{}
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
    return { args: ["-interaction=nonstopmode", "lesson.tex"], command: configured, name: configured };
  }

  return { args: ["-interaction=nonstopmode", "lesson.tex"], command: "pdflatex", name: "pdflatex" };
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

  const assets = (body.assets ?? []).slice(0, 10);
  const tex = buildBeamerTex({ ...body, assets });
  const workDir = await mkdtemp(path.join(tmpdir(), "novasprout-deck-"));
  const compiler = getCompilerCommand();
  const writtenAssets = await writeImageAssets(workDir, assets);
  const qualityChecks = [
    `${buildSlideBodies(body).length} Beamer slides generated.`,
    `${writtenAssets.length} image asset${writtenAssets.length === 1 ? "" : "s"} written for indexed placement.`,
    `${assets.filter((asset) => asset.type === "latex").length} LaTeX overlay asset${
      assets.filter((asset) => asset.type === "latex").length === 1 ? "" : "s"
    } included.`,
    "Placement codes validated against lt, ct, rt, lm, cm, rm, lb, cb, rb."
  ];

  await writeFile(path.join(workDir, "lesson.tex"), tex, "utf8");

  try {
    await execFileAsync(compiler.command, compiler.args, {
      cwd: workDir,
      timeout: 30000
    });
    const pdf = await readFile(path.join(workDir, "lesson.pdf"));

    return NextResponse.json({
      assetManifest: writtenAssets,
      compilerStatus: "compiled",
      pdfDataUrl: `data:application/pdf;base64,${pdf.toString("base64")}`,
      qualityChecks: [...qualityChecks, `Compiled successfully with ${compiler.name}.`, `PDF size: ${pdf.length} bytes.`],
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
          ? "LaTeX compiler is not installed in this deployment. Add pdflatex or a TeX-enabled AWS Lambda/container and set LATEX_COMPILER_PATH."
          : message.slice(0, 1200),
        qualityChecks,
        tex
      },
      { status: missingCompiler ? 501 : 422 }
    );
  }
}

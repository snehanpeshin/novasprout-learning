import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { POST as compileLessonDeck } from "../app/api/ai-lesson-deck/route.ts";
import {
  legacyLessonToSlidePlan,
  type LessonSlidePlan
} from "../app/lib/lessonSlidePlan.ts";
import { isPlaceholderSlide } from "../app/lib/lessonSlides/slideValidator.ts";

const execFileAsync = promisify(execFile);
const accessToken = "local-quality-matrix";
const bundledPopplerBin = path.join(
  homedir(),
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "native",
  "poppler",
  "poppler",
  "bin"
);

type Scenario = {
  assessments: string[];
  concepts: string[];
  example: string;
  grade: string;
  id: string;
  keywords: string[];
  misconception: string;
  practices: string[];
  subject: string;
  title: string;
  topic: string;
  visual: string;
  warmUp: string;
};

type Lesson = {
  conceptExplanation: string;
  duration: string;
  fullLessonSegments: Array<{ activity: string; title: string }>;
  guidedExample: string;
  learningObjectives: string[];
  practiceQuestions: string[];
  prerequisiteCheck: string[];
  quickAssessment: string[];
  recommendedNextSession: string;
  studentFit: string;
  title: string;
  warmUp: string;
};

type CycleProfile = {
  audienceMode: "student" | "teacher";
  difficulty: string;
  duration: string;
  language: string;
  mode: string;
  purpose: string;
};

type PageInspection = {
  blankPages: number[];
  clippedPages: number[];
  pageCount: number;
};

type CaseResult = {
  answerKeyCount: number;
  averageQuality: number;
  blankPages: number[];
  blockerCount: number;
  clippedPages: number[];
  compileStatus: string;
  cycle: number;
  extractedCharacters: number;
  id: string;
  minimumQuality: number;
  pageCount: number;
  pass: boolean;
  pdfBytes: number;
  placeholderSlides: string[];
  qualityWarnings: string[];
  score: number;
  slideCount: number;
  subject: string;
  topic: string;
  visualCoverage: number;
  visualTypes: string[];
};

async function runPoppler(command: "pdftoppm" | "pdftotext", args: string[], timeout: number) {
  const configured =
    command === "pdftoppm" ? process.env.PDFTOPPM_PATH : process.env.PDFTOTEXT_PATH;
  const candidates = [
    configured,
    path.join(bundledPopplerBin, command),
    `/opt/homebrew/bin/${command}`,
    `/usr/local/bin/${command}`,
    command
  ].filter((candidate): candidate is string => Boolean(candidate));
  let missingError: unknown;
  for (const candidate of candidates) {
    try {
      return await execFileAsync(candidate, args, { timeout });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      missingError = error;
    }
  }
  throw missingError ?? new Error(`${command} is not available.`);
}

const cycleProfiles: CycleProfile[] = [
  {
    audienceMode: "student",
    difficulty: "Easy",
    duration: "20-minute lesson",
    language: "English",
    mode: "Quick explanation",
    purpose: "Concise baseline"
  },
  {
    audienceMode: "student",
    difficulty: "Standard",
    duration: "45-minute comprehensive lesson",
    language: "Simplified English",
    mode: "Comprehensive lesson",
    purpose: "Long-form content and visual density"
  },
  {
    audienceMode: "student",
    difficulty: "Adaptive",
    duration: "30-minute lesson",
    language: "English",
    mode: "Homework help and practice worksheet",
    purpose: "Practice and answer-separation stress"
  },
  {
    audienceMode: "teacher",
    difficulty: "Challenging",
    duration: "60-minute deep lesson",
    language: "Bilingual English and Spanish",
    mode: "Exam preparation",
    purpose: "Teacher answers, special characters, and deep content"
  },
  {
    audienceMode: "student",
    difficulty: "Adaptive",
    duration: "45-minute comprehensive lesson",
    language: "English",
    mode: "Interactive quiz",
    purpose: "Final student-mode acceptance"
  }
];

const scenarios: Scenario[] = [
  {
    assessments: [
      "Which fraction is equivalent to 1/2? Answer: 2/4. Why: both cover the same share of an equal whole.",
      "Explain why equal-size parts matter. Answer: they define one consistent fraction unit."
    ],
    concepts: [
      "A fraction names equal parts of one whole. The denominator counts all equal parts, and the numerator counts selected parts.",
      "Equivalent fractions use different numbers to represent the same amount.",
      "Multiplying or dividing the numerator and denominator by the same nonzero number preserves value.",
      "A tape diagram keeps the whole fixed so equivalent amounts line up."
    ],
    example: "Compare 3/4 and 6/8. Step 1: draw equal-length bars. Step 2: split each fourth into two eighths. Step 3: align the shaded lengths. Answer: 3/4 = 6/8. Check: multiply by 2/2.",
    grade: "Grades 3-5",
    id: "math-fractions",
    keywords: ["fraction", "numerator", "denominator", "equivalent fraction", "common whole"],
    misconception: "A larger denominator does not automatically mean a larger fraction because it changes part size.",
    practices: [
      "Try: Show 2/3 as sixths. Hint: split each third into two. Answer: 4/6. Why: multiply by 2/2.",
      "Try: Compare 5/8 and 3/4. Hint: write 3/4 in eighths. Answer: 5/8 < 6/8.",
      "Try: Decide whether 3/5 and 6/10 are equivalent. Answer: yes. Why: 6/10 simplifies to 3/5."
    ],
    subject: "Mathematics",
    title: "Equivalent Fractions",
    topic: "Fractions and equivalent fractions",
    visual: "Show aligned fraction bars for 1/2, 2/4, and 4/8 using the same total length and equal partitions.",
    warmUp: "A rectangle has four equal parts and two are shaded. What fraction is shaded, and what simpler fraction names the same amount?"
  },
  {
    assessments: [
      "Is y = 2.5x proportional? Answer: yes. Why: 2.5 is a constant multiplier.",
      "What is the unit rate for 150 miles in 5 hours? Answer: 30 miles per hour."
    ],
    concepts: [
      "A ratio compares quantities in a stated order. Equivalent ratios preserve one multiplicative relationship.",
      "A proportional relationship has a constant unit rate.",
      "A double number line aligns corresponding values and makes scale factors visible.",
      "A proportional graph is a straight line through the origin."
    ],
    example: "A recipe uses 2 cups of flour for 3 batches. Find flour for 12 batches. Step 1: write 2/3 = x/12. Step 2: use scale factor 4. Answer: x = 8 cups. Check: 8/12 simplifies to 2/3.",
    grade: "Grades 6-8",
    id: "math-ratios",
    keywords: ["ratio", "unit rate", "proportion", "scale factor", "constant of proportionality"],
    misconception: "Adding the same number to both parts of a ratio does not preserve proportionality.",
    practices: [
      "Try: A car travels 180 miles in 3 hours. Answer: 60 miles per hour.",
      "Try: Complete 4/7 = x/21. Hint: use scale factor 3. Answer: x = 12.",
      "Try: Explain why y = 2x + 1 is not proportional. Answer: it does not pass through the origin."
    ],
    subject: "Mathematics",
    title: "Ratios and Proportional Relationships",
    topic: "Ratios and proportions",
    visual: "Use a ratio table and aligned double number line with exact values and one marked scale factor.",
    warmUp: "Simplify 6/9 and 10/15. What multiplicative relationship do the simplified ratios share?"
  },
  {
    assessments: [
      "Where does most nutrient absorption occur? Answer: the small intestine.",
      "True or false: food passes through the liver. Answer: false. Why: the liver is a helper organ."
    ],
    concepts: [
      "Digestion breaks food into small molecules the body can absorb.",
      "Food follows the mouth, esophagus, stomach, small intestine, and large intestine.",
      "The liver and pancreas add digestive chemicals, but food does not pass through them.",
      "Villi create a large surface area for nutrient absorption into blood."
    ],
    example: "Trace a bite of bread from the mouth to the small intestine. Include mechanical digestion, chemical digestion, and absorption. Answer: most nutrients enter blood through villi in the small intestine.",
    grade: "Grades 6-8",
    id: "science-digestion",
    keywords: ["digestion", "enzyme", "nutrient", "absorption", "villi"],
    misconception: "Food does not pass through every nearby organ; helper organs add chemicals through ducts.",
    practices: [
      "Try: Name the organ after the esophagus. Answer: stomach.",
      "Try: Classify chewing. Answer: mechanical digestion.",
      "Try: Predict the effect of fewer villi. Answer: nutrient absorption decreases."
    ],
    subject: "Science",
    title: "The Digestive System",
    topic: "Digestive system",
    visual: "Show the food pathway with leader-line labels and distinguish helper organs from the main tract.",
    warmUp: "What must happen to a large food molecule before it can move into the blood?"
  },
  {
    assessments: [
      "Which quantity is the same throughout one series path? Answer: current.",
      "A 12 V source drives 2 A. Find power. Answer: 24 W."
    ],
    concepts: [
      "A complete circuit is a closed conducting path with an energy source.",
      "Current is charge flow rate, voltage is energy per charge, and resistance opposes current.",
      "Series circuits have one path; parallel circuits have branches.",
      "Ohm's law is V = IR and electrical power is P = VI."
    ],
    example: "A 12 V battery connects R1 = 4 Ω and R2 = 2 Ω in series. Find total resistance and current. Answer: R_eq = 6 Ω and I = 2 A. Check: 2 A × 6 Ω = 12 V.",
    grade: "Grades 6-8",
    id: "science-electricity",
    keywords: ["charge", "current", "voltage", "resistance", "power"],
    misconception: "Current is not used up; components transfer energy while charge continues through the path.",
    practices: [
      "Try: A 9 V source connects to 3 Ω. Find current. Answer: 3 A.",
      "Try: Resistors 4 Ω and 6 Ω are in series across 20 V. Find current. Answer: 2 A.",
      "Try: A device uses 6 V and 2 A. Find power. Answer: 12 W."
    ],
    subject: "Science",
    title: "Electricity and Circuits",
    topic: "Electricity, series and parallel circuits",
    visual: "Draw source polarity, current direction, component IDs, and only values from the current problem.",
    warmUp: "What must be true about the conducting path for a lamp to light?"
  },
  {
    assessments: [
      "What is the difference between claim and evidence? Answer: a claim is an interpretation; evidence is a text detail.",
      "Why is a quotation alone incomplete? Answer: reasoning must connect it to the claim."
    ],
    concepts: [
      "A reading response begins with a precise claim that answers the question.",
      "Relevant evidence is a specific detail, quotation, or event.",
      "Reasoning explains how the evidence proves the claim.",
      "Strong readers compare possible details and select the closest logical match."
    ],
    example: "Question: How does Maya respond to difficulty? Claim: Maya is persistent. Evidence: she rebuilds after the model collapses. Reasoning: trying again after failure demonstrates persistence.",
    grade: "Grades 6-8",
    id: "english-evidence",
    keywords: ["claim", "evidence", "reasoning", "inference", "relevance"],
    misconception: "A long quotation is not automatically strong evidence; relevance matters more than length.",
    practices: [
      "Try: Choose evidence that a setting is dangerous. Answer: the bridge boards crack under each step.",
      "Try: Make 'the character was nice' precise. Answer: the character acts compassionately toward the new student.",
      "Try: Add reasoning after a quotation. Answer: explain the inference supported by the action."
    ],
    subject: "English",
    title: "Using Evidence in Reading",
    topic: "Reading comprehension and textual evidence",
    visual: "Use a claim-evidence-reasoning pathway with arrows and one concrete example per stage.",
    warmUp: "What makes one text detail stronger evidence than another?"
  },
  {
    assessments: [
      "What should a topic sentence do? Answer: state the paragraph's controlling idea.",
      "Why avoid a new idea in the conclusion? Answer: the conclusion should close the existing focus."
    ],
    concepts: [
      "A focused paragraph develops one controlling idea.",
      "The topic sentence states that focus clearly.",
      "Supporting sentences add connected reasons, facts, examples, and explanations.",
      "Transitions show relationships, and the conclusion reinforces significance."
    ],
    example: "Build a paragraph about school gardens. State one focused topic sentence, add two observations as support, explain their connection, and conclude why the evidence matters.",
    grade: "Grades 3-5",
    id: "english-paragraphs",
    keywords: ["topic sentence", "supporting detail", "transition", "focus", "conclusion"],
    misconception: "A paragraph is not a set of unrelated sentences; each sentence develops the same focus.",
    practices: [
      "Try: Write a topic sentence about uniforms. Answer: School uniforms can reduce morning distractions.",
      "Try: Remove an off-topic sports sentence from a recycling paragraph. Answer: remove it.",
      "Try: Add a transition before an example. Answer: use 'For example,'."
    ],
    subject: "English",
    title: "Building a Strong Paragraph",
    topic: "Paragraph writing",
    visual: "Show a paragraph organizer with topic sentence, connected supports, explanation, and conclusion.",
    warmUp: "How can you tell whether a sentence belongs in a paragraph?"
  },
  {
    assessments: [
      "What does map scale show? Answer: the relationship between map distance and real distance.",
      "Why is a legend needed? Answer: it explains map symbols and colors."
    ],
    concepts: [
      "Maps represent places using a viewpoint, scale, and symbols.",
      "A compass rose communicates cardinal and intermediate directions.",
      "A legend explains symbols, while scale converts map distance to real distance.",
      "Physical and political maps emphasize different geographic information."
    ],
    example: "A map scale says 1 cm represents 20 km. Towns are 3.5 cm apart. Multiply 3.5 by 20. Answer: 70 km.",
    grade: "Grades 3-5",
    id: "social-maps",
    keywords: ["scale", "legend", "compass rose", "physical map", "political map"],
    misconception: "Visual size on a map can be affected by scale and projection.",
    practices: [
      "Try: Move north and east. Answer: northeast.",
      "Try: Convert 4 cm using 1 cm = 15 km. Answer: 60 km.",
      "Try: Choose a map for mountain ranges. Answer: physical map."
    ],
    subject: "Social Studies",
    title: "Reading Maps",
    topic: "Maps and geography",
    visual: "Show a map with compass rose, legend, scale bar, route, river, border, and landform.",
    warmUp: "What information turns a measured map distance into a real distance?"
  },
  {
    assessments: [
      "Which branch interprets laws? Answer: the judicial branch.",
      "Why separate powers? Answer: to prevent one part from controlling every function."
    ],
    concepts: [
      "A constitutional government limits power through written rules and protected rights.",
      "The legislative branch makes laws, the executive carries them out, and the judicial branch interprets them.",
      "Separation of powers assigns different responsibilities.",
      "Checks and balances allow branches to limit specific actions of the others."
    ],
    example: "A legislature passes a bill, the executive vetoes it, and the legislature considers an override. This is checks and balances because no branch decides alone.",
    grade: "Grades 9-10",
    id: "social-civics",
    keywords: ["constitution", "legislative", "executive", "judicial", "checks and balances"],
    misconception: "Separation of powers does not mean branches never interact.",
    practices: [
      "Try: Classify writing a regulation. Answer: executive function.",
      "Try: Classify constitutional review. Answer: judicial function.",
      "Try: Compare separation and checks. Answer: one divides duties; the other creates controlled interactions."
    ],
    subject: "Social Studies",
    title: "Branches of Government",
    topic: "Government, civics, and checks and balances",
    visual: "Use a three-branch diagram with arrows naming one specific check in each direction.",
    warmUp: "What risk arises if one group writes, enforces, and interprets every law?"
  },
  {
    assessments: [
      "What makes an algorithm unambiguous? Answer: every step has one clear interpretation.",
      "Which structure repeats steps? Answer: a loop."
    ],
    concepts: [
      "An algorithm is a finite sequence of precise steps.",
      "Sequence controls order, selection chooses paths, and iteration repeats steps.",
      "Inputs provide data, processing transforms data, and outputs communicate results.",
      "Testing traces normal, boundary, and unexpected inputs."
    ],
    example: "Find the larger of A and B. Read both values. If A > B, output A; otherwise output B. Check A = 7 and B = 4. Answer: 7.",
    grade: "Grades 6-8",
    id: "coding-algorithms",
    keywords: ["algorithm", "sequence", "selection", "iteration", "input"],
    misconception: "A vague instruction such as 'handle the data' is not a precise algorithm step.",
    practices: [
      "Try: Decide whether n is even. Answer: test whether n mod 2 equals zero.",
      "Try: Trace adding 1 three times from 5. Answer: 8.",
      "Try: Name a boundary input for an eight-character password. Answer: exactly eight characters."
    ],
    subject: "Computer Science",
    title: "Algorithms and Flowcharts",
    topic: "Algorithms",
    visual: "Show input, decision, loop, and output with standard flowchart shapes and arrows.",
    warmUp: "What makes directions precise enough for a computer to follow?"
  },
  {
    assessments: [
      "What type does input() return? Answer: string.",
      "Which operator tests equality? Answer: double equals."
    ],
    concepts: [
      "A variable stores a value under a meaningful name.",
      "Python input arrives as text, so calculations may require int() or float().",
      "A conditional uses a Boolean expression to select an indented block.",
      "Testing should include both branches and exact boundary values."
    ],
    example: "Create an age checker. Read age as an integer. If age >= 13, print teen; otherwise print child. Check ages 12, 13, and 14.",
    grade: "Grades 9-10",
    id: "coding-python",
    keywords: ["variable", "string", "integer", "Boolean", "conditional"],
    misconception: "One equals sign assigns a value; it does not compare two values.",
    practices: [
      "Try: Convert '42' to an integer. Answer: int('42').",
      "Try: Write score at least 70. Answer: score >= 70.",
      "Try: Fix if score = 10. Answer: use == for comparison."
    ],
    subject: "Computer Science",
    title: "Python Variables and Decisions",
    topic: "Python programming",
    visual: "Show a code trace with variable state boxes and a two-branch decision flow.",
    warmUp: "How is storing a value different from testing equality?"
  },
  {
    assessments: [
      "What should you identify first? Answer: the question's exact task.",
      "Why return to the passage? Answer: to verify the answer with evidence."
    ],
    concepts: [
      "Efficient reading begins by identifying exactly what the question asks.",
      "A strong answer must be supported by the passage.",
      "Distractors may exaggerate, reverse a relationship, or answer a different question.",
      "After choosing, verify the exact phrase or inference that supports the answer."
    ],
    example: "For a main-purpose question, summarize each paragraph, identify the repeated idea, and eliminate choices focused on one minor detail.",
    grade: "Grades 9-10",
    id: "test-reading",
    keywords: ["question stem", "evidence", "inference", "distractor", "elimination"],
    misconception: "The longest option is not automatically correct.",
    practices: [
      "Try: A choice says always when the passage says sometimes. Answer: eliminate it.",
      "Try: Two options are true but one answers the question. Answer: choose direct relevance.",
      "Try: Distinguish main idea from topic. Answer: the main idea states what the author says about the topic."
    ],
    subject: "Test Preparation",
    title: "Reading Question Strategy",
    topic: "Reading questions and test strategy",
    visual: "Show read-question, locate-evidence, eliminate, and verify with a return arrow.",
    warmUp: "Why can a true statement still be wrong for a particular question?"
  },
  {
    assessments: [
      "What comes before calculation? Answer: identify givens and the requested quantity.",
      "Why estimate? Answer: to detect an unreasonable result."
    ],
    concepts: [
      "Timed math becomes manageable when givens, unknowns, and relationships are identified first.",
      "A diagram, table, or equation must encode the current problem.",
      "Estimation predicts answer scale and sign before exact calculation.",
      "A final check tests units, substitution, arithmetic, and relevance."
    ],
    example: "A jacket costs $80 and is discounted 25 percent. Calculate 0.25 × 80 = 20, then subtract. Answer: $60. Check: 75 percent of 80 is 60.",
    grade: "Grades 11-12",
    id: "test-math",
    keywords: ["given", "unknown", "estimate", "substitute", "verify"],
    misconception: "A familiar number pattern does not justify reusing values from another problem.",
    practices: [
      "Try: Increase 60 by 15 percent. Answer: 69.",
      "Try: Solve 3x + 5 = 20. Answer: x = 5.",
      "Try: Estimate 19.8 × 5.1. Answer: about 100."
    ],
    subject: "Test Preparation",
    title: "Timed Math Review",
    topic: "Math review and test strategy",
    visual: "Show a given-find-model-solve-check sequence using only current values.",
    warmUp: "What checks catch a calculator or substitution mistake?"
  }
];

function profileFor(cycle: number) {
  return cycleProfiles[Math.max(0, Math.min(cycleProfiles.length - 1, cycle - 1))];
}

function rotate<T>(items: T[], amount: number) {
  if (!items.length) return [];
  const offset = amount % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function lessonFor(scenario: Scenario, cycle: number): Lesson {
  const profile = profileFor(cycle);
  const practices = rotate(scenario.practices, cycle - 1);
  const practiceCount = cycle === 1 ? 3 : cycle === 3 || cycle === 5 ? 6 : 4;
  while (practices.length < practiceCount) practices.push(...scenario.practices);
  const conceptExtra = cycle === 2
    ? ` ${scenario.visual} ${scenario.misconception}`
    : cycle === 4
      ? " Use complete labels and a final reasonableness check. Explicación visual: conecta cada dato con la idea que representa."
      : "";
  const segments = [
    { activity: `${scenario.concepts[0]} ${scenario.concepts[1]}`, title: "Build the core idea" },
    { activity: `${scenario.visual} ${scenario.concepts[2]}`, title: "Read the visual model" },
    { activity: `${scenario.concepts[3]} ${scenario.misconception}`, title: "Connect and correct" },
    { activity: `Apply the idea to a new example and justify the result. ${scenario.assessments[0]}`, title: "Apply and verify" }
  ];
  return {
    conceptExplanation: `${scenario.concepts.join(" ")}${conceptExtra}`,
    duration: profile.duration,
    fullLessonSegments: segments.slice(0, cycle === 1 ? 2 : 4),
    guidedExample: scenario.example,
    learningObjectives: [
      `Explain the relationship between ${scenario.keywords[0]} and ${scenario.keywords[1]}.`,
      `Interpret a topic-specific visual using ${scenario.keywords[2]}.`,
      "Apply the idea to a new problem and check the result."
    ],
    practiceQuestions: practices.slice(0, practiceCount),
    prerequisiteCheck: [
      `Define or recognize ${scenario.keywords[0]}.`,
      `Describe one connection involving ${scenario.keywords[1]}.`
    ],
    quickAssessment: cycle === 4
      ? [...scenario.assessments, ...scenario.practices].slice(0, 6)
      : scenario.assessments,
    recommendedNextSession: `Use missed questions to revisit ${scenario.keywords[1]} and apply the idea in a new context.`,
    studentFit: `${profile.difficulty} ${profile.language} lesson for ${scenario.grade}. ${profile.purpose}.`,
    title: `${scenario.title}: ${profile.mode}`,
    warmUp: scenario.warmUp
  };
}

function visibleStudentText(plan: LessonSlidePlan) {
  return plan.slides
    .filter((slide) => slide.slideType !== "worked_example")
    .flatMap((slide) => [
      slide.studentContent.keyIdea,
      slide.studentContent.explanation,
      slide.studentContent.question,
      ...(slide.studentContent.bullets ?? []),
      ...(slide.studentContent.steps ?? []),
      ...slide.visuals.flatMap((visual) => [
        visual.caption,
        ...(visual.labels ?? []),
        ...(visual.steps ?? [])
      ])
    ])
    .filter(Boolean)
    .join(" ");
}

function structuralIssues(plan: LessonSlidePlan, profile: CycleProfile) {
  const issues: string[] = [];
  const placeholders = plan.slides
    .filter((slide) => isPlaceholderSlide({ ...slide, legacyType: slide.type }))
    .map((slide) => slide.id);
  if (!plan.deckQuality?.exportReady) issues.push("deck-quality-gate");
  if (placeholders.length) issues.push("placeholder-slide");
  if (plan.slides.length < 6) issues.push("too-few-slides");
  if (!plan.answerKey?.length) issues.push("missing-answer-key");
  if (profile.audienceMode === "student" && /\b(?:Answer|Solution|Correct answer)\s*:/i.test(visibleStudentText(plan))) {
    issues.push("visible-answer");
  }
  const unrepairedErrors = (plan.qualityFindings ?? []).filter(
    (finding) => finding.severity === "error" && !/Automatically repaired/i.test(finding.repair ?? "")
  );
  issues.push(...unrepairedErrors.map((finding) => finding.code));
  return { issues: [...new Set(issues)], placeholders };
}

function ppmHeader(buffer: Buffer) {
  let offset = 0;
  const tokens: string[] = [];
  while (tokens.length < 4 && offset < buffer.length) {
    while (offset < buffer.length && /\s/.test(String.fromCharCode(buffer[offset]))) offset += 1;
    if (buffer[offset] === 35) {
      while (offset < buffer.length && buffer[offset] !== 10) offset += 1;
      continue;
    }
    let token = "";
    while (offset < buffer.length && !/\s/.test(String.fromCharCode(buffer[offset]))) {
      token += String.fromCharCode(buffer[offset]);
      offset += 1;
    }
    tokens.push(token);
  }
  while (offset < buffer.length && /\s/.test(String.fromCharCode(buffer[offset]))) offset += 1;
  return {
    dataOffset: offset,
    height: Number(tokens[2]),
    magic: tokens[0],
    max: Number(tokens[3]),
    width: Number(tokens[1])
  };
}

function inspectPpm(buffer: Buffer) {
  const { dataOffset, height, magic, max, width } = ppmHeader(buffer);
  if (magic !== "P6" || max !== 255 || !width || !height) return { blank: true, clipped: true };
  const top = Math.floor(height * 0.16);
  const bottom = Math.floor(height * 0.91);
  const edgeWidth = Math.max(2, Math.floor(width * 0.012));
  let bodyInk = 0;
  let edgeInk = 0;
  for (let y = top; y < bottom; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = dataOffset + (y * width + x) * 3;
      const distance =
        Math.abs((buffer[index] ?? 248) - 248) +
        Math.abs((buffer[index + 1] ?? 250) - 250) +
        Math.abs((buffer[index + 2] ?? 247) - 247);
      if (distance < 65) continue;
      bodyInk += 1;
      if (x < edgeWidth || x >= width - edgeWidth) edgeInk += 1;
    }
  }
  return {
    blank: bodyInk < Math.max(35, width * 0.15),
    clipped: edgeInk > Math.max(6, height * 0.04)
  };
}

async function inspectPdf(pdfPath: string, expectedPages: number): Promise<PageInspection> {
  const workDir = await mkdtemp(path.join(tmpdir(), "novasprout-matrix-render-"));
  try {
    const prefix = path.join(workDir, "page");
    await runPoppler("pdftoppm", ["-r", "55", pdfPath, prefix], 90000);
    const files = (await readdir(workDir))
      .filter((file) => /^page-\d+\.ppm$/.test(file))
      .sort((left, right) => Number(left.match(/\d+/)?.[0]) - Number(right.match(/\d+/)?.[0]));
    const blankPages: number[] = [];
    const clippedPages: number[] = [];
    for (const [index, file] of files.entries()) {
      const inspection = inspectPpm(await readFile(path.join(workDir, file)));
      if (inspection.blank) blankPages.push(index + 1);
      if (inspection.clipped) clippedPages.push(index + 1);
    }
    return { blankPages, clippedPages, pageCount: files.length || expectedPages };
  } finally {
    await rm(workDir, { force: true, recursive: true });
  }
}

async function extractText(pdfPath: string) {
  const target = `${pdfPath}.txt`;
  try {
    await runPoppler("pdftotext", [pdfPath, target], 30000);
    return await readFile(target, "utf8");
  } finally {
    await rm(target, { force: true });
  }
}

function resultScore(
  averageQuality: number,
  minimumQuality: number,
  visualCoverage: number,
  blockers: number,
  inspection: PageInspection
) {
  let score = 100 - blockers * 18 - inspection.blankPages.length * 20 - inspection.clippedPages.length * 12;
  if (minimumQuality < 75) score -= 75 - minimumQuality;
  if (averageQuality < 85) score -= Math.ceil(85 - averageQuality);
  if (visualCoverage < 65) score -= Math.ceil((65 - visualCoverage) / 2);
  return Math.max(0, Math.round(score));
}

async function runCase(scenario: Scenario, cycle: number, outputDir: string): Promise<CaseResult> {
  const profile = profileFor(cycle);
  const lesson = lessonFor(scenario, cycle);
  const plan = legacyLessonToSlidePlan({
    context: { grade: scenario.grade, subject: scenario.subject, topic: scenario.topic },
    lesson
  });
  await writeFile(
    path.join(outputDir, `${scenario.id}.plan.json`),
    `${JSON.stringify(plan, null, 2)}\n`,
    "utf8"
  );
  const structural = structuralIssues(plan, profile);
  const response = await compileLessonDeck(new Request("http://localhost/api/ai-lesson-deck", {
    body: JSON.stringify({
      audienceMode: profile.audienceMode,
      context: { grade: scenario.grade, subject: scenario.subject, topic: scenario.topic },
      lesson
    }),
    headers: { "content-type": "application/json", "x-ai-access-token": accessToken },
    method: "POST"
  }));
  const payload = await response.json();
  const pdfPath = path.join(outputDir, `${scenario.id}.pdf`);
  let pdfBytes = 0;
  let extractedText = "";
  let inspection: PageInspection = { blankPages: [], clippedPages: [], pageCount: 0 };
  const blockers = [...structural.issues];

  if (response.ok && typeof payload.pdfDataUrl === "string") {
    const pdf = Buffer.from(payload.pdfDataUrl.replace(/^data:application\/pdf;base64,/, ""), "base64");
    pdfBytes = pdf.length;
    await writeFile(pdfPath, pdf);
    if (typeof payload.tex === "string") {
      await writeFile(path.join(outputDir, `${scenario.id}.tex`), payload.tex, "utf8");
    }
    inspection = await inspectPdf(pdfPath, Number(payload.pageCount ?? plan.slides.length));
    extractedText = await extractText(pdfPath);
    if (inspection.pageCount !== plan.slides.length) blockers.push("page-count-mismatch");
    if (inspection.blankPages.length) blockers.push("blank-page");
    if (inspection.clippedPages.length) blockers.push("right-or-left-edge-clipping");
  } else {
    blockers.push(`compile-${payload.compilerStatus ?? response.status}`);
  }

  const visualSlides = plan.slides.filter((slide) => slide.visuals.length).length;
  const visualCoverage = plan.slides.length ? Math.round((visualSlides / plan.slides.length) * 100) : 0;
  const averageQuality = plan.deckQuality?.average ?? 0;
  const minimumQuality = plan.deckQuality?.minimum ?? 0;
  const uniqueBlockers = [...new Set(blockers)];
  const score = resultScore(averageQuality, minimumQuality, visualCoverage, uniqueBlockers.length, inspection);
  const warnings = ((payload.qualityWarnings ?? []) as string[]).filter((warning) =>
    /no dominant|text-heavy|overflow|clip|placeholder|answer|mismatch|incomplete/i.test(warning)
  );

  return {
    answerKeyCount: plan.answerKey?.length ?? 0,
    averageQuality,
    blankPages: inspection.blankPages,
    blockerCount: uniqueBlockers.length,
    clippedPages: inspection.clippedPages,
    compileStatus: payload.compilerStatus ?? (response.ok ? "compiled" : `http-${response.status}`),
    cycle,
    extractedCharacters: extractedText.length,
    id: scenario.id,
    minimumQuality,
    pageCount: Number(payload.pageCount ?? inspection.pageCount),
    pass: response.ok && !uniqueBlockers.length && score >= 85,
    pdfBytes,
    placeholderSlides: structural.placeholders,
    qualityWarnings: [...new Set([...uniqueBlockers, ...warnings])],
    score,
    slideCount: plan.slides.length,
    subject: scenario.subject,
    topic: scenario.topic,
    visualCoverage,
    visualTypes: [...new Set(plan.slides.flatMap((slide) => slide.visuals.map((visual) => visual.type)))].sort()
  };
}

function markdownReport(results: CaseResult[], cycle: number) {
  const passed = results.filter((result) => result.pass).length;
  const average = Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length);
  const lines = [
    `# NovaSprout Lesson Quality Matrix: Cycle ${cycle}`,
    "",
    `- Cases: ${results.length}`,
    `- Passed: ${passed}/${results.length}`,
    `- Average score: ${average}/100`,
    `- Compiled PDFs: ${results.filter((result) => result.compileStatus === "compiled").length}/${results.length}`,
    "",
    "| Subject | Topic | Score | Pages | Visuals | Result | Issues |",
    "| --- | --- | ---: | ---: | ---: | --- | --- |"
  ];
  for (const result of results) {
    lines.push(
      `| ${result.subject} | ${result.topic} | ${result.score} | ${result.pageCount} | ${result.visualCoverage}% | ${result.pass ? "PASS" : "FAIL"} | ${result.qualityWarnings.join("; ") || "None"} |`
    );
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const cycleArgument = process.argv.find((argument) => argument.startsWith("--cycle="));
  const caseArgument = process.argv.find((argument) => argument.startsWith("--case="));
  const cycle = Number(cycleArgument?.split("=")[1] ?? 1);
  if (!Number.isInteger(cycle) || cycle < 1 || cycle > cycleProfiles.length) {
    throw new Error(`Choose --cycle=1 through --cycle=${cycleProfiles.length}.`);
  }
  process.env.AI_LESSON_ACCESS_TOKEN = accessToken;
  process.env.LATEX_COMPILE_SERVICE_URL = "";
  Object.assign(process.env, { NODE_ENV: "development" });

  const outputDir = path.resolve("tmp", "lesson-quality-matrix", `cycle-${cycle}`);
  await mkdir(outputDir, { recursive: true });
  const requestedCase = caseArgument?.split("=")[1];
  const selectedScenarios = requestedCase
    ? scenarios.filter((scenario) => scenario.id === requestedCase)
    : scenarios;
  if (!selectedScenarios.length) {
    throw new Error(`Unknown case "${requestedCase}".`);
  }
  const results: CaseResult[] = [];
  for (const [index, scenario] of selectedScenarios.entries()) {
    const result = await runCase(scenario, cycle, outputDir);
    results.push(result);
    process.stdout.write(
      `[${index + 1}/${selectedScenarios.length}] ${scenario.id}: ${result.pass ? "PASS" : "FAIL"} ${result.score}/100 (${result.pageCount} pages)\n`
    );
  }

  const summary = {
    averageScore: Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length),
    compiled: results.filter((result) => result.compileStatus === "compiled").length,
    passed: results.filter((result) => result.pass).length,
    total: results.length
  };
  const reportStem = requestedCase ? `${requestedCase}.report` : "report";
  await writeFile(
    path.join(outputDir, `${reportStem}.json`),
    `${JSON.stringify({ cycle, generatedAt: new Date().toISOString(), profile: profileFor(cycle), results, summary }, null, 2)}\n`,
    "utf8"
  );
  await writeFile(path.join(outputDir, `${reportStem}.md`), markdownReport(results, cycle), "utf8");
  process.stdout.write(`Report: ${path.join(outputDir, `${reportStem}.md`)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

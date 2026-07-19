export const lessonSlidePlanSchemaVersion = "1.0";

export type SubjectKey = "math" | "science" | "ela" | "coding" | "general";

export type SlideType =
  | "answer_explanation"
  | "big_idea"
  | "comparison"
  | "concept"
  | "data_display"
  | "exit_ticket"
  | "guided_practice"
  | "independent_practice"
  | "labeled_diagram"
  | "misconception"
  | "prior_knowledge"
  | "process"
  | "roadmap"
  | "summary"
  | "title"
  | "vocabulary"
  | "warm_up"
  | "worked_example";

export type VisualType =
  | "annotated_image"
  | "callout"
  | "comparison_table"
  | "concept_map"
  | "coordinate_graph"
  | "data_table"
  | "double_number_line"
  | "equation_steps"
  | "flowchart"
  | "icon_grid"
  | "labeled_cards"
  | "labeled_system"
  | "process_sequence"
  | "ratio_table"
  | "structure_function"
  | "tape_diagram";

export type VisualSpec = {
  accessibilityLabel: string;
  caption?: string;
  columns?: Array<{ items: string[]; title: string }>;
  equation?: string;
  id: string;
  labels?: string[];
  points?: Array<{ x: number; y: number }>;
  rows?: string[][];
  steps?: string[];
  tableHeaders?: string[];
  title?: string;
  type: VisualType;
};

export type LessonPlanSlide = {
  accessibilityLabel: string;
  estimatedMinutes: number;
  id: string;
  studentContent: {
    answer?: string;
    bullets?: string[];
    examples?: string[];
    explanation?: string;
    hint?: string;
    keyIdea?: string;
    question?: string;
    steps?: string[];
  };
  title: string;
  type: SlideType;
  visualPriority: "high" | "medium" | "low";
  visuals: VisualSpec[];
};

export type LessonSlidePlan = {
  context: {
    grade: string;
    subject: string;
    subjectKey: SubjectKey;
    topic: string;
  };
  durationMinutes: number;
  schemaVersion: typeof lessonSlidePlanSchemaVersion;
  slides: LessonPlanSlide[];
  title: string;
  validationWarnings: string[];
};

type LegacyLesson = {
  conceptExplanation?: string;
  duration?: string;
  fullLessonSegments?: Array<{ activity?: string; time?: string; title?: string }>;
  guidedExample?: string;
  learningObjectives?: string[];
  practiceQuestions?: string[];
  prerequisiteCheck?: string[];
  quickAssessment?: string[];
  recommendedNextSession?: string;
  studentFit?: string;
  title?: string;
  warmUp?: string;
};

type LegacyContext = {
  grade?: string;
  subject?: string;
  topic?: string;
};

export function normalizePlainText(value?: string, maxLength = 900) {
  return (value ?? "")
    .replace(/-\s*[>¿]/g, " to ")
    .replace(/[→⇒]/g, " to ")
    .replace(/[×✕]/g, " x ")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function stripDuplicateNumbering(value?: string) {
  return normalizePlainText(value, 900).replace(/^\s*(?:Q?\d+[\).:-]\s*)+/i, "");
}

function removeTutorInstructionLanguage(value?: string, maxLength = 900) {
  return normalizePlainText(value, maxLength)
    .replace(/\b(?:tutor|teacher|instructor)\s+(?:explains?|presents?|asks?|models?|introduces?|gives?|checks?|confirms?|notes?|guides?)\b/gi, "Study")
    .replace(/\b(?:ask|tell|have)\s+the\s+student\s+to\b/gi, "Try to")
    .replace(/\bthe\s+student\s+(?:responds?|works?|solves?|explains?)\b/gi, "You work")
    .replace(/\bstudent\s+will\b/gi, "you will")
    .replace(/\bstudents\s+will\b/gi, "you will")
    .replace(/\bteacher should\b/gi, "focus on")
    .replace(/\btutor should\b/gi, "focus on")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeTutorProcedure(value?: string) {
  return /\b(?:tutor|teacher|instructor)\s+(?:explains?|presents?|asks?|models?|introduces?|gives?|checks?|confirms?|notes?|guides?)\b/i.test(value ?? "");
}

export function detectSubjectKey(subject?: string, topic?: string): SubjectKey {
  const normalizedTopic = normalizePlainText(topic, 120).toLowerCase();
  if (/\b(digest|biology|cell|organ|organism|ecosystem|photosynthesis|respiration|force|motion|energy|matter|atom|chemical|electric|electricity|circuit|current|voltage|charge|resistance)\b/.test(normalizedTopic)) {
    return "science";
  }
  if (/\b(ratio|proportion|fraction|equation|algebra|geometry|graph|linear|percent|integer)\b/.test(normalizedTopic)) {
    return "math";
  }

  const normalized = normalizePlainText(subject, 80).toLowerCase();
  if (/\b(science|biology|chemistry|physics|health|environmental)\b/.test(normalized)) {
    return "science";
  }
  if (/\b(ela|english|language|reading|writing)\b/.test(normalized)) {
    return "ela";
  }
  if (/\b(coding|computer|data|robotics|engineering|programming)\b/.test(normalized)) {
    return "coding";
  }
  if (/\b(math|mathematics|algebra|geometry|statistics|accounting)\b/.test(normalized)) {
    return "math";
  }
  return "general";
}

export function durationToMinutes(value?: string) {
  const minutes = Number(normalizePlainText(value, 30).match(/\d+/)?.[0] ?? 45);
  return Number.isFinite(minutes) ? Math.max(20, Math.min(90, minutes)) : 45;
}

export function chunkText(value?: string, maxLength = 220, maxChunks = 5) {
  const text = normalizePlainText(value, 3000);
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

  return chunks.length ? chunks : [text.slice(0, maxLength)];
}

function slideTitle(prefix: string, text: string, fallback: string) {
  const words = normalizePlainText(text, 140)
    .replace(/[^\w\s:+\-/%]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join(" ");
  return words ? `${prefix}: ${words}` : fallback;
}

function splitQuestionParts(value: string) {
  const text = stripDuplicateNumbering(value);
  const hintMatch = text.match(/\bHint:\s*([^]*?)(?:\bAnswer:|\bWhy:|$)/i);
  const answerMatch = text.match(/\bAnswer:\s*([^]*?)(?:\bWhy:|$)/i);
  const whyMatch = text.match(/\bWhy:\s*([^]*?)$/i);
  const question = text.replace(/\bHint:\s*[^]*$/i, "").replace(/^Try:\s*/i, "").trim();
  return {
    answer: normalizePlainText(answerMatch?.[1], 240),
    hint: normalizePlainText(hintMatch?.[1], 240),
    question: normalizePlainText(question || text, 320),
    why: normalizePlainText(whyMatch?.[1], 240)
  };
}

function makeSlide(
  id: string,
  type: SlideType,
  title: string,
  estimatedMinutes: number,
  studentContent: LessonPlanSlide["studentContent"],
  visuals: VisualSpec[] = [],
  visualPriority: LessonPlanSlide["visualPriority"] = visuals.length ? "high" : "medium"
): LessonPlanSlide {
  return {
    accessibilityLabel: `${title}. ${studentContent.keyIdea ?? studentContent.explanation ?? studentContent.question ?? ""}`.trim(),
    estimatedMinutes,
    id,
    studentContent,
    title,
    type,
    visualPriority,
    visuals
  };
}

const topicVocabulary = [
  {
    pattern: /\b(digest|stomach|intestine|enzyme|bile|food)\b/i,
    terms: ["mouth", "esophagus", "stomach", "small intestine", "large intestine", "enzyme", "bile", "absorption", "villi", "waste"]
  },
  {
    pattern: /\b(electric|circuit|current|voltage|charge|resistance|battery)\b/i,
    terms: ["electric charge", "current", "voltage", "circuit", "battery", "conductor", "insulator", "resistance", "switch", "energy transfer"]
  },
  {
    pattern: /\b(force|motion|speed|velocity|acceleration|friction|gravity)\b/i,
    terms: ["force", "motion", "speed", "velocity", "acceleration", "friction", "gravity", "balanced force", "unbalanced force"]
  },
  {
    pattern: /\b(cell|cells|tissue|organ|organism|microscope)\b/i,
    terms: ["cell", "tissue", "organ", "organ system", "nucleus", "membrane", "cytoplasm", "function", "structure"]
  },
  {
    pattern: /\b(ecosystem|food chain|habitat|population|community)\b/i,
    terms: ["ecosystem", "habitat", "population", "community", "producer", "consumer", "decomposer", "food chain", "energy flow"]
  },
  {
    pattern: /\b(ratio|proportion|unit rate|scale factor)\b/i,
    terms: ["ratio", "unit rate", "equivalent ratio", "proportion", "scale factor", "constant of proportionality", "table", "graph"]
  },
  {
    pattern: /\b(fraction|decimal|percent|numerator|denominator)\b/i,
    terms: ["fraction", "numerator", "denominator", "equivalent fraction", "decimal", "percent", "benchmark", "simplify"]
  },
  {
    pattern: /\b(equation|algebra|variable|expression|inequality)\b/i,
    terms: ["variable", "expression", "equation", "coefficient", "constant", "solution", "inverse operation", "balance"]
  },
  {
    pattern: /\b(geometry|angle|triangle|area|perimeter|volume)\b/i,
    terms: ["point", "line", "angle", "triangle", "area", "perimeter", "volume", "parallel", "perpendicular"]
  },
  {
    pattern: /\b(reading|main idea|inference|evidence|comprehension)\b/i,
    terms: ["main idea", "detail", "inference", "evidence", "context clue", "theme", "summary", "author's purpose"]
  },
  {
    pattern: /\b(essay|paragraph|writing|grammar|sentence)\b/i,
    terms: ["claim", "topic sentence", "evidence", "explanation", "transition", "conclusion", "revision", "grammar"]
  },
  {
    pattern: /\b(python|scratch|javascript|html|algorithm|code|program)\b/i,
    terms: ["input", "output", "algorithm", "variable", "condition", "loop", "debug", "function", "test case"]
  },
  {
    pattern: /\b(map|geography|history|civics|government|economics)\b/i,
    terms: ["context", "cause", "effect", "perspective", "evidence", "timeline", "map scale", "source", "significance"]
  }
];

function vocabularyFor(subjectKey: SubjectKey, topic: string, lesson?: LegacyLesson) {
  const lowerTopic = topic.toLowerCase();
  const lessonText = normalizePlainText([
    topic,
    lesson?.title,
    lesson?.conceptExplanation,
    lesson?.guidedExample,
    ...(lesson?.learningObjectives ?? []),
    ...(lesson?.practiceQuestions ?? [])
  ].filter(Boolean).join(" "), 5000);
  const dictionaryMatch = topicVocabulary.find((entry) => entry.pattern.test(`${lowerTopic} ${lessonText}`));
  if (dictionaryMatch) {
    return dictionaryMatch.terms.slice(0, 8);
  }
  if (subjectKey === "ela") {
    return ["main idea", "evidence", "inference", "claim", "context", "structure", "summary", "revision"];
  }
  if (subjectKey === "coding") {
    return ["input", "process", "output", "algorithm", "condition", "loop", "debug", "test case"];
  }
  if (subjectKey === "science") {
    return ["model", "system", "process", "evidence", "observation", "cause", "effect", "energy"];
  }
  if (subjectKey === "math") {
    return ["model", "operation", "variable", "relationship", "strategy", "estimate", "solution", "check"];
  }
  return ["main idea", "model", "example", "evidence", "practice", "strategy", "check", "next step"];
}

function subjectVisualSlides(subjectKey: SubjectKey, topic: string): LessonPlanSlide[] {
  const lowerTopic = topic.toLowerCase();
  if (subjectKey === "science" && lowerTopic.includes("digest")) {
    return [
      makeSlide(
        "digestive-map",
        "labeled_diagram",
        "Digestive System Map",
        4,
        {
          bullets: [
            "Food travels through the mouth, esophagus, stomach, small intestine, and large intestine.",
            "The liver and pancreas help by adding chemicals, but food does not pass through them.",
            "Most nutrient absorption happens in the small intestine."
          ],
          keyIdea: "Follow the path of food and separate main organs from helper organs."
        },
        [
          {
            accessibilityLabel: "Labeled digestive system path from mouth to large intestine with liver and pancreas shown as helper organs.",
            caption: "Trace food from entry to exit.",
            id: "digestive-system-labeled-path",
            labels: ["Mouth", "Esophagus", "Stomach", "Small intestine", "Large intestine", "Liver", "Pancreas"],
            title: "Digestive system path",
            type: "labeled_system"
          }
        ]
      ),
      makeSlide(
        "digestive-process",
        "process",
        "How Food Becomes Nutrients",
        4,
        {
          bullets: [
            "Break food into smaller pieces.",
            "Use acid, bile, and enzymes to break molecules down.",
            "Absorb nutrients through the small intestine into the blood.",
            "Remove waste through the large intestine."
          ],
          keyIdea: "Digestion is a process: break down, absorb, and remove."
        },
        [
          {
            accessibilityLabel: "Four step process sequence for digestion.",
            caption: "Break down to absorb.",
            id: "digestive-process-sequence",
            steps: ["Break food", "Chemical digestion", "Absorb nutrients", "Remove waste"],
            type: "process_sequence"
          }
        ]
      ),
      makeSlide(
        "mechanical-chemical",
        "comparison",
        "Mechanical vs Chemical Digestion",
        4,
        {
          keyIdea: "Mechanical digestion changes size. Chemical digestion changes molecules.",
          bullets: ["Mechanical: chewing and stomach mixing.", "Chemical: enzymes, acid, and bile."]
        },
        [
          {
            accessibilityLabel: "Comparison table between mechanical digestion and chemical digestion.",
            columns: [
              { items: ["Chewing", "Stomach mixing", "Smaller pieces"], title: "Mechanical" },
              { items: ["Acid", "Enzymes", "Nutrients released"], title: "Chemical" }
            ],
            id: "mechanical-chemical-comparison",
            title: "Two types of digestion",
            type: "comparison_table"
          }
        ]
      ),
      makeSlide(
        "villi-structure",
        "concept",
        "Why The Small Intestine Has Villi",
        4,
        {
          keyIdea: "Villi increase surface area, so more nutrients can be absorbed efficiently.",
          bullets: ["Many folds create more contact area.", "Nutrients move into blood vessels.", "Structure supports the function."]
        },
        [
          {
            accessibilityLabel: "Structure function model showing villi increasing surface area for absorption.",
            columns: [
              { items: ["Finger-like folds", "Lots of surface area"], title: "Structure" },
              { items: ["Absorb nutrients", "Move nutrients to blood"], title: "Function" }
            ],
            id: "villi-structure-function",
            title: "Structure supports function",
            type: "structure_function"
          }
        ]
      )
    ];
  }

  if (subjectKey === "science" && /\b(electric|circuit|current|voltage|charge|resistance)\b/.test(lowerTopic)) {
    return [
      makeSlide(
        "electric-circuit-map",
        "labeled_diagram",
        "Simple Circuit Map",
        4,
        {
          bullets: [
            "A complete circuit is a closed path for electric charge.",
            "A battery supplies the push that moves charge around the circuit.",
            "A bulb or motor changes electrical energy into light, motion, heat, or sound."
          ],
          keyIdea: "Electricity needs a complete path and an energy source."
        },
        [
          {
            accessibilityLabel: "Simple circuit with battery, wires, switch, and bulb labeled.",
            caption: "Closed path means current can flow.",
            id: "simple-circuit-labeled",
            labels: ["Battery", "Wire", "Switch", "Bulb", "Closed path"],
            title: "Simple circuit",
            type: "labeled_system"
          }
        ]
      ),
      makeSlide(
        "charge-flow",
        "process",
        "How Current Flows",
        4,
        {
          bullets: [
            "Charges are already present in the wires.",
            "The battery creates an electric push across the circuit.",
            "When the path is closed, charges drift and transfer energy to devices."
          ],
          keyIdea: "Current is the rate of charge flow, not a substance used up by the bulb."
        },
        [
          {
            accessibilityLabel: "Process showing battery push, closed path, charge flow, and energy transfer.",
            caption: "Push to flow to energy transfer.",
            id: "current-flow-process",
            steps: ["Battery push", "Closed path", "Charge flow", "Energy transfer"],
            type: "process_sequence"
          }
        ]
      ),
      makeSlide(
        "voltage-current-resistance",
        "comparison",
        "Voltage, Current, Resistance",
        4,
        {
          keyIdea: "Voltage pushes, current flows, and resistance opposes the flow.",
          bullets: ["Higher voltage can push more current.", "Higher resistance makes current smaller.", "Devices use resistance to change electrical energy."]
        },
        [
          {
            accessibilityLabel: "Comparison table for voltage, current, and resistance.",
            columns: [
              { items: ["Electric push", "Measured in volts"], title: "Voltage" },
              { items: ["Charge flow rate", "Measured in amps"], title: "Current" },
              { items: ["Opposes flow", "Measured in ohms"], title: "Resistance" }
            ],
            id: "vcr-comparison",
            title: "Three circuit ideas",
            type: "comparison_table"
          }
        ]
      ),
      makeSlide(
        "conductors-insulators",
        "comparison",
        "Conductors and Insulators",
        4,
        {
          keyIdea: "Conductors let charge move easily. Insulators slow charge movement.",
          bullets: ["Metals are usually good conductors.", "Plastic and rubber are common insulators.", "Wires often have metal inside and plastic outside."]
        },
        [
          {
            accessibilityLabel: "Comparison table between conductors and insulators.",
            columns: [
              { items: ["Copper", "Aluminum", "Metal wire"], title: "Conductors" },
              { items: ["Plastic", "Rubber", "Dry wood"], title: "Insulators" }
            ],
            id: "conductors-insulators-table",
            title: "Materials and charge flow",
            type: "comparison_table"
          }
        ]
      )
    ];
  }

  if (subjectKey === "math" && (lowerTopic.includes("ratio") || lowerTopic.includes("proportion"))) {
    return [
      makeSlide(
        "ratio-table",
        "data_display",
        "Ratio Table Pattern",
        4,
        {
          keyIdea: "Equivalent ratios multiply both quantities by the same scale factor.",
          bullets: ["Look across a row for the same multiplier.", "Look down a column to compare pairs."]
        },
        [
          {
            accessibilityLabel: "Ratio table showing flour and sugar quantities scaling by the same factor.",
            id: "ratio-table-model",
            rows: [
              ["Flour", "2", "4", "6", "8"],
              ["Sugar", "3", "6", "9", "12"]
            ],
            tableHeaders: ["Quantity", "x1", "x2", "x3", "x4"],
            title: "Equivalent ratios",
            type: "ratio_table"
          }
        ]
      ),
      makeSlide(
        "double-number-line",
        "data_display",
        "Double Number Line",
        4,
        {
          keyIdea: "A double number line lines up matching values from two quantities.",
          bullets: ["Use it when two quantities grow together.", "Matching tick marks show equivalent ratios."]
        },
        [
          {
            accessibilityLabel: "Double number line showing 2,4,6,8 lined up with 3,6,9,12.",
            id: "double-number-line-model",
            rows: [
              ["Flour", "0", "2", "4", "6", "8"],
              ["Sugar", "0", "3", "6", "9", "12"]
            ],
            type: "double_number_line"
          }
        ]
      ),
      makeSlide(
        "proportion-equation",
        "worked_example",
        "Set Up A Proportion",
        4,
        {
          keyIdea: "Use equivalent fractions to find an unknown value.",
          steps: ["Write the known ratio.", "Match the unknown value in the same position.", "Solve and check the scale factor."]
        },
        [
          {
            accessibilityLabel: "Equation steps solving two thirds equals x over nine.",
            equation: "2/3 = x/9, so x = 6",
            id: "proportion-equation-steps",
            steps: ["2/3 = x/9", "x = 9 x 2/3", "x = 6"],
            type: "equation_steps"
          }
        ]
      ),
      makeSlide(
        "coordinate-ratio",
        "data_display",
        "Proportions On A Graph",
        4,
        {
          keyIdea: "A proportional relationship makes a straight line through the origin.",
          bullets: ["Each point keeps the same ratio.", "The unit rate is the steepness of the line."]
        },
        [
          {
            accessibilityLabel: "Coordinate graph with points on a straight line through the origin.",
            id: "ratio-coordinate-graph",
            points: [
              { x: 0, y: 0 },
              { x: 1, y: 2 },
              { x: 2, y: 4 },
              { x: 3, y: 6 },
              { x: 4, y: 8 }
            ],
            type: "coordinate_graph"
          }
        ]
      )
    ];
  }

  return [
    makeSlide(
      "visual-model",
      "concept",
      "Visual Model",
      4,
      {
        keyIdea: `Use a visual model to connect the definition of ${topic} to examples.`
      },
      [
        {
          accessibilityLabel: `Concept map for ${topic}.`,
          id: "concept-map",
          labels: ["Notice", "Explain", "Practice", "Check"],
          type: "concept_map"
        }
      ]
    )
  ];
}

export function legacyLessonToSlidePlan({
  context,
  lesson
}: {
  context?: LegacyContext;
  lesson?: LegacyLesson;
}): LessonSlidePlan {
  const topic = normalizePlainText(context?.topic || lesson?.title || "the topic", 100);
  const subject = normalizePlainText(context?.subject || "Math", 80);
  const subjectKey = detectSubjectKey(subject, topic);
  const grade = normalizePlainText(context?.grade || "Student", 40);
  const title = normalizePlainText(lesson?.title || topic, 120);
  const durationMinutes = durationToMinutes(lesson?.duration);
  const objectives = (lesson?.learningObjectives ?? []).map((item) => stripDuplicateNumbering(item)).filter(Boolean).slice(0, 4);
  const vocabulary = vocabularyFor(subjectKey, topic, lesson);
  const slides: LessonPlanSlide[] = [
    makeSlide("title", "title", `Learn ${topic}`, 2, {
      bullets: objectives,
      keyIdea: normalizePlainText(lesson?.studentFit || `A clear NovaSprout lesson on ${topic}.`, 240)
    }, [
      {
        accessibilityLabel: "Roadmap with see, explain, practice, and check stages.",
        id: "lesson-roadmap",
        labels: ["See", "Explain", "Practice", "Check"],
        type: "icon_grid"
      }
    ]),
    makeSlide("big-idea", "big_idea", "Big Idea", 3, {
      bullets: objectives.length ? objectives : [`Understand the main idea of ${topic}.`, "Use one visual model.", "Practice and check your answer."],
      keyIdea: normalizePlainText(lesson?.conceptExplanation, 220) || `This lesson helps you understand ${topic} with examples and practice.`
    }, [
      {
        accessibilityLabel: "Core lesson ideas connected to examples and practice.",
        id: "big-idea-map",
        labels: ["Idea", "Visual", "Example", "Practice"],
        type: "concept_map"
      }
    ]),
    makeSlide("vocabulary", "vocabulary", "Key Words To Know", 3, {
      bullets: vocabulary,
      keyIdea: "These words unlock the lesson."
    }, [
      {
        accessibilityLabel: "Key vocabulary cards.",
        id: "vocabulary-cards",
        labels: vocabulary.slice(0, 6),
        type: "labeled_cards"
      }
    ])
  ];

  if (lesson?.prerequisiteCheck?.length) {
    slides.push(
      makeSlide("prior-knowledge", "prior_knowledge", "Before We Start", 3, {
        bullets: lesson.prerequisiteCheck.map((item) => stripDuplicateNumbering(item)).filter(Boolean).slice(0, 4),
        keyIdea: "Check the foundations first."
      })
    );
  }

  if (lesson?.warmUp) {
    slides.push(
      makeSlide("warm-up", "warm_up", "Warm-up", 4, {
        question: normalizePlainText(lesson.warmUp, 360),
        hint: "Try one small step first, then explain your thinking."
      }, [
        {
          accessibilityLabel: "Warm-up prompt card.",
          id: "warm-up-card",
          labels: ["Think", "Try", "Explain"],
          type: "callout"
        }
      ])
    );
  }

  chunkText(removeTutorInstructionLanguage(lesson?.conceptExplanation, 3200), 220, 7).forEach((chunk, index) => {
    slides.push(
      makeSlide(`concept-${index + 1}`, "concept", `Key Idea ${index + 1}`, 4, {
        explanation: chunk,
        keyIdea: index === 0 ? "Understand the idea before memorizing details." : undefined
      }, [
        {
          accessibilityLabel: "Concept card that connects the idea to a simple example.",
          id: `concept-card-${index + 1}`,
          labels: ["Meaning", "Model", "Use"],
          type: "concept_map"
        }
      ], "medium")
    );
  });

  slides.push(...subjectVisualSlides(subjectKey, topic));

  chunkText(removeTutorInstructionLanguage(lesson?.guidedExample, 3200), 220, 6).forEach((chunk, index) => {
    const exampleSteps = chunk.split(/(?:Step\s*\d+:|;\s*)/i).map((item) => normalizePlainText(item, 120)).filter(Boolean).slice(0, 4);
    const exampleVisual: VisualSpec = subjectKey === "math"
      ? {
          accessibilityLabel: "Worked example steps.",
          id: `worked-example-steps-${index + 1}`,
          steps: exampleSteps,
          type: "equation_steps"
        }
      : {
          accessibilityLabel: "Worked example learning steps.",
          id: `worked-example-process-${index + 1}`,
          steps: exampleSteps.length > 1 ? exampleSteps : ["Notice the situation", "Apply the idea", "Check the result"],
          type: "process_sequence"
        };
    slides.push(
      makeSlide(`worked-example-${index + 1}`, "worked_example", subjectKey === "math" ? slideTitle("Example", chunk, `Worked Example ${index + 1}`) : `Worked Example ${index + 1}`, 4, {
        explanation: chunk,
        steps: exampleSteps
      }, [exampleVisual], "medium")
    );
  });

  (lesson?.fullLessonSegments ?? []).slice(0, 5).forEach((segment, index) => {
    const activity = removeTutorInstructionLanguage(segment.activity, 360);
    if (!activity) {
      return;
    }
    const segmentTitle = normalizePlainText(segment.title, 80) || `Content ${index + 1}`;
    slides.push(
      makeSlide(`content-${index + 1}`, looksLikeTutorProcedure(segment.activity) ? "concept" : "guided_practice", segmentTitle, 4, {
        explanation: activity,
        keyIdea: segmentTitle
      }, [
        {
          accessibilityLabel: `Student-facing content card for ${segmentTitle}.`,
          id: `content-card-${index + 1}`,
          labels: ["Read", "Notice", "Try"],
          type: "callout"
        }
      ])
    );
  });

  (lesson?.practiceQuestions ?? []).map(splitQuestionParts).filter((item) => item.question).slice(0, 6).forEach((item, index) => {
    slides.push(
      makeSlide(`practice-${index + 1}`, "independent_practice", `Practice ${index + 1}`, 3, {
        answer: item.answer || item.why,
        hint: item.hint || "Use the model from the previous slide.",
        question: item.question
      })
    );
  });

  slides.push(
    makeSlide("common-mistake", "misconception", "Common Mistake To Avoid", 3, {
      bullets:
        subjectKey === "science" && topic.toLowerCase().includes("digest")
          ? ["Do not confuse where food travels with helper organs that add chemicals.", "Food does not pass through the liver or pancreas."]
          : subjectKey === "math"
            ? ["Do not multiply only one quantity in a ratio.", "Equivalent ratios need the same scale factor on both quantities."]
            : ["Check the exact question before answering.", "Use evidence or steps, not only a guess."],
      keyIdea: "Mistakes become easier to catch when you know what to look for."
    })
  );

  (lesson?.quickAssessment ?? []).map(splitQuestionParts).filter((item) => item.question).slice(0, 4).forEach((item, index) => {
    slides.push(
      makeSlide(`check-${index + 1}`, "answer_explanation", index === 0 ? "Show What You Know" : `Check ${index + 1}`, 2, {
        answer: item.answer || item.why,
        hint: item.hint,
        question: item.question
      })
    );
  });

  slides.push(
    makeSlide("summary", "summary", "Quick Review", 3, {
      bullets: objectives.length ? objectives : ["Restate the big idea.", "Solve one example.", "Explain one common mistake."],
      keyIdea: "A strong finish means you can explain the idea in your own words."
    }, [
      {
        accessibilityLabel: "Summary checklist.",
        id: "summary-checklist",
        labels: ["Idea", "Example", "Practice", "Next"],
        type: "icon_grid"
      }
    ])
  );

  if (lesson?.recommendedNextSession) {
    slides.push(
      makeSlide("next-session", "exit_ticket", "Recommended Next Session", 2, {
        keyIdea: normalizePlainText(lesson.recommendedNextSession, 300),
        question: "What should we practice next?"
      })
    );
  }

  return validateAndRepairSlidePlan({
    context: { grade, subject, subjectKey, topic },
    durationMinutes,
    schemaVersion: lessonSlidePlanSchemaVersion,
    slides,
    title,
    validationWarnings: []
  });
}

export function validateAndRepairSlidePlan(plan: LessonSlidePlan): LessonSlidePlan {
  const warnings: string[] = [...plan.validationWarnings];
  const seenIds = new Set<string>();
  const slides = plan.slides.map((slide, index) => {
    let id = normalizePlainText(slide.id, 50).toLowerCase().replace(/[^a-z0-9-]/g, "-") || `slide-${index + 1}`;
    if (seenIds.has(id)) {
      id = `${id}-${index + 1}`;
      warnings.push(`Duplicate slide id repaired at slide ${index + 1}.`);
    }
    seenIds.add(id);

    const cleanTitle = normalizePlainText(slide.title, 90)
      .replace(/\bTutor-guided\b/gi, "Guided")
      .replace(/\bTeacher\b/gi, "Lesson");
    const repairedTitle = cleanTitle.length > 72 ? `${cleanTitle.slice(0, 69).trim()}...` : cleanTitle;
    if (repairedTitle !== cleanTitle) {
      warnings.push(`Long title shortened at slide ${index + 1}.`);
    }

    const visuals = slide.visuals.map((visual, visualIndex) => ({
      ...visual,
      accessibilityLabel: normalizePlainText(visual.accessibilityLabel || visual.title || repairedTitle, 240),
      id: normalizePlainText(visual.id, 50).toLowerCase().replace(/[^a-z0-9-]/g, "-") || `${id}-visual-${visualIndex + 1}`
    }));

    return {
      ...slide,
      accessibilityLabel: normalizePlainText(slide.accessibilityLabel || repairedTitle, 300),
      estimatedMinutes: Math.max(1, Math.min(12, Math.round(slide.estimatedMinutes || 3))),
      id,
      studentContent: {
        ...slide.studentContent,
        answer: normalizePlainText(slide.studentContent.answer, 300),
        bullets: slide.studentContent.bullets?.map(stripDuplicateNumbering).filter(Boolean).slice(0, 6),
        examples: slide.studentContent.examples?.map(stripDuplicateNumbering).filter(Boolean).slice(0, 4),
        explanation: normalizePlainText(slide.studentContent.explanation, 500),
        hint: normalizePlainText(slide.studentContent.hint, 260),
        keyIdea: normalizePlainText(slide.studentContent.keyIdea, 260),
        question: stripDuplicateNumbering(slide.studentContent.question),
        steps: slide.studentContent.steps?.map(stripDuplicateNumbering).filter(Boolean).slice(0, 5)
      },
      title: repairedTitle,
      visuals
    };
  });

  return {
    ...plan,
    durationMinutes: Math.max(20, Math.min(90, plan.durationMinutes || 45)),
    slides: slides.slice(0, 28),
    title: normalizePlainText(plan.title, 120) || "NovaSprout Lesson",
    validationWarnings: warnings
  };
}

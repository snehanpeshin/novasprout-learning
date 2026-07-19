import { NextResponse } from "next/server";
import { aiAccessError, isAiAccessAllowed } from "../../lib/aiAccess";
import { extractAiLessonOutputText, parseAiLessonJson } from "../../lib/aiLessonResponse";

export const runtime = "nodejs";
export const maxDuration = 60;

const openAiStartTimeoutMs = Math.min(
  20000,
  Math.max(8000, Number(process.env.OPENAI_LESSON_START_TIMEOUT_MS ?? 12000))
);
const openAiLessonModel = process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";

type LessonRequest = {
  difficulty?: string;
  duration?: string;
  grade?: string;
  goal?: string;
  includeInLesson?: string[];
  language?: string;
  level?: string;
  mode?: string;
  studentQuestion?: string;
  subject?: string;
  teachingStyle?: string;
  topic?: string;
};

const allowedGrades = new Set([
  "Pre-K / Kindergarten",
  "Grades 1-2",
  "Grades 3-5",
  "Grades 6-8",
  "Grades 9-10",
  "Grades 11-12",
  "Preschool",
  "Pre-Kindergarten",
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "Teen / beginner",
  "College / adult"
]);

const allowedSubjects = new Set([
  "Mathematics",
  "Science",
  "English",
  "Social Studies",
  "Computer Science",
  "Environmental Studies",
  "Physics",
  "Chemistry",
  "Biology",
  "Geography",
  "History",
  "Civics",
  "Economics",
  "Business Studies",
  "Accounting",
  "Statistics",
  "Psychology",
  "Health Education",
  "Engineering",
  "Robotics",
  "Coding",
  "Test Preparation",
  "Languages"
]);

const allowedLevels = new Set(["Start from the basics", "Give me some support", "Teach at my grade level", "Challenge me", "Advanced challenge", "Not sure"]);

const allowedGoals = new Set([
  "Concept clarity",
  "Learn from the beginning",
  "Homework help",
  "Improve grades",
  "Prepare for a test",
  "Revise a chapter",
  "Solve practice questions",
  "Master a difficult topic",
  "Build confidence",
  "Prepare for competition",
  "Complete a school project",
  "Learn real-world applications"
]);

const allowedModes = new Set([
  "Quick explanation",
  "Comprehensive lesson",
  "Revision lesson",
  "Homework help",
  "Exam preparation",
  "Practice worksheet",
  "Interactive quiz",
  "Flashcards",
  "Study notes",
  "Project-based lesson",
  "Lab or activity lesson",
  "Presentation",
  "Printable PDF lesson",
  "Private guided lesson"
]);

const allowedDurations = new Set([
  "5-minute explanation",
  "10-minute quick lesson",
  "20-minute lesson",
  "30-minute lesson",
  "45-minute comprehensive lesson",
  "60-minute deep lesson",
  "Multi-session unit",
  "Custom duration"
]);

const allowedTeachingStyles = new Set(["Simple and friendly", "Step-by-step", "Visual", "Story-based", "Example-driven", "Interactive", "Exam-focused", "Project-based", "Socratic questioning"]);
const allowedDifficulties = new Set(["Easy", "Standard", "Challenging", "Mixed difficulty", "Adaptive"]);
const allowedLanguages = new Set(["English", "Hindi", "Spanish", "French", "German", "Bilingual", "Simplified English"]);
const allowedLessonIncludes = new Set([
  "Learning objectives",
  "Warm-up question",
  "Key vocabulary",
  "Concept explanation",
  "Diagrams",
  "Real-world examples",
  "Worked examples",
  "Practice questions",
  "Interactive quiz",
  "Homework",
  "Flashcards",
  "Summary notes",
  "Common mistakes",
  "Exit ticket",
  "Live tutor option"
]);

const lessonJsonSchema = {
  name: "novasprout_lesson",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      conceptExplanation: { type: "string" },
      customPlan: {
        type: "object",
        additionalProperties: false,
        properties: {
          focusAreas: { type: "array", items: { type: "string" } },
          recommendedCadence: { type: "string" },
          summary: { type: "string" },
          weeklyPlan: { type: "array", items: { type: "string" } }
        },
        required: ["focusAreas", "recommendedCadence", "summary", "weeklyPlan"]
      },
      duration: { type: "string" },
      fullLessonSegments: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            activity: { type: "string" },
            time: { type: "string" },
            title: { type: "string" }
          },
          required: ["activity", "time", "title"]
        }
      },
      guidedExample: { type: "string" },
      learningObjectives: { type: "array", items: { type: "string" } },
      mode: { type: "string" },
      parentTutorNotes: { type: "string" },
      practiceQuestions: { type: "array", items: { type: "string" } },
      prerequisiteCheck: { type: "array", items: { type: "string" } },
      quickAssessment: { type: "array", items: { type: "string" } },
      recommendedNextSession: { type: "string" },
      studentFit: { type: "string" },
      timedExam: {
        type: "object",
        additionalProperties: false,
        properties: {
          durationMinutes: { type: "number" },
          passingScore: { type: "number" },
          questions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                answerIndex: { type: "number" },
                explanation: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                question: { type: "string" }
              },
              required: ["answerIndex", "explanation", "options", "question"]
            }
          }
        },
        required: ["durationMinutes", "passingScore", "questions"]
      },
      title: { type: "string" },
      warmUp: { type: "string" }
    },
    required: [
      "conceptExplanation",
      "customPlan",
      "duration",
      "fullLessonSegments",
      "guidedExample",
      "learningObjectives",
      "mode",
      "parentTutorNotes",
      "practiceQuestions",
      "prerequisiteCheck",
      "quickAssessment",
      "recommendedNextSession",
      "studentFit",
      "timedExam",
      "title",
      "warmUp"
    ]
  },
  strict: true
};

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function fallbackLesson({
  duration,
  goal,
  grade,
  level,
  mode,
  studentQuestion,
  subject,
  topic
}: {
  duration: string;
  goal: string;
  grade: string;
  level: string;
  mode: string;
  studentQuestion: string;
  subject: string;
  topic: string;
}) {
  const durationMinutes = Number(duration.match(/\d+/)?.[0] ?? 45);
  const studentFit = `For a ${grade} student studying ${subject.toLowerCase()} who is ${level.toLowerCase()} and wants help with ${topic.toLowerCase()} for ${goal.toLowerCase()}.`;
  const lowerTopic = topic.toLowerCase();
  const isDigestiveSystem = lowerTopic.includes("digest");
  const isElectricity = /\b(electric|electricity|circuit|current|voltage|charge|resistance)\b/.test(lowerTopic);

  if (isElectricity) {
    return {
      conceptExplanation:
        "Electricity is the movement and transfer of energy through electric charges. In a wire, tiny charged particles are already present. A battery does not create the charges; it provides an electric push called voltage. When the circuit is closed, charges drift through the wire and transfer energy to devices such as bulbs, motors, buzzers, and heaters. Current means how much charge flows each second. Resistance means how strongly a material or device opposes that flow. A complete circuit needs an energy source, conducting path, and device. If the path is broken, current stops. Conductors such as copper let charge move easily. Insulators such as plastic and rubber slow charge movement and help keep circuits safer.",
      customPlan: {
        focusAreas: ["Complete circuits", "Current, voltage, and resistance", "Conductors, insulators, and safety"],
        recommendedCadence: "Start with one visual circuit lesson, then practice circuit predictions, vocabulary, and simple troubleshooting.",
        summary: "A Grade 7 electricity lesson focused on understanding charge flow, complete circuits, and how electrical energy is transferred.",
        weeklyPlan: [
          "Session 1: label a simple circuit and explain why a bulb lights only when the path is closed.",
          "Session 2: compare voltage, current, and resistance using circuit examples.",
          "Session 3: solve circuit prediction questions and identify common misconceptions."
        ]
      },
      duration,
      fullLessonSegments: [
        {
          activity: "Electricity starts with electric charge. Charges can transfer energy when they move through a closed conducting path. A circuit is complete only when there is no break in the path from one side of the battery, through the device, and back to the other side.",
          time: "0-10 min",
          title: "Charge and Circuits"
        },
        {
          activity: "A battery supplies voltage, which is the electric push across the circuit. Current is the rate of charge flow. Resistance is opposition to current. A helpful model is water in pipes: voltage is like pressure, current is like flow rate, and resistance is like a narrow pipe.",
          time: "10-22 min",
          title: "Voltage Current Resistance"
        },
        {
          activity: "A bulb lights because electrical energy is transferred in the bulb's filament or LED. The charges are not used up. Energy is transferred to light and heat, while charges continue moving around the closed circuit.",
          time: "22-34 min",
          title: "Energy Transfer"
        },
        {
          activity: "Conductors let charges move easily, so copper and aluminum are used inside wires. Insulators slow charge movement, so plastic or rubber covers wires. The metal inside carries current; the outer plastic helps prevent unwanted contact.",
          time: "34-42 min",
          title: "Materials and Safety"
        },
        {
          activity: "Common mistakes: thinking electricity is used up by a bulb, thinking a battery sends current from only one side, or thinking a circuit can work with a gap. A working circuit needs a complete loop.",
          time: `42-${durationMinutes} min`,
          title: "Misconceptions"
        }
      ],
      guidedExample:
        "Example: A bulb, battery, switch, and wires are connected in a loop. Step 1: Check whether the path is complete from one battery terminal to the other. Step 2: If the switch is open, there is a gap, so no current flows and the bulb stays off. Step 3: If the switch is closed, current flows through the bulb. Step 4: The bulb changes electrical energy into light and heat. Final check: the charges are not used up; energy is transferred.",
      learningObjectives: [
        "Explain why a complete circuit is needed for current to flow.",
        "Compare voltage, current, and resistance in simple words.",
        "Identify conductors, insulators, and common circuit misconceptions."
      ],
      mode,
      parentTutorNotes: `Fallback electricity lesson generated because live AI was unavailable. Student note: ${studentQuestion || "No extra student question provided."}`,
      practiceQuestions: [
        "Try: A bulb is connected to a battery with one loose wire. Will it light? Hint: Look for a complete path. Answer: no. Why: a gap stops current.",
        "Try: What does a battery provide in a circuit? Hint: It creates the push. Answer: voltage. Why: voltage pushes charges around a closed circuit.",
        "Try: Is current used up by a bulb? Hint: Think about energy versus charge. Answer: no. Why: energy is transferred in the bulb, but charge continues around the circuit.",
        "Try: Why is copper used inside many wires? Hint: Think about conductors. Answer: copper lets charge move easily. Why: it has low resistance compared with many materials.",
        "Try: Why is plastic used outside wires? Hint: Think about insulators. Answer: plastic slows charge movement. Why: it helps prevent unwanted current paths and contact."
      ],
      prerequisiteCheck: [
        "Can you name one object that uses electrical energy?",
        "What do you think happens when a switch opens a circuit?"
      ],
      quickAssessment: [
        "Question: What three things does a simple working circuit need? Answer: an energy source, a conducting path, and a device.",
        "Question: What is current? Answer: the rate of electric charge flow.",
        "Question: What is resistance? Answer: opposition to the flow of current.",
        "Question: Why does an open switch stop a bulb from lighting? Answer: it breaks the circuit path."
      ],
      recommendedNextSession:
        "Request a live tutor if circuit diagrams, voltage-current-resistance relationships, or series and parallel predictions still feel confusing. Share quiz results and which circuit questions were missed.",
      studentFit,
      timedExam: {
        durationMinutes: Math.min(20, Math.max(10, Math.round(durationMinutes / 3))),
        passingScore: 70,
        questions: [
          {
            answerIndex: 1,
            explanation: "A closed circuit has a complete conducting path, so current can flow.",
            options: ["The bulb is large", "The path is complete", "The wire is colored", "The switch is missing"],
            question: "Why does current flow in a closed circuit?"
          },
          {
            answerIndex: 0,
            explanation: "Voltage is the electric push supplied by a battery or power source.",
            options: ["Voltage", "Resistance", "Insulation", "Friction"],
            question: "What does a battery mainly provide to a circuit?"
          },
          {
            answerIndex: 2,
            explanation: "Current is the rate at which electric charge flows.",
            options: ["Stored light", "Broken wire", "Charge flow rate", "Plastic covering"],
            question: "What is current?"
          },
          {
            answerIndex: 3,
            explanation: "Resistance opposes current, so higher resistance usually means less current for the same voltage.",
            options: ["It creates more batteries", "It removes charge", "It makes wires invisible", "It opposes current"],
            question: "What does resistance do?"
          },
          {
            answerIndex: 0,
            explanation: "Copper is a conductor, which means charge can move through it easily.",
            options: ["Copper wire", "Plastic ruler", "Rubber band", "Dry wood"],
            question: "Which material is usually a good conductor?"
          },
          {
            answerIndex: 1,
            explanation: "A bulb transfers electrical energy to light and heat; charge is not used up.",
            options: ["Current disappears forever", "Energy changes to light and heat", "The wire becomes plastic", "The battery creates new atoms"],
            question: "What happens in a glowing bulb?"
          }
        ]
      },
      title: `${topic} ${mode}`,
      warmUp: "Look around and name three devices that use electrical energy. For one device, write what energy output you notice: light, heat, sound, or motion."
    };
  }

  if (isDigestiveSystem) {
    return {
      conceptExplanation:
        "The digestive system changes food into nutrients the body can use. Food follows one main path: mouth to esophagus to stomach to small intestine to large intestine. Mechanical digestion breaks food into smaller pieces. Chemical digestion uses acid, bile, and enzymes to break large food molecules into smaller nutrients. The small intestine absorbs most nutrients into the blood, while the large intestine absorbs water and prepares waste for removal.",
      customPlan: {
        focusAreas: ["Organ order and function", "Mechanical vs chemical digestion", "Absorption in the small intestine"],
        recommendedCadence: "Start with one diagram-based lesson, then practice organ-function questions and short explanations.",
        summary: "A Grade 7 digestive-system lesson focused on understanding the path of food and how nutrients are absorbed.",
        weeklyPlan: [
          "Session 1: label the digestive organs and trace a meal through the system.",
          "Session 2: compare mechanical and chemical digestion using examples.",
          "Session 3: practice exam-style questions on enzymes, bile, villi, and absorption."
        ]
      },
      duration,
      fullLessonSegments: [
        {
          activity: "Trace the path of food through the main digestive organs and identify what each organ does.",
          time: "0-10 min",
          title: "Food Path"
        },
        {
          activity: "Compare mechanical digestion with chemical digestion using chewing, stomach churning, acid, bile, and enzymes.",
          time: "10-22 min",
          title: "Two Types of Digestion"
        },
        {
          activity: "Follow a sandwich through the system and explain where starch, protein, fat, and nutrients are handled.",
          time: "22-38 min",
          title: "Worked Example"
        },
        {
          activity: "Answer short practice questions about organ order, absorption, and common misconceptions.",
          time: `38-${durationMinutes} min`,
          title: "Practice and Check"
        }
      ],
      guidedExample:
        "Example: Follow a sandwich through digestion. Step 1: In the mouth, teeth break the food apart and saliva begins starch digestion. Step 2: The esophagus moves the swallowed food by peristalsis. Step 3: The stomach churns food and acid helps start protein digestion. Step 4: In the small intestine, enzymes finish digestion and villi absorb nutrients into the blood. Step 5: The large intestine absorbs water and forms waste. Final check: most nutrient absorption happens in the small intestine.",
      learningObjectives: [
        "Put the main digestive organs in the correct order.",
        "Explain the difference between mechanical and chemical digestion.",
        "Describe why villi help the small intestine absorb nutrients."
      ],
      mode,
      parentTutorNotes: `Fallback science lesson generated because live AI was unavailable. Student note: ${studentQuestion || "No extra student question provided."}`,
      practiceQuestions: [
        "Try: Put these in order: stomach, mouth, small intestine, esophagus. Hint: Start where food enters. Answer: mouth to esophagus to stomach to small intestine. Why: food travels through the digestive tract in order.",
        "Try: Is chewing mechanical or chemical digestion? Hint: Ask whether food size or molecules change. Answer: mechanical digestion. Why: chewing physically breaks food into smaller pieces.",
        "Try: Where does most nutrient absorption happen? Hint: Think about villi. Answer: small intestine. Why: villi increase surface area so nutrients can move into the blood.",
        "Try: Does food pass through the liver or pancreas? Hint: They are helper organs. Answer: no. Why: they add chemicals to digestion, but food stays in the digestive tract."
      ],
      prerequisiteCheck: [
        "Can you name three organs in the digestive system?",
        "What does it mean for the body to absorb nutrients?"
      ],
      quickAssessment: [
        "Question: Name the organ where most nutrient absorption happens. Answer: small intestine.",
        "Question: Explain one difference between mechanical and chemical digestion. Answer: mechanical changes food size; chemical changes food molecules.",
        "Question: Why are villi useful? Answer: they increase surface area for absorption."
      ],
      recommendedNextSession:
        "Practice exam-style digestive-system questions using labeled diagrams, organ functions, enzymes, bile, and villi.",
      studentFit,
      timedExam: {
        durationMinutes: Math.min(20, Math.max(10, Math.round(durationMinutes / 3))),
        passingScore: 70,
        questions: [
          {
            answerIndex: 2,
            explanation: "Food enters through the mouth, then moves down the esophagus to the stomach.",
            options: ["Stomach", "Small intestine", "Mouth", "Large intestine"],
            question: "Where does food enter the digestive system?"
          },
          {
            answerIndex: 1,
            explanation: "Chewing physically breaks food into smaller pieces.",
            options: ["Chemical digestion", "Mechanical digestion", "Absorption", "Excretion"],
            question: "What type of digestion is chewing?"
          },
          {
            answerIndex: 2,
            explanation: "The small intestine absorbs most nutrients into the blood.",
            options: ["Mouth", "Stomach", "Small intestine", "Esophagus"],
            question: "Where does most nutrient absorption happen?"
          },
          {
            answerIndex: 3,
            explanation: "Bile helps break fat into smaller droplets so enzymes can work better.",
            options: ["Protein", "Starch", "Water", "Fat"],
            question: "Bile mainly helps digest which nutrient group?"
          },
          {
            answerIndex: 0,
            explanation: "Villi increase surface area for absorption.",
            options: ["They increase surface area", "They chew food", "They make acid", "They store waste"],
            question: "Why are villi important?"
          },
          {
            answerIndex: 1,
            explanation: "Food does not pass through helper organs such as the liver or pancreas.",
            options: ["Food passes through the pancreas", "Food does not pass through the pancreas", "The pancreas stores waste", "The pancreas chews food"],
            question: "Which statement about the pancreas is correct?"
          }
        ]
      },
      title: `${topic} ${mode}`,
      warmUp: "Name three digestive organs and write one job for each. Then circle the organ where most nutrients are absorbed."
    };
  }

  const normalizedSubject = subject.toLowerCase();
  const subjectFamily = normalizedSubject.includes("math") || normalizedSubject.includes("statistics") || normalizedSubject.includes("accounting")
    ? "math"
    : normalizedSubject.includes("science") || normalizedSubject.includes("biology") || normalizedSubject.includes("chemistry") || normalizedSubject.includes("physics") || normalizedSubject.includes("health")
      ? "science"
      : normalizedSubject.includes("english") || normalizedSubject.includes("language")
        ? "english"
        : normalizedSubject.includes("history") || normalizedSubject.includes("geography") || normalizedSubject.includes("civics") || normalizedSubject.includes("economics") || normalizedSubject.includes("social") || normalizedSubject.includes("psychology")
          ? "social"
          : normalizedSubject.includes("computer") || normalizedSubject.includes("coding") || normalizedSubject.includes("robotics") || normalizedSubject.includes("engineering")
            ? "coding"
            : "general";
  const fallbackByFamily = {
    coding: {
      assessment: [
        `Question: What is the input in a ${topic} task? Answer: the information the program starts with.`,
        "Question: Why do we trace steps? Answer: to find what changes and where mistakes happen.",
        "Question: What is debugging? Answer: finding and fixing errors in logic or code."
      ],
      concept:
        `${topic} is best learned by thinking like a builder: identify the input, decide the process, check the output, and then improve the design. A program or technical system follows instructions in order, but real problem solving also requires testing. If the output is wrong, the goal is not to guess again; the goal is to trace the steps, find where the logic changed, and repair that part. Good coding and engineering lessons connect vocabulary, diagrams, examples, and small experiments.`,
      example:
        `Example: Build a simple ${topic} solution. Step 1: State the goal in one sentence. Step 2: List the inputs needed. Step 3: Write the process as ordered steps or pseudocode. Step 4: Predict the output before running or checking it. Step 5: Test with one normal case and one unusual case. Final check: if the output does not match the goal, trace the step where the logic first becomes wrong.`,
      focusAreas: [`Input-process-output model for ${topic}`, "Step tracing and debugging", "Testing with examples"],
      objectives: [`Describe ${topic} using input, process, and output.`, "Trace a worked example step by step.", "Find one likely error and explain how to fix it."],
      practice: [
        `Try: Write the input, process, and output for a simple ${topic} example. Hint: start with what the user or system knows. Answer: input is starting information, process is the steps, output is the result. Why: this structure makes the problem testable.`,
        "Try: A program gives the wrong answer. What should you do first? Hint: do not rewrite everything. Answer: trace the steps. Why: tracing finds the first point where the logic breaks.",
        `Try: Create one test case for ${topic}. Hint: use a normal example first. Answer: choose input with a known expected output. Why: known outputs make errors easier to spot.`
      ],
      prerequisite: ["Can you describe a set of instructions in order?", "Can you explain the difference between an input and an output?"],
      segments: [
        { activity: `${topic} starts with a clear goal. A strong technical solution says what information comes in, what steps happen, and what result should come out.`, time: "0-10 min", title: "Problem Model" },
        { activity: "Tracing means following each step carefully and watching how values or decisions change. It is one of the fastest ways to understand code and find mistakes.", time: "10-22 min", title: "Trace the Steps" },
        { activity: "Testing means trying examples to check whether the solution works. Good tests include normal cases, edge cases, and cases where mistakes are likely.", time: "22-38 min", title: "Test and Debug" },
        { activity: "A finished solution should be explainable in plain language. If you cannot explain why each step is there, the design may need simplification.", time: `38-${durationMinutes} min`, title: "Explain the Design" }
      ],
      title: "Build, test, and debug"
    },
    english: {
      assessment: [
        `Question: What is the main idea of a ${topic} passage or task? Answer: the central message or point.`,
        "Question: What makes evidence strong? Answer: it directly supports the answer or claim.",
        "Question: Why revise a response? Answer: to make meaning, structure, and evidence clearer."
      ],
      concept:
        `${topic} becomes stronger when reading and writing are treated as evidence-based thinking. First, identify the purpose: understand, explain, argue, describe, or analyze. Next, find the main idea and the details that support it. In writing, a strong answer usually has a clear claim, relevant evidence, and explanation that connects the evidence back to the point. In reading, strong comprehension comes from noticing word choice, structure, context, and what the author wants the reader to understand.`,
      example:
        `Example: Answer a ${topic} question. Step 1: Restate what the question is asking. Step 2: Find the main idea or claim. Step 3: Choose one piece of evidence that directly supports it. Step 4: Explain how the evidence proves the answer. Step 5: Check that the response answers the exact question. Final check: remove any sentence that does not support the main point.`,
      focusAreas: [`Main idea and purpose in ${topic}`, "Evidence and explanation", "Clear written response"],
      objectives: [`Identify the main idea or task in ${topic}.`, "Use evidence to support an answer.", "Write or revise a clear explanation."],
      practice: [
        `Try: Write one sentence explaining the main idea of ${topic}. Hint: ask what the whole passage or task is mostly about. Answer: a main idea should be broad but specific. Why: it guides the rest of the answer.`,
        "Try: Choose better evidence: a random detail or a sentence that proves your answer. Hint: evidence must connect directly. Answer: choose the sentence that proves your answer. Why: strong evidence makes the explanation convincing.",
        "Try: Improve this response by adding because. Hint: connect claim to evidence. Answer: add a reason that explains how the evidence supports the claim. Why: explanation is what turns evidence into reasoning."
      ],
      prerequisite: ["Can you tell the difference between a topic and a main idea?", "Can you point to a sentence that supports an answer?"],
      segments: [
        { activity: `${topic} starts with purpose. Decide whether the task asks you to understand, explain, argue, compare, or create.`, time: "0-10 min", title: "Purpose" },
        { activity: "A main idea is the central point. Details matter when they support that point, not when they are simply interesting.", time: "10-22 min", title: "Main Idea" },
        { activity: "Evidence should be specific and relevant. Explanation tells why the evidence matters and connects it to the answer.", time: "22-38 min", title: "Evidence" },
        { activity: "Revision checks clarity. A strong final answer is focused, supported, and easy to follow.", time: `38-${durationMinutes} min`, title: "Revision" }
      ],
      title: "Read, support, and explain"
    },
    general: {
      assessment: [
        `Question: What is the main idea of ${topic}? Answer: the central concept that explains the smaller details.`,
        "Question: Why use examples? Answer: examples show how the idea works in real situations.",
        "Question: What should you do if confused? Answer: identify the exact step or word that caused confusion."
      ],
      concept:
        `${topic} can be learned by separating the big idea from the details. The big idea explains what the topic is mostly about. Details show how it works, when it applies, and why it matters. A good lesson uses definitions, examples, visuals, practice, and checks. If a topic feels confusing, the best move is to find the exact word, step, or relationship that is unclear, then connect it to an example.`,
      example:
        `Example: Learn ${topic} with a three-part model. Step 1: Define the topic in one sentence. Step 2: Give one example and one non-example. Step 3: Explain the difference between them. Step 4: Try a practice question. Step 5: check whether your answer matches the definition. Final check: you should be able to explain ${topic} without copying notes.`,
      focusAreas: [`Core meaning of ${topic}`, "Examples and non-examples", "Practice and reflection"],
      objectives: [`Explain ${topic} in your own words.`, "Use an example to show how the idea works.", "Identify one next step for practice."],
      practice: [
        `Try: Write a one-sentence definition of ${topic}. Hint: start with "${topic} is...". Answer: a good definition names the category and the key feature. Why: definitions organize details.`,
        `Try: Give one example of ${topic}. Hint: choose something clear and familiar. Answer: the example should show the key feature. Why: examples make abstract ideas concrete.`,
        "Try: Write one question you still have. Hint: focus on a word, step, or relationship. Answer: a specific question is easier to solve. Why: vague confusion is harder to fix."
      ],
      prerequisite: [`What have you heard about ${topic} before?`, "Can you give one example related to this topic?"],
      segments: [
        { activity: `Start with the big idea of ${topic}. Separate what the topic means from extra details that can be added later.`, time: "0-10 min", title: "Big Idea" },
        { activity: "Use examples and non-examples to make the idea clearer. A non-example is useful because it shows what the topic is not.", time: "10-22 min", title: "Examples" },
        { activity: "Practice with one question at a time. After each answer, check which part of the definition or model was used.", time: "22-38 min", title: "Practice" },
        { activity: "Finish by naming the strongest understanding and the one part that needs more practice.", time: `38-${durationMinutes} min`, title: "Reflect" }
      ],
      title: "Understand, practice, check"
    },
    math: {
      assessment: [
        `Question: What should you identify first in a ${topic} problem? Answer: what is given and what is being asked.`,
        "Question: Why show steps? Answer: steps make errors easier to find and correct.",
        "Question: What makes an answer reasonable? Answer: it matches the question, units, and expected size."
      ],
      concept:
        `${topic} in mathematics is learned through meaning, representation, procedure, and checking. Meaning tells what the idea represents. A representation could be a diagram, table, number line, graph, equation, or words. A procedure is the step-by-step method used to solve. Checking asks whether the answer is reasonable and whether it answers the exact question. Strong math learning connects all four parts instead of memorizing steps alone.`,
      example:
        `Example: Solve a ${topic} problem. Step 1: Read the question and underline what is given. Step 2: Identify what must be found. Step 3: Choose a representation such as a table, diagram, equation, or graph. Step 4: Solve one step at a time and keep units or labels. Step 5: Substitute or estimate to check the answer. Final check: explain why the answer makes sense.`,
      focusAreas: [`Meaning and representation of ${topic}`, "Step-by-step solving", "Checking for reasonableness"],
      objectives: [`Explain what ${topic} means, not just the rule.`, "Solve a worked example with labeled steps.", "Check whether an answer is reasonable."],
      practice: [
        `Try: Write what is given and what is asked in a ${topic} problem. Hint: do not solve yet. Answer: list known values and the unknown. Why: setup prevents wrong operations.`,
        `Try: Choose a representation for ${topic}. Hint: table, diagram, equation, or graph. Answer: choose the model that shows the relationship most clearly. Why: models reduce confusion.`,
        "Try: Check an answer using estimation or substitution. Hint: ask whether the size makes sense. Answer: a reasonable answer fits the original question. Why: checking catches many errors."
      ],
      prerequisite: ["Can you identify known and unknown quantities in a word problem?", "Can you explain one math step in words?"],
      segments: [
        { activity: `${topic} starts with meaning. Before using a formula or rule, identify what the numbers, symbols, or shapes represent.`, time: "0-10 min", title: "Meaning" },
        { activity: "Represent the problem with a diagram, table, equation, graph, or number line. The representation should show the relationship clearly.", time: "10-22 min", title: "Model" },
        { activity: "Solve in small steps and label each step. Labels help connect the calculation back to the problem.", time: "22-38 min", title: "Solve" },
        { activity: "Check the answer by estimating, substituting, or explaining why it fits the question.", time: `38-${durationMinutes} min`, title: "Check" }
      ],
      title: "Model, solve, and check"
    },
    science: {
      assessment: [
        `Question: What should a science explanation of ${topic} include? Answer: a claim, evidence, and reasoning.`,
        "Question: Why are diagrams useful? Answer: they show parts, relationships, and processes that are hard to see in words only.",
        "Question: What is a common science habit? Answer: compare what you observe with the model or evidence."
      ],
      concept:
        `${topic} in science is best understood as a system, process, or relationship that can be modeled. A system has parts that interact. A process happens in a sequence. A relationship explains how one change affects another. Strong science learning uses vocabulary, diagrams, examples, evidence, and reasoning. Instead of memorizing isolated facts, connect each fact to what it does, what causes it, or how it can be observed.`,
      example:
        `Example: Explain ${topic} using claim, evidence, and reasoning. Step 1: Make a clear claim about what happens. Step 2: Name the evidence or observation that supports it. Step 3: Explain the science idea that connects the evidence to the claim. Step 4: Use a diagram or model to show the parts or sequence. Step 5: check for a common misconception. Final check: the explanation should answer both what happens and why.`,
      focusAreas: [`System or process model for ${topic}`, "Vocabulary and diagrams", "Claim, evidence, and reasoning"],
      objectives: [`Describe the main parts or steps in ${topic}.`, "Use a diagram or model to explain the idea.", "Answer a question with evidence and reasoning."],
      practice: [
        `Try: Is ${topic} best shown as parts, steps, or cause and effect? Hint: choose the model that fits the idea. Answer: use parts for systems, steps for processes, and arrows for cause and effect. Why: the model controls the explanation.`,
        `Try: Write one claim about ${topic}. Hint: make it a complete sentence. Answer: the claim should say what happens or what is true. Why: claims focus the explanation.`,
        "Try: Add evidence to your claim. Hint: use an observation, fact, or diagram label. Answer: evidence supports the claim. Why: science explanations need support."
      ],
      prerequisite: ["Can you describe the difference between an observation and an explanation?", `Can you name one part, step, or example related to ${topic}?`],
      segments: [
        { activity: `${topic} should be organized as a model. Decide whether it is mostly a system of parts, a sequence of steps, or a cause-and-effect relationship.`, time: "0-10 min", title: "Model the Idea" },
        { activity: "Vocabulary matters because science words often name parts, processes, or measurable quantities. Connect each word to what it does.", time: "10-22 min", title: "Key Words" },
        { activity: "Use a diagram to show relationships. Arrows can show movement, transfer, cause, sequence, or interaction.", time: "22-38 min", title: "Visual Explanation" },
        { activity: "Finish with claim, evidence, and reasoning. This turns facts into a complete science explanation.", time: `38-${durationMinutes} min`, title: "Explain with Evidence" }
      ],
      title: "Model, explain, and reason"
    },
    social: {
      assessment: [
        `Question: What should you identify first in ${topic}? Answer: who, where, when, what happened, and why it mattered.`,
        "Question: Why compare perspectives? Answer: people and groups may experience the same event differently.",
        "Question: What makes evidence useful? Answer: it supports a claim about cause, effect, change, or significance."
      ],
      concept:
        `${topic} in social studies is understood by asking context questions: who was involved, where it happened, when it happened, what changed, and why it mattered. Strong answers connect facts to causes, effects, perspectives, and evidence. A map, timeline, source, chart, or comparison table can make the topic clearer. Instead of memorizing facts alone, explain how the facts connect to people, places, choices, and consequences.`,
      example:
        `Example: Analyze ${topic}. Step 1: Identify the time and place. Step 2: Name the people, groups, or institutions involved. Step 3: Find one cause and one effect. Step 4: Consider at least one perspective. Step 5: Use evidence to support the explanation. Final check: the answer should explain why the topic matters, not only what happened.`,
      focusAreas: [`Context for ${topic}`, "Cause and effect", "Evidence and perspective"],
      objectives: [`Explain the context of ${topic}.`, "Connect causes and effects.", "Use evidence or perspective in an answer."],
      practice: [
        `Try: Write who, where, and when for ${topic}. Hint: context comes before explanation. Answer: identify people/groups, place, and time. Why: context prevents vague answers.`,
        "Try: Name one cause and one effect. Hint: cause comes before, effect comes after. Answer: connect them with because or therefore. Why: social studies explains change.",
        "Try: Add one perspective. Hint: ask who benefited, who was harmed, or who disagreed. Answer: perspectives show complexity. Why: events affect groups differently."
      ],
      prerequisite: ["Can you explain the difference between cause and effect?", "Can you use a fact as evidence for an answer?"],
      segments: [
        { activity: `${topic} starts with context: time, place, people, and setting. Without context, facts are harder to understand.`, time: "0-10 min", title: "Context" },
        { activity: "Cause and effect explain why events or ideas develop. Some topics have more than one cause and more than one effect.", time: "10-22 min", title: "Cause and Effect" },
        { activity: "Perspective asks how different people or groups saw the issue. Evidence supports which interpretation is strongest.", time: "22-38 min", title: "Perspective" },
        { activity: "A strong answer explains significance: why the topic mattered then and why it may still matter now.", time: `38-${durationMinutes} min`, title: "Significance" }
      ],
      title: "Context, cause, and evidence"
    }
  } as const;
  const fallback = fallbackByFamily[subjectFamily as keyof typeof fallbackByFamily];

  return {
    conceptExplanation: fallback.concept,
    customPlan: {
      focusAreas: [...fallback.focusAreas],
      recommendedCadence: "Use the AI lesson deck, practice, and quiz for independent study. Live tutoring can be booked separately for direct human instruction.",
      summary: `A student-facing ${subject.toLowerCase()} lesson for ${topic} based on the selected grade, level, and goal.`,
      weeklyPlan: [
        `Lesson 1: study the core model for ${topic} and complete the guided example.`,
        "Lesson 2: practice mixed questions and review mistakes.",
        "Lesson 3: use quiz results to decide whether a live tutor request is needed."
      ]
    },
    duration,
    fullLessonSegments: [...fallback.segments],
    guidedExample: fallback.example,
    learningObjectives: [...fallback.objectives],
    mode,
    parentTutorNotes: `Fallback ${subject.toLowerCase()} lesson generated without live AI because the AI service was unavailable. Student note: ${studentQuestion || "No extra student question provided."}`,
    practiceQuestions: [...fallback.practice],
    prerequisiteCheck: [...fallback.prerequisite],
    quickAssessment: [...fallback.assessment],
    recommendedNextSession: `Use quiz results to identify the weakest part of ${topic}. Request a live tutor if the student misses questions about ${fallback.focusAreas[0].toLowerCase()} or cannot explain the guided example independently.`,
    studentFit,
    timedExam: {
      durationMinutes: Math.min(20, Math.max(10, Math.round(durationMinutes / 3))),
      passingScore: 70,
      questions: [
        {
          answerIndex: 1,
          explanation: "A clear first step is to identify the goal before choosing details or procedures.",
          options: ["Guess quickly", "Identify the goal", "Skip the model", "Memorize only"],
          question: `What should you do first when studying ${topic}?`
        },
        {
          answerIndex: 2,
          explanation: "A model makes relationships visible and helps organize the explanation.",
          options: ["It replaces learning", "It hides mistakes", "It shows relationships", "It removes practice"],
          question: "Why is a model or representation useful?"
        },
        {
          answerIndex: 0,
          explanation: "Explaining steps shows understanding better than copying an answer.",
          options: ["Explain each step", "Hide your work", "Avoid examples", "Only copy answers"],
          question: "Which habit best supports learning?"
        },
        {
          answerIndex: 3,
          explanation: "A focused question helps identify the exact weak area for practice or live tutoring.",
          options: ["Say nothing", "Change subject", "Rush ahead", "Ask a focused question"],
          question: "What should you do if a step is confusing?"
        },
        {
          answerIndex: 1,
          explanation: "Practice with feedback reveals what is understood and what needs review.",
          options: ["Only read notes", "Practice with feedback", "Avoid examples", "Skip review"],
          question: "Which method helps most after a guided example?"
        },
        {
          answerIndex: 0,
          explanation: "A useful next step targets the student's current weak spot.",
          options: ["Target the weak spot", "Repeat everything forever", "Stop practicing", "Ignore mistakes"],
          question: "What makes a next session useful?"
        }
      ]
    },
    title: `${topic} ${mode}`,
    warmUp: `In two minutes, write what you already know about ${topic}, one example you can think of, and one question you want answered today.`
  };
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text.slice(0, 500) } };
  }
}

async function requestOpenAiLesson({
  apiKey,
  prompt
}: {
  apiKey: string;
  prompt: string;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), openAiStartTimeoutMs);
  const body = {
    background: true,
    input: prompt,
    max_output_tokens: 6000,
    model: openAiLessonModel,
    text: {
      format: {
        type: "json_schema",
        ...lessonJsonSchema
      }
    }
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    return {
      payload: await readJsonResponse(response),
      response
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!isAiAccessAllowed(request)) {
    return NextResponse.json({ error: aiAccessError }, { status: 401 });
  }

  let body: LessonRequest;
  try {
    body = (await request.json()) as LessonRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const grade = cleanText(body.grade, 40);
  const duration = cleanText(body.duration, 60);
  const subject = cleanText(body.subject, 60);
  const topic = cleanText(body.topic, 90);
  const level = cleanText(body.level, 40);
  const goal = cleanText(body.goal, 60);
  const mode = cleanText(body.mode, 40);
  const teachingStyle = cleanText(body.teachingStyle, 40);
  const difficulty = cleanText(body.difficulty, 40);
  const language = cleanText(body.language, 40);
  const includeInLesson = Array.isArray(body.includeInLesson)
    ? body.includeInLesson.map((item) => cleanText(item, 40)).filter((item) => allowedLessonIncludes.has(item)).slice(0, 10)
    : [];
  const studentQuestion = cleanText(body.studentQuestion, 900);

  if (
    !allowedGrades.has(grade) ||
    !allowedDurations.has(duration) ||
    !allowedSubjects.has(subject) ||
    !allowedLevels.has(level) ||
    !allowedGoals.has(goal) ||
    !allowedModes.has(mode) ||
    !allowedTeachingStyles.has(teachingStyle) ||
    !allowedDifficulties.has(difficulty) ||
    !allowedLanguages.has(language) ||
    topic.length < 3
  ) {
    return NextResponse.json({ error: "Please choose valid lesson options and topic." }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured for this deployment, so the live AI lesson cannot be generated." },
      { status: 503 }
    );
  }

  const prompt = `
You are an experienced online tutor and curriculum designer for NovaSprout Learning.

Create a personalized tutoring output using original content, aligned to common U.S. learning expectations without copying any school syllabus, textbook, worksheet, or proprietary curriculum.
Create a large pool of student-facing lesson content first: explanations, examples, vocabulary, misconceptions, visual descriptions, practice, quiz items, and next steps. The website will distribute that content into private timed slides, so do not write tutor instructions or a separate slide deck outline.
Every major content field should teach, not label. Avoid one-line placeholders. Use 2-4 clear student-facing sentences for concept explanations, guided examples, and fullLessonSegments whenever the output type is not a quick explanation.

Student context:
- Grade or level: ${grade}
- Subject: ${subject}
- Topic: ${topic}
- Current level: ${level}
- Parent/student goal: ${goal}
- Requested output: ${mode}
- Session length: ${duration}
- Teaching style: ${teachingStyle}
- Difficulty: ${difficulty}
- Language support: ${language}
- Include in lesson: ${includeInLesson.length ? includeInLesson.join(", ") : "Core lesson, practice, quiz, and live tutor option"}
- Student question or concern: ${studentQuestion || "No extra question provided."}

Present AI Tutor as a standalone self-guided service. Live Tutoring is a separate service and must not require completing an AI lesson first.
If Live tutor option is included, make recommendedNextSession mention what lesson history, quiz results, and weak areas a human tutor should receive.
For Quick explanation, make the lesson concise and direct.
For Comprehensive lesson, Private guided lesson, Printable PDF lesson, or Presentation, include 4-6 useful fullLessonSegments.
For Practice worksheet, include more practiceQuestions with hints and answers.
For Interactive quiz or Exam preparation, include 6 multiple-choice questions with one correct answerIndex from 0 to 3.
For Flashcards or Study notes, make vocabulary and summaries especially strong.
Make the output usable as independent student study material, not just a tutor plan.
Include essential vocabulary in the conceptExplanation when relevant.
Use the requested teaching style, difficulty, and language support.
Make conceptExplanation substantial enough to become several short slides. Include facts, relationships, visual descriptions, and common confusions.
Make fullLessonSegments student-facing content sections, not timing instructions for a tutor. Avoid phrases like "tutor explains", "teacher asks", "have the student", or "the tutor should".
Include topic-specific vocabulary naturally in conceptExplanation and guidedExample so the deck can build a strong keyword slide.
For visual subjects, describe exactly what should be shown in diagrams/images, using labels and spatial relationships where useful.
Make guidedExample include clear steps and a final check.
Make practiceQuestions self-contained and include a short hint and answer/explanation in plain text, for example: "Try: ... Hint: ... Answer: ... Why: ..."
Make quickAssessment include answerable questions with brief answer/explanation text when possible.
Avoid teacher-only wording such as "whole-class", "tutor-guided move", "teacher should", or "ask the student to" in student-facing explanation fields.
Use ASCII arrows as "to" instead of "->".
Use plain text only. Avoid LaTeX backslashes, markdown, code fences, comments, or explanatory text outside the JSON.
Keep every field brief enough that the full response is complete.
Return only the JSON object. Do not include markdown, code fences, comments, or explanatory text outside the JSON.
Keep claims cautious. Do not promise grades, test scores, admissions results, diagnosis, therapy, or guaranteed mastery.
`;

  try {
    const { payload, response } = await requestOpenAiLesson({ apiKey, prompt });

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
          payload?.error?.message ??
          payload?.message ??
          `OpenAI returned ${response.status}.`
        },
        { status: 502 }
      );
    }

    const responsePayload = payload as { id?: unknown; status?: unknown } | null;
    const responseId = typeof responsePayload?.id === "string" ? responsePayload.id : "";
    const generationStatus = typeof responsePayload?.status === "string" ? responsePayload.status : "";

    if (generationStatus === "completed") {
      const lesson = parseAiLessonJson(extractAiLessonOutputText(payload));
      if (!lesson) {
        return NextResponse.json(
          { error: "The live AI response was incomplete. Please try generating the lesson again." },
          { status: 422 }
        );
      }
      return NextResponse.json({ lesson, status: "completed" });
    }

    if (responseId && ["queued", "in_progress"].includes(generationStatus)) {
      return NextResponse.json(
        { responseId, status: generationStatus },
        { status: 202 }
      );
    }

    return NextResponse.json(
      { error: "OpenAI did not start the background lesson. Please try again." },
      { status: 502 }
    );
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      {
        error: timedOut
          ? "The AI lesson could not be started in time. Please try again."
          : error instanceof Error
            ? `Could not reach the live AI lesson service: ${error.message}.`
            : "Could not reach the live AI lesson service."
      },
      { status: timedOut ? 504 : 502 }
    );
  }
}
